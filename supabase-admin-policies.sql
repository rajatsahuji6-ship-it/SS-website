-- Run once in Supabase SQL Editor
create policy "Authenticated insert sections" on public.sections for insert to authenticated with check (true);
create policy "Authenticated update sections" on public.sections for update to authenticated using (true) with check (true);
create policy "Authenticated delete sections" on public.sections for delete to authenticated using (true);
create policy "Authenticated insert products" on public.products for insert to authenticated with check (true);
create policy "Authenticated update products" on public.products for update to authenticated using (true) with check (true);
create policy "Authenticated delete products" on public.products for delete to authenticated using (true);
create policy "Public view product images" on storage.objects for select to public using (bucket_id='product image');
create policy "Authenticated upload product images" on storage.objects for insert to authenticated with check (bucket_id='product image');
create policy "Authenticated update product images" on storage.objects for update to authenticated using (bucket_id='product image') with check (bucket_id='product image');
create policy "Authenticated delete product images" on storage.objects for delete to authenticated using (bucket_id='product image');