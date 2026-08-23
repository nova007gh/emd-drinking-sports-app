-- Migration 004: Customer Portal tables + new product categories
-- Adds: customer_orders, waiter_calls, chat_messages, event_bookings
-- Updates: product_category enum with new categories

-- ============================================================
-- 1. Add new product categories
-- ============================================================
alter type public.product_category add value if not exists 'energy_drinks';
alter type public.product_category add value if not exists 'cigarettes';
alter type public.product_category add value if not exists 'snacks';
alter type public.product_category add value if not exists 'juice';

-- ============================================================
-- 2. Customer Orders (orders placed from the customer portal)
-- ============================================================
create type public.customer_order_status as enum ('pending','preparing','served','paid');

create table public.customer_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  table_id uuid references public.bar_tables(id) on delete set null,
  status public.customer_order_status not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_order_lines (
  id uuid primary key default gen_random_uuid(),
  customer_order_id uuid not null references public.customer_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  sale_unit public.sale_unit not null default 'bottle',
  unit_price_pesewas bigint not null check (unit_price_pesewas >= 0),
  quantity integer not null check (quantity > 0)
);

-- RLS for customer orders
alter table public.customer_orders enable row level security;
alter table public.customer_order_lines enable row level security;

-- Staff can see all customer orders
create policy "Staff can view customer orders"
  on public.customer_orders for select
  using (auth.role() = 'authenticated');

create policy "Staff can update customer order status"
  on public.customer_orders for update
  using (auth.role() = 'authenticated');

-- Customers can view their own orders
create policy "Customers can view own orders"
  on public.customer_orders for select
  using (true); -- In production, restrict by customer auth

-- Customers can create orders
create policy "Customers can create orders"
  on public.customer_orders for insert
  using (true);

create policy "Anyone can view order lines"
  on public.customer_order_lines for select
  using (true);

create policy "Customers can create order lines"
  on public.customer_order_lines for insert
  using (true);

-- ============================================================
-- 3. Waiter Calls (customer calls waiter from portal)
-- ============================================================
create type public.waiter_call_status as enum ('pending','accepted','arrived');

create table public.waiter_calls (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.bar_tables(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  waiter_id uuid references public.profiles(id) on delete set null,
  status public.waiter_call_status not null default 'pending',
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.waiter_calls enable row level security;

create policy "Staff can view waiter calls"
  on public.waiter_calls for select
  using (auth.role() = 'authenticated');

create policy "Staff can update waiter calls"
  on public.waiter_calls for update
  using (auth.role() = 'authenticated');

create policy "Customers can create waiter calls"
  on public.waiter_calls for insert
  using (true);

create policy "Customers can view waiter calls"
  on public.waiter_calls for select
  using (true);

-- ============================================================
-- 4. Chat Messages (customer-waiter chat)
-- ============================================================
create type public.chat_sender as enum ('customer','waiter');

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.bar_tables(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  waiter_id uuid references public.profiles(id) on delete set null,
  sender public.chat_sender not null,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "Staff can view chat messages"
  on public.chat_messages for select
  using (auth.role() = 'authenticated');

create policy "Staff can send chat messages"
  on public.chat_messages for insert
  using (auth.role() = 'authenticated');

create policy "Customers can view chat messages"
  on public.chat_messages for select
  using (true);

create policy "Customers can send chat messages"
  on public.chat_messages for insert
  using (true);

-- ============================================================
-- 5. Event Bookings (customer attends or reserves table for event)
-- ============================================================
create type public.event_booking_type as enum ('attend','reserve');

create table public.event_bookings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  customer_name text not null,
  table_id uuid references public.bar_tables(id) on delete set null,
  booking_type public.event_booking_type not null,
  created_at timestamptz not null default now()
);

alter table public.event_bookings enable row level security;

create policy "Staff can view event bookings"
  on public.event_bookings for select
  using (auth.role() = 'authenticated');

create policy "Customers can view event bookings"
  on public.event_bookings for select
  using (true);

create policy "Customers can create event bookings"
  on public.event_bookings for insert
  using (true);

-- ============================================================
-- 6. Bar settings (open/closed status)
-- ============================================================
create table public.bar_settings (
  id uuid primary key default gen_random_uuid(),
  is_open boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.bar_settings enable row level security;

create policy "Anyone can view bar settings"
  on public.bar_settings for select
  using (true);

create policy "Staff can update bar settings"
  on public.bar_settings for update
  using (auth.role() = 'authenticated');

create policy "Staff can insert bar settings"
  on public.bar_settings for insert
  using (auth.role() = 'authenticated');

-- Insert default setting
insert into public.bar_settings (is_open) values (true) on conflict do nothing;

-- ============================================================
-- 7. Wallet top-up tracking
-- ============================================================
create type public.wallet_topup_method as enum ('momo','card','cash');

create table public.wallet_topups (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  amount_pesewas bigint not null check (amount_pesewas > 0),
  method public.wallet_topup_method not null,
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.wallet_topups enable row level security;

create policy "Staff can view wallet topups"
  on public.wallet_topups for select
  using (auth.role() = 'authenticated');

create policy "Customers can view own topups"
  on public.wallet_topups for select
  using (true);

create policy "Customers can create topups"
  on public.wallet_topups for insert
  using (true);

-- ============================================================
-- 8. Updated_at triggers
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger customer_orders_updated_at
  before update on public.customer_orders
  for each row execute function public.update_updated_at();

create trigger waiter_calls_updated_at
  before update on public.waiter_calls
  for each row execute function public.update_updated_at();

create trigger bar_settings_updated_at
  before update on public.bar_settings
  for each row execute function public.update_updated_at();
