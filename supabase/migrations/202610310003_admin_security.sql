-- Admin-only user management. Ordinary users can read only their own profile;
-- no client, including an admin client, can change roles without the admin policy.
create policy "Admins read all user profiles" on public.profiles
  for select to authenticated using (public.is_admin());
create policy "Admins assign user roles" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
revoke update on public.profiles from authenticated;
grant update (role) on public.profiles to authenticated;

-- Published reviews are public, but buyer and purchase identifiers are not.
revoke select on public.reviews from anon, authenticated;
grant select (id, product_id, rating, title, body, is_published, created_at)
  on public.reviews to anon, authenticated;

-- Seller ownership policies must also check the user's current database role.
-- This prevents a demoted seller from continuing to write through the API.
create function public.is_artisan_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('artisan'::public.app_role, 'admin'::public.app_role)
  );
$$;

create function public.owns_artisan_profile(target_artisan uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.artisan_profiles ap
    join public.profiles p on p.id = ap.user_id
    where ap.id = target_artisan and ap.user_id = (select auth.uid())
      and p.role in ('artisan'::public.app_role, 'admin'::public.app_role)
  );
$$;
revoke all on function public.is_artisan_user() from public, anon;
grant execute on function public.is_artisan_user() to authenticated;
revoke all on function public.owns_artisan_profile(uuid) from public, anon;
grant execute on function public.owns_artisan_profile(uuid) to authenticated;

drop policy "Artisans update own profile" on public.artisan_profiles;
create policy "Active artisans update own profile" on public.artisan_profiles for update to authenticated
  using (public.owns_artisan_profile(id) or public.is_admin())
  with check (public.owns_artisan_profile(id) or public.is_admin());

drop policy "Artisans create own products" on public.products;
create policy "Active artisans create own products" on public.products for insert to authenticated
  with check (public.owns_artisan_profile(artisan_id));
drop policy "Artisans update own products" on public.products;
create policy "Active artisans update own products" on public.products for update to authenticated
  using (public.owns_artisan_profile(artisan_id) or public.is_admin())
  with check (public.owns_artisan_profile(artisan_id) or public.is_admin());
drop policy "Artisans delete own products" on public.products;
create policy "Active artisans delete own products" on public.products for delete to authenticated
  using (public.owns_artisan_profile(artisan_id) or public.is_admin());

drop policy "Product owners manage images" on public.product_images;
create policy "Active product owners manage images" on public.product_images for all to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (public.owns_artisan_profile(p.artisan_id) or public.is_admin())))
  with check (exists (select 1 from public.products p where p.id = product_id and (public.owns_artisan_profile(p.artisan_id) or public.is_admin())));
drop policy "Product owners manage inventory" on public.inventory;
create policy "Active product owners manage inventory" on public.inventory for all to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (public.owns_artisan_profile(p.artisan_id) or public.is_admin())))
  with check (exists (select 1 from public.products p where p.id = product_id and (public.owns_artisan_profile(p.artisan_id) or public.is_admin())));

create or replace function public.is_order_artisan(target_order uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.order_items oi
    join public.artisan_profiles ap on ap.id = oi.artisan_id
    join public.profiles p on p.id = ap.user_id
    where oi.order_id = target_order and ap.user_id = (select auth.uid())
      and p.role in ('artisan'::public.app_role, 'admin'::public.app_role)
  );
$$;

drop policy "Assigned artisans read bulk requests" on public.bulk_order_requests;
create policy "Active assigned artisans read bulk requests" on public.bulk_order_requests for select to authenticated
  using (public.owns_artisan_profile(artisan_id));
drop policy "Artisans browse unassigned requests" on public.bulk_order_requests;
create policy "Active artisans browse unassigned requests" on public.bulk_order_requests for select to authenticated
  using (artisan_id is null and public.is_artisan_user());
drop policy "Assigned artisans update requests" on public.bulk_order_requests;
create policy "Active assigned artisans update requests" on public.bulk_order_requests for update to authenticated
  using (public.owns_artisan_profile(artisan_id) or public.is_admin())
  with check (public.owns_artisan_profile(artisan_id) or public.is_admin());

