-- Create a products bucket for product image uploads
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload product images
create policy "Authenticated users can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'products');

-- Allow anyone to read product images (public bucket)
create policy "Public can read product images"
  on storage.objects for select
  to public
  using (bucket_id = 'products');

-- Allow authenticated users to update product images
create policy "Authenticated users can update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'products');

-- Allow authenticated users to delete product images
create policy "Authenticated users can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'products');
