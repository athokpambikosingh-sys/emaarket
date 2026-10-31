-- Let customers discover active artisans before verification. Verification remains
-- a trust badge controlled by admins; it no longer hides an artisan's profile.
drop policy "Active artisan profiles are public" on public.artisan_profiles;
create policy "Active artisan profiles are public" on public.artisan_profiles
  for select using (is_active or user_id = (select auth.uid()) or public.is_admin());

drop policy "Published products are public" on public.products;
create policy "Published products from active artisans are public" on public.products
  for select using (
    (status = 'published' and exists (
      select 1 from public.artisan_profiles ap where ap.id = artisan_id and ap.is_active
    ))
    or exists (select 1 from public.artisan_profiles ap where ap.id = artisan_id and ap.user_id = (select auth.uid()))
    or public.is_admin()
  );

-- Artisans can edit their profiles, but cannot self-verify or reactivate a profile
-- that an admin has disabled.
create function public.guard_artisan_profile_controls()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    if new.user_id is distinct from old.user_id
      or new.verified is distinct from old.verified
      or new.is_active is distinct from old.is_active then
      raise exception 'Only an admin can change artisan ownership, verification, or active status';
    end if;
  end if;
  return new;
end;
$$;
create trigger artisan_profile_controls_guard
  before update on public.artisan_profiles
  for each row execute function public.guard_artisan_profile_controls();

create or replace function public.is_artisan_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    join public.artisan_profiles ap on ap.user_id = p.id
    where p.id = (select auth.uid()) and p.role in ('artisan'::public.app_role, 'admin'::public.app_role)
      and ap.is_active
  );
$$;

create or replace function public.owns_artisan_profile(target_artisan uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.artisan_profiles ap
    join public.profiles p on p.id = ap.user_id
    where ap.id = target_artisan and ap.user_id = (select auth.uid()) and ap.is_active
      and p.role in ('artisan'::public.app_role, 'admin'::public.app_role)
  );
$$;

create or replace function public.is_order_artisan(target_order uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.order_items oi
    join public.artisan_profiles ap on ap.id = oi.artisan_id
    join public.profiles p on p.id = ap.user_id
    where oi.order_id = target_order and ap.user_id = (select auth.uid()) and ap.is_active
      and p.role in ('artisan'::public.app_role, 'admin'::public.app_role)
  );
$$;

-- A chat can only be opened by a customer with an active artisan, and product
-- context must belong to that artisan. This avoids forged seller conversations.
drop policy "Customers start conversations" on public.conversations;
create policy "Customers start conversations with active artisans" on public.conversations
  for insert to authenticated with check (
    customer_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'customer'::public.app_role)
    and exists (select 1 from public.artisan_profiles ap where ap.id = artisan_id and ap.is_active)
    and (product_id is null or exists (
      select 1 from public.products p where p.id = conversations.product_id
        and p.artisan_id = conversations.artisan_id and p.status = 'published'
    ))
  );

-- Artisans can see only their own order lines. Customers and admins retain full
-- order detail access; the order-level row remains visible for fulfillment.
drop policy "Order participants read line items" on public.order_items;
create policy "Customers artisans and admins read order lines" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid()))
    or public.owns_artisan_profile(artisan_id)
    or public.is_admin()
  );

drop policy "Customers review products they purchased" on public.reviews;
create policy "Customers review delivered products they purchased" on public.reviews
  for insert to authenticated with check (
    customer_id = (select auth.uid()) and exists (
      select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
      where oi.id = public.reviews.order_item_id and oi.product_id = public.reviews.product_id
        and o.customer_id = (select auth.uid()) and o.status = 'delivered'
    )
  );