create or replace function public.respond_to_bulk_request(target_request uuid, quote_amount numeric, quote_note text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare seller uuid;
begin
  if not public.is_artisan_user() then raise exception 'An active artisan role is required'; end if;
  if quote_amount is null or quote_amount <= 0 then raise exception 'Quote amount must be positive'; end if;
  if length(coalesce(quote_note, '')) > 5000 then raise exception 'Quote note is too long'; end if;
  select ap.id into seller from public.artisan_profiles ap where ap.user_id = (select auth.uid());
  if seller is null then raise exception 'An artisan profile is required'; end if;
  update public.bulk_order_requests set artisan_id = seller, response_amount = quote_amount,
    response_note = coalesce(quote_note, ''), status = 'quoted', updated_at = now()
  where id = target_request and status in ('submitted', 'quoted') and (artisan_id is null or artisan_id = seller);
  if not found then raise exception 'Request not available'; end if;
end;
$$;

drop policy "Conversation participants read conversations" on public.conversations;
create policy "Conversation participants read conversations" on public.conversations for select to authenticated
  using (customer_id = (select auth.uid()) or public.owns_artisan_profile(artisan_id) or public.is_admin());
drop policy "Participants mark conversations read" on public.conversations;
create policy "Active participants mark conversations read" on public.conversations for update to authenticated
  using (customer_id = (select auth.uid()) or public.owns_artisan_profile(artisan_id) or public.is_admin())
  with check (customer_id = (select auth.uid()) or public.owns_artisan_profile(artisan_id) or public.is_admin());
drop policy "Participants read messages" on public.messages;
create policy "Active participants read messages" on public.messages for select to authenticated
  using (exists (select 1 from public.conversations c where c.id = conversation_id
    and (c.customer_id = (select auth.uid()) or public.owns_artisan_profile(c.artisan_id))) or public.is_admin());
drop policy "Participants send messages as themselves" on public.messages;
create policy "Active participants send messages as themselves" on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and exists (select 1 from public.conversations c where c.id = conversation_id
    and (c.customer_id = (select auth.uid()) or public.owns_artisan_profile(c.artisan_id))));

create or replace function public.checkout_cart(shipping_name text, shipping_phone text, shipping_address jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  customer uuid := (select auth.uid());
  cart_key uuid;
  line record;
  new_order uuid;
  item_count integer := 0;
  order_subtotal numeric(12,2) := 0;
begin
  if customer is null then raise exception 'Authentication required'; end if;
  if length(trim(coalesce(shipping_name, ''))) not between 1 and 160 then raise exception 'Invalid shipping name'; end if;
  if length(coalesce(shipping_phone, '')) not between 7 and 24
    or coalesce(shipping_phone, '') !~ '^[+0-9() -]+$'
    or length(regexp_replace(coalesce(shipping_phone, ''), '[^0-9]', '', 'g')) not between 7 and 15 then
    raise exception 'Invalid shipping phone';
  end if;
  if shipping_address is null or not (shipping_address ?& array['address', 'city', 'pin'])
    or length(trim(coalesce(shipping_address ->> 'address', ''))) not between 1 and 500
    or length(trim(coalesce(shipping_address ->> 'city', ''))) not between 1 and 100
    or coalesce(shipping_address ->> 'pin', '') !~ '^[0-9]{6}$' then
    raise exception 'Invalid shipping address';
  end if;
  select c.id into cart_key from public.carts c where c.user_id = customer for update;
  if cart_key is null then raise exception 'Cart is empty'; end if;
  insert into public.orders (customer_id, shipping_name, shipping_phone, shipping_address)
  values (customer, trim(shipping_name), coalesce(shipping_phone, ''), shipping_address)
  returning id into new_order;
  for line in
    select ci.product_id, ci.quantity, p.name, p.price, p.artisan_id, inv.quantity as stock, inv.reserved
    from public.cart_items ci
    join public.products p on p.id = ci.product_id and p.status = 'published'
    join public.inventory inv on inv.product_id = p.id
    where ci.cart_id = cart_key order by ci.product_id for update of inv
  loop
    if line.stock - line.reserved < line.quantity then raise exception 'Insufficient inventory for %', line.name; end if;
    update public.inventory set reserved = reserved + line.quantity, updated_at = now() where product_id = line.product_id;
    insert into public.order_items (order_id, product_id, artisan_id, product_name, quantity, unit_price)
    values (new_order, line.product_id, line.artisan_id, line.name, line.quantity, line.price);
    order_subtotal := order_subtotal + (line.price * line.quantity);
    item_count := item_count + 1;
  end loop;
  if item_count = 0 then raise exception 'Cart has no available products'; end if;
  update public.orders set subtotal = order_subtotal,
    shipping_amount = case when order_subtotal >= 2500 then 0 else 120 end,
    total = order_subtotal + case when order_subtotal >= 2500 then 0 else 120 end,
    updated_at = now() where id = new_order;
  delete from public.cart_items where cart_id = cart_key;
  return new_order;
end;
$$;

drop policy "Users upload into own product image folder" on storage.objects;
create policy "Active artisans upload into own image folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text and public.is_artisan_user());
drop policy "Users update own product image objects" on storage.objects;
create policy "Active artisans update own image objects" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text and public.is_artisan_user())
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text and public.is_artisan_user());
drop policy "Users delete own product image objects" on storage.objects;
create policy "Active artisans delete own image objects" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text and public.is_artisan_user());

-- Defense in depth for checkout: order ownership and every order total are derived
-- from the authenticated caller's cart and current product/inventory rows.
revoke execute on function public.checkout_cart(text, text, jsonb) from public, anon;
grant execute on function public.checkout_cart(text, text, jsonb) to authenticated;
revoke execute on function public.respond_to_bulk_request(uuid, numeric, text) from public, anon;
grant execute on function public.respond_to_bulk_request(uuid, numeric, text) to authenticated;
revoke execute on function public.is_order_artisan(uuid) from public, anon;
grant execute on function public.is_order_artisan(uuid) to authenticated;
