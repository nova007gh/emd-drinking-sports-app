-- Migration 008: Add admin and coordinator demo users
-- Run this AFTER migrations 001-007 in the Supabase SQL Editor

DO $$
DECLARE
  admin_id uuid;
  coordinator_id uuid;
BEGIN
  -- Admin
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud, instance_id)
  VALUES (
    gen_random_uuid(),
    'admin@emd.com',
    crypt('admin123', gen_salt('bf')),
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
  RETURNING id INTO admin_id;

  -- Coordinator
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud, instance_id)
  VALUES (
    gen_random_uuid(),
    'coordinator@emd.com',
    crypt('coordinator123', gen_salt('bf')),
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
  RETURNING id INTO coordinator_id;

  -- Get IDs if they already existed
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@emd.com';
  SELECT id INTO coordinator_id FROM auth.users WHERE email = 'coordinator@emd.com';

  -- Create profiles for each user
  INSERT INTO public.profiles (id, name, role, active)
  VALUES (admin_id, 'Emmanuel', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET name = 'Emmanuel', role = 'admin';

  INSERT INTO public.profiles (id, name, role, active)
  VALUES (coordinator_id, 'Akosua', 'coordinator', true)
  ON CONFLICT (id) DO UPDATE SET name = 'Akosua', role = 'coordinator';

  -- Also create identities for auth (needed for login)
  INSERT INTO auth.identities (id, user_id, identity_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), id, gen_random_uuid(), id::text, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
  FROM auth.users WHERE email IN ('admin@emd.com', 'coordinator@emd.com')
  ON CONFLICT DO NOTHING;

END $$;

-- Verify
SELECT u.email, p.name, p.role FROM auth.users u JOIN public.profiles p ON u.id = p.id WHERE u.email IN ('admin@emd.com', 'coordinator@emd.com');
