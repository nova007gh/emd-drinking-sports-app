create or replace function public.checkout_order(
  p_order_id uuid,
  p_payment_method public.payment_method,
  p_idempotency_key uuid
)
returns table (
  order_id uuid,
  payment_id uuid,
  total_pesewas bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_line record;
  v_product public.products%rowtype;
  v_stock integer;
  v_open_shots integer;
  v_needed integer;
  v_payment_id uuid;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.status = 'paid' then
    select id into v_payment_id
    from public.payments
    where order_id = p_order_id
      and idempotency_key = p_idempotency_key
    limit 1;

    if v_payment_id is null then
      raise exception 'Order already paid';
    end if;

    return query select v_order.id, v_payment_id, v_order.total_pesewas;
    return;
  end if;

  if v_order.status not in ('open','held','awaiting_payment') then
    raise exception 'Order cannot be checked out from status %', v_order.status;
  end if;

  update public.orders o
  set
    subtotal_pesewas = totals.subtotal,
    total_pesewas = greatest(totals.subtotal - o.discount_pesewas, 0),
    status = case when p_payment_method = 'cash' then 'paid' else 'awaiting_payment' end,
    closed_at = case when p_payment_method = 'cash' then now() else null end
  from (
    select coalesce(sum(line_total_pesewas),0)::bigint as subtotal
    from public.order_lines
    where order_id = p_order_id
  ) totals
  where o.id = p_order_id
  returning o.* into v_order;

  for v_line in
    select *
    from public.order_lines
    where order_id = p_order_id
    order by created_at, id
  loop
    select * into v_product
    from public.products
    where id = v_line.product_id
    for update;

    if v_line.sale_unit = 'bottle' then
      if v_product.sealed_bottle_stock < v_line.quantity then
        raise exception 'Insufficient bottle stock for %', v_product.name;
      end if;

      update public.products
      set sealed_bottle_stock = sealed_bottle_stock - v_line.quantity,
          updated_at = now()
      where id = v_product.id;

      insert into public.stock_movements(
        product_id, movement_type, bottle_delta, shot_delta, order_id, performed_by, reason
      ) values (
        v_product.id, 'sale_bottle', -v_line.quantity, 0, p_order_id, v_order.opened_by, 'POS checkout'
      );
    else
      if v_product.shots_per_bottle is null or v_product.shot_price_pesewas is null then
        raise exception 'Product % is not configured for shot sales', v_product.name;
      end if;

      v_stock := v_product.sealed_bottle_stock;
      v_open_shots := v_product.open_bottle_shots_remaining;
      v_needed := v_line.quantity;

      while v_needed > 0 loop
        if v_open_shots = 0 then
          if v_stock <= 0 then
            raise exception 'Insufficient shot stock for %', v_product.name;
          end if;

          v_stock := v_stock - 1;
          v_open_shots := v_product.shots_per_bottle;

          insert into public.stock_movements(
            product_id, movement_type, bottle_delta, shot_delta, order_id, performed_by, reason
          ) values (
            v_product.id, 'open_for_shots', -1, v_product.shots_per_bottle, p_order_id, v_order.opened_by, 'Opened bottle for shot/tot sales'
          );
        end if;

        v_open_shots := v_open_shots - 1;
        v_needed := v_needed - 1;
      end loop;

      update public.products
      set sealed_bottle_stock = v_stock,
          open_bottle_shots_remaining = v_open_shots,
          updated_at = now()
      where id = v_product.id;

      insert into public.stock_movements(
        product_id, movement_type, bottle_delta, shot_delta, order_id, performed_by, reason
      ) values (
        v_product.id, 'adjustment_out', 0, -v_line.quantity, p_order_id, v_order.opened_by, 'Shot/tot consumption'
      );
    end if;
  end loop;

  insert into public.payments(
    order_id,
    method,
    provider,
    amount_pesewas,
    status,
    idempotency_key
  ) values (
    p_order_id,
    p_payment_method,
    case when p_payment_method in ('momo','card') then 'eganow' else 'internal' end,
    v_order.total_pesewas,
    case when p_payment_method = 'cash' then 'successful' else 'pending' end,
    p_idempotency_key
  )
  on conflict (idempotency_key) do update
    set updated_at = now()
  returning id into v_payment_id;

  if p_payment_method = 'cash' then
    update public.bar_tables bt
    set occupied = false
    where bt.id = v_order.table_id;
  end if;

  return query select v_order.id, v_payment_id, v_order.total_pesewas;
end;
$$;

create or replace function public.apply_debt_payment(
  p_debt_id uuid,
  p_amount_pesewas bigint,
  p_method public.payment_method,
  p_recorded_by uuid
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_debt public.debts%rowtype;
begin
  if p_amount_pesewas <= 0 then
    raise exception 'Payment must be greater than zero';
  end if;

  select * into v_debt
  from public.debts
  where id = p_debt_id
  for update;

  if not found then
    raise exception 'Debt not found';
  end if;

  if p_amount_pesewas > v_debt.outstanding_amount_pesewas then
    raise exception 'Payment exceeds outstanding debt';
  end if;

  insert into public.debt_payments(debt_id, amount_pesewas, payment_method, recorded_by)
  values (p_debt_id, p_amount_pesewas, p_method, p_recorded_by);

  update public.debts
  set outstanding_amount_pesewas = outstanding_amount_pesewas - p_amount_pesewas
  where id = p_debt_id;

  return v_debt.outstanding_amount_pesewas - p_amount_pesewas;
end;
$$;

create or replace function public.redeem_gift_card(
  p_code_hash text,
  p_amount_pesewas bigint,
  p_order_id uuid,
  p_recorded_by uuid
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card public.gift_cards%rowtype;
begin
  if p_amount_pesewas <= 0 then
    raise exception 'Redemption must be greater than zero';
  end if;

  select * into v_card
  from public.gift_cards
  where code_hash = p_code_hash
  for update;

  if not found then
    raise exception 'Gift card not found';
  end if;

  if v_card.status <> 'active' then
    raise exception 'Gift card is not active';
  end if;

  if v_card.expiry_date is not null and v_card.expiry_date < current_date then
    update public.gift_cards set status = 'expired' where id = v_card.id;
    raise exception 'Gift card has expired';
  end if;

  if v_card.balance_pesewas < p_amount_pesewas then
    raise exception 'Insufficient gift card balance';
  end if;

  update public.gift_cards
  set balance_pesewas = balance_pesewas - p_amount_pesewas,
      status = case when balance_pesewas - p_amount_pesewas = 0 then 'redeemed' else 'active' end
  where id = v_card.id;

  insert into public.gift_card_transactions(
    gift_card_id, order_id, amount_delta_pesewas, reason, recorded_by
  ) values (
    v_card.id, p_order_id, -p_amount_pesewas, 'POS redemption', p_recorded_by
  );

  return v_card.balance_pesewas - p_amount_pesewas;
end;
$$;
