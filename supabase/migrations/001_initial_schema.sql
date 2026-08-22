create extension if not exists pgcrypto;

create type public.app_role as enum ('owner','manager','cashier','waiter');
create type public.product_category as enum ('beer','spirits','wine','soft_drinks','water','other');
create type public.sale_unit as enum ('bottle','shot');
create type public.order_status as enum ('open','held','awaiting_payment','paid','voided');
create type public.payment_method as enum ('cash','momo','card','gift_card','wallet');
create type public.payment_status as enum ('pending','successful','failed','reversed');
create type public.gift_card_status as enum ('active','redeemed','expired','disabled');
create type public.stock_movement_type as enum ('purchase','sale_bottle','open_for_shots','adjustment_in','adjustment_out','waste');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role public.app_role not null default 'waiter',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category public.product_category not null,
  bottle_price_pesewas bigint not null check (bottle_price_pesewas >= 0),
  shot_price_pesewas bigint check (shot_price_pesewas is null or shot_price_pesewas >= 0),
  sealed_bottle_stock integer not null default 0 check (sealed_bottle_stock >= 0),
  shots_per_bottle integer check (shots_per_bottle is null or shots_per_bottle > 0),
  open_bottle_shots_remaining integer not null default 0 check (open_bottle_shots_remaining >= 0),
  reorder_level integer not null default 0 check (reorder_level >= 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shot_configuration_consistent check (
    (shot_price_pesewas is null and shots_per_bottle is null and open_bottle_shots_remaining = 0)
    or
    (shot_price_pesewas is not null and shots_per_bottle is not null and open_bottle_shots_remaining <= shots_per_bottle)
  )
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  loyalty_points integer not null default 0 check (loyalty_points >= 0),
  created_at timestamptz not null default now()
);

create table public.bar_tables (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  occupied boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  table_id uuid references public.bar_tables(id),
  customer_id uuid references public.customers(id),
  opened_by uuid not null references public.profiles(id),
  status public.order_status not null default 'open',
  subtotal_pesewas bigint not null default 0 check (subtotal_pesewas >= 0),
  discount_pesewas bigint not null default 0 check (discount_pesewas >= 0),
  total_pesewas bigint not null default 0 check (total_pesewas >= 0),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  sale_unit public.sale_unit not null,
  quantity integer not null check (quantity > 0),
  unit_price_pesewas bigint not null check (unit_price_pesewas >= 0),
  line_total_pesewas bigint generated always as (quantity * unit_price_pesewas) stored,
  created_at timestamptz not null default now()
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  movement_type public.stock_movement_type not null,
  bottle_delta integer not null default 0,
  shot_delta integer not null default 0,
  order_id uuid references public.orders(id),
  performed_by uuid not null references public.profiles(id),
  reason text,
  created_at timestamptz not null default now()
);

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id),
  order_id uuid references public.orders(id),
  original_amount_pesewas bigint not null check (original_amount_pesewas > 0),
  outstanding_amount_pesewas bigint not null check (outstanding_amount_pesewas >= 0),
  due_date date,
  note text,
  created_at timestamptz not null default now()
);

create table public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references public.debts(id),
  amount_pesewas bigint not null check (amount_pesewas > 0),
  payment_method public.payment_method not null,
  recorded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  method public.payment_method not null,
  provider text,
  amount_pesewas bigint not null check (amount_pesewas > 0),
  status public.payment_status not null default 'pending',
  provider_reference text,
  idempotency_key uuid not null default gen_random_uuid(),
  phone_masked text,
  card_last4 text,
  raw_provider_metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_reference),
  unique(idempotency_key)
);

create table public.gift_cards (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  display_suffix text not null,
  initial_balance_pesewas bigint not null check (initial_balance_pesewas > 0),
  balance_pesewas bigint not null check (balance_pesewas >= 0),
  status public.gift_card_status not null default 'active',
  purchaser_customer_id uuid references public.customers(id),
  recipient_name text,
  expiry_date date,
  created_at timestamptz not null default now()
);

