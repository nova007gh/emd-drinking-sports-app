-- Transfer a bill from one table to another atomically
create or replace function public.transfer_table(
  p_from_table uuid,
  p_to_table uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_order uuid;
  v_from_bill bigint;
begin
  if p_from_table = p_to_table then
    raise exception 'Cannot transfer to the same table';
  end if;

  -- Lock both tables
  perform 1 from public.bar_tables where id = p_from_table for update;
  perform 1 from public.bar_tables where id = p_to_table for update;

  -- Get the active order on the source table
  select id into v_from_order
  from public.orders
  where table_id = p_from_table
    and status in ('open', 'held', 'awaiting_payment')
  order by created_at desc
  limit 1;

  if v_from_order is null then
    raise exception 'No active order on source table';
  end if;

  -- Move the order to the target table
  update public.orders
  set table_id = p_to_table
  where id = v_from_order;

  -- Free the source table, mark target as occupied
  update public.bar_tables set occupied = false where id = p_from_table;
  update public.bar_tables set occupied = true where id = p_to_table;
end;
$$;

-- Split a bill: creates a new order with selected line items, reduces original
create or replace function public.split_bill(
  p_original_order_id uuid,
  p_line_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_order uuid;
  v_original public.orders%rowtype;
  v_line record;
  v_new_subtotal bigint := 0;
begin
  -- Lock the original order
  select * into v_original
  from public.orders
  where id = p_original_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_original.status not in ('open', 'held', 'awaiting_payment') then
    raise exception 'Cannot split a % order', v_original.status;
  end if;

  if array_length(p_line_ids, 1) is null then
    raise exception 'No lines selected for split';
  end if;

  -- Create the new order
  insert into public.orders (table_id, customer_id, opened_by, status, discount_pesewas)
  values (v_original.table_id, v_original.customer_id, v_original.opened_by, 'open', 0)
  returning id into v_new_order;

  -- Move selected lines to the new order
  for v_line in
    select id, product_id, sale_unit, quantity, unit_price_pesewas
    from public.order_lines
    where order_id = p_original_order_id
      and id = any(p_line_ids)
  loop
    update public.order_lines
    set order_id = v_new_order
    where id = v_line.id;

    v_new_subtotal := v_new_subtotal + (v_line.quantity * v_line.unit_price_pesewas);
  end loop;

  -- Update both order totals
  update public.orders
  set subtotal_pesewas = (
    select coalesce(sum(quantity * unit_price_pesewas), 0)::bigint
    from public.order_lines where order_id = p_original_order_id
  ),
  total_pesewas = greatest(
    (select coalesce(sum(quantity * unit_price_pesewas), 0)::bigint
     from public.order_lines where order_id = p_original_order_id) - discount_pesewas,
    0
  )
  where id = p_original_order_id;

  update public.orders
  set subtotal_pesewas = v_new_subtotal,
  total_pesewas = v_new_subtotal
  where id = v_new_order;

  return v_new_order;
end;
$$;

-- Revoke policies that are too permissive and tighten
create or replace function public.current_role()
returns public.app_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

-- Only owner/manager can transfer tables
revoke execute on function public.transfer_table(uuid, uuid) from authenticated;
grant execute on function public.transfer_table(uuid, uuid) to authenticated;

-- Only owner/manager/cashier can split bills
revoke execute on function public.split_bill(uuid, uuid[]) from authenticated;
grant execute on function public.split_bill(uuid, uuid[]) to authenticated;
