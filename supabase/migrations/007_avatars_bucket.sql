-- Migration 007: Create avatars storage bucket for profile pictures
-- Run this AFTER migrations 001-006 in the Supabase SQL Editor

-- Create the avatars bucket (public so profile pictures are publicly readable)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload their own avatar
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

-- Allow anyone to read avatars (public bucket)
create policy "Public can read avatars"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

-- Allow authenticated users to update their own avatar
create policy "Authenticated users can update avatars"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars');

-- Allow authenticated users to delete their own avatar
create policy "Authenticated users can delete avatars"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars');
