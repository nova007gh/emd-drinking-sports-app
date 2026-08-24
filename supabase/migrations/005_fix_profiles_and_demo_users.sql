-- Migration 005: Fix profiles table schema + create demo users
-- Run this AFTER migrations 001-004 in the Supabase SQL Editor

-- Fix: rename full_name -> name to match what the app expects
alter table public.profiles rename column full_name to name;

-- Fix: add avatar_url column
alter table public.profiles add column if not exists avatar_url text;

-- Fix: add wallet_balance and loyalty_points to customers if missing
alter table public.customers add column if not exists wallet_balance_pesewas bigint not null default 0;
alter table public.customers add column if not exists total_spent_pesewas bigint not null default 0;
alter table public.customers add column if not exists visit_count integer not null default 0;
alter table public.customers add column if not exists last_purchase_date timestamptz;

-- ============================================================
-- DEMO USERS: Create auth users + profiles for each role
-- ============================================================
-- Note: Supabase Auth users are created via the auth schema.
-- We use the admin API-equivalent SQL to insert them.

-- Create auth users (these will get auth.uid() UUIDs)
-- We insert into auth.users directly since we don't have the admin API in SQL editor

DO $$
DECLARE
  owner_id uuid;
  manager_id uuid;
  cashier_id uuid;
  waiter_id uuid;
BEGIN
  -- Owner
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud, instance_id)
  VALUES (
    gen_random_uuid(),
    'owner@emd.com',
    crypt('owner123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO owner_id;

  -- Manager
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud, instance_id)
  VALUES (
    gen_random_uuid(),
    'manager@emd.com',
    crypt('manager123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO manager_id;

  -- Cashier
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud, instance_id)
  VALUES (
    gen_random_uuid(),
    'cashier@emd.com',
    crypt('cashier123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO cashier_id;

  -- Waiter
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud, instance_id)
  VALUES (
    gen_random_uuid(),
    'waiter@emd.com',
    crypt('waiter123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO waiter_id;

  -- Get IDs if they already existed
  SELECT id INTO owner_id FROM auth.users WHERE email = 'owner@emd.com';
  SELECT id INTO manager_id FROM auth.users WHERE email = 'manager@emd.com';
  SELECT id INTO cashier_id FROM auth.users WHERE email = 'cashier@emd.com';
  SELECT id INTO waiter_id FROM auth.users WHERE email = 'waiter@emd.com';

  -- Create profiles for each user
  INSERT INTO public.profiles (id, name, role, active)
  VALUES (owner_id, 'Emmanuel', 'owner', true)
  ON CONFLICT (id) DO UPDATE SET name = 'Emmanuel', role = 'owner';

  INSERT INTO public.profiles (id, name, role, active)
  VALUES (manager_id, 'Yaw', 'manager', true)
  ON CONFLICT (id) DO UPDATE SET name = 'Yaw', role = 'manager';

  INSERT INTO public.profiles (id, name, role, active)
  VALUES (cashier_id, 'Ama', 'cashier', true)
  ON CONFLICT (id) DO UPDATE SET name = 'Ama', role = 'cashier';

  INSERT INTO public.profiles (id, name, role, active)
  VALUES (waiter_id, 'Kojo', 'waiter', true)
  ON CONFLICT (id) DO UPDATE SET name = 'Kojo', role = 'waiter';

  -- Also create identities for auth (needed for login)
  INSERT INTO auth.identities (id, user_id, identity_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), id, gen_random_uuid(), id::text, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
  FROM auth.users WHERE email IN ('owner@emd.com', 'manager@emd.com', 'cashier@emd.com', 'waiter@emd.com')
  ON CONFLICT DO NOTHING;

END $$;

-- Verify
SELECT u.email, p.name, p.role FROM auth.users u JOIN public.profiles p ON u.id = p.id ORDER BY p.role;