create table public.gift_card_transactions (
  id uuid primary key default gen_random_uuid(),
  gift_card_id uuid not null references public.gift_cards(id),
  order_id uuid references public.orders(id),
  amount_delta_pesewas bigint not null,
  reason text not null,
  recorded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.wallets (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  balance_pesewas bigint not null default 0 check (balance_pesewas >= 0),
  points integer not null default 0 check (points >= 0),
  updated_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.wallets(customer_id),
  amount_delta_pesewas bigint not null default 0,
  points_delta integer not null default 0,
  reason text not null,
  order_id uuid references public.orders(id),
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'general',
  amount_pesewas bigint not null check (amount_pesewas > 0),
  note text,
  recorded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  home_team text not null,
  away_team text not null,
  starts_at timestamptz not null,
  promotion_text text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index orders_created_at_idx on public.orders(created_at desc);
create index payments_created_at_idx on public.payments(created_at desc);
create index stock_movements_product_idx on public.stock_movements(product_id, created_at desc);
create index debts_customer_idx on public.debts(customer_id, outstanding_amount_pesewas);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.bar_tables enable row level security;
alter table public.orders enable row level security;
alter table public.order_lines enable row level security;
alter table public.stock_movements enable row level security;
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;
alter table public.payments enable row level security;
alter table public.gift_cards enable row level security;
alter table public.gift_card_transactions enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.expenses enable row level security;
alter table public.matches enable row level security;

create function public.current_role()
returns public.app_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create policy "read profiles" on public.profiles for select to authenticated using (true);
create policy "manage profiles" on public.profiles for all to authenticated
using (public.current_role() in ('owner','manager'))
with check (public.current_role() in ('owner','manager'));

create policy "read products" on public.products for select to authenticated using (true);
create policy "manage products" on public.products for all to authenticated
using (public.current_role() in ('owner','manager'))
with check (public.current_role() in ('owner','manager'));

create policy "manage customers" on public.customers for all to authenticated
using (public.current_role() in ('owner','manager','cashier','waiter'))
with check (public.current_role() in ('owner','manager','cashier','waiter'));

create policy "manage tables" on public.bar_tables for all to authenticated
using (public.current_role() in ('owner','manager','cashier','waiter'))
with check (public.current_role() in ('owner','manager','cashier','waiter'));

create policy "manage orders" on public.orders for all to authenticated
using (public.current_role() in ('owner','manager','cashier','waiter'))
with check (public.current_role() in ('owner','manager','cashier','waiter'));

create policy "manage order lines" on public.order_lines for all to authenticated
using (public.current_role() in ('owner','manager','cashier','waiter'))
with check (public.current_role() in ('owner','manager','cashier','waiter'));

create policy "read stock movements" on public.stock_movements for select to authenticated using (true);
create policy "create stock movements" on public.stock_movements for insert to authenticated
with check (public.current_role() in ('owner','manager','cashier'));

create policy "manage debts" on public.debts for all to authenticated
using (public.current_role() in ('owner','manager','cashier'))
with check (public.current_role() in ('owner','manager','cashier'));

create policy "manage debt payments" on public.debt_payments for all to authenticated
using (public.current_role() in ('owner','manager','cashier'))
with check (public.current_role() in ('owner','manager','cashier'));

create policy "read payments" on public.payments for select to authenticated using (true);
create policy "create payments" on public.payments for insert to authenticated
with check (public.current_role() in ('owner','manager','cashier'));
create policy "update payments" on public.payments for update to authenticated
using (public.current_role() in ('owner','manager'))
with check (public.current_role() in ('owner','manager'));

create policy "manage gift cards" on public.gift_cards for all to authenticated
using (public.current_role() in ('owner','manager','cashier'))
with check (public.current_role() in ('owner','manager','cashier'));

create policy "manage gift card transactions" on public.gift_card_transactions for all to authenticated
using (public.current_role() in ('owner','manager','cashier'))
with check (public.current_role() in ('owner','manager','cashier'));

create policy "manage wallets" on public.wallets for all to authenticated
using (public.current_role() in ('owner','manager','cashier'))
with check (public.current_role() in ('owner','manager','cashier'));

create policy "manage wallet transactions" on public.wallet_transactions for all to authenticated
using (public.current_role() in ('owner','manager','cashier'))
with check (public.current_role() in ('owner','manager','cashier'));

create policy "manage expenses" on public.expenses for all to authenticated
using (public.current_role() in ('owner','manager'))
with check (public.current_role() in ('owner','manager'));

create policy "read matches" on public.matches for select to authenticated using (true);
create policy "manage matches" on public.matches for all to authenticated
using (public.current_role() in ('owner','manager'))
with check (public.current_role() in ('owner','manager'));
