-- Emaarket marketplace schema. Requires 202610310001_auth_profiles.sql.

create function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'::public.app_role
  );
$$;

create table public.categories (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null unique check (length(trim(name)) between 1 and 100),
  description text not null default '',
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.artisan_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  display_name text not null check (length(trim(display_name)) between 1 and 120),
  bio text not null default '',
  story text not null default '',
  location text not null default '',
  district text not null default '',
  craft text not null default '',
  specialization text[] not null default '{}',
  experience_years integer not null default 0 check (experience_years between 0 and 100),
  languages text[] not null default '{}',
  phone text,
  avatar_url text,
  cooperative text,
  verified boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references public.artisan_profiles(id) on delete restrict,
  category_id text not null references public.categories(id) on update cascade on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) between 1 and 200),
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  original_price numeric(12,2) check (original_price is null or original_price >= price),
  material text not null default '',
  dimensions text not null default '',
  care_instructions text not null default '',
  customizable boolean not null default false,
  featured boolean not null default false,
  bulk_available boolean not null default false,
  min_bulk_quantity integer check (min_bulk_quantity is null or min_bulk_quantity > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_status_idx on public.products(category_id, status);
create index products_artisan_status_idx on public.products(artisan_id, status);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);
create index product_images_product_sort_idx on public.product_images(product_id, sort_order);

create table public.inventory (
  product_id uuid primary key references public.products(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  reserved integer not null default 0 check (reserved >= 0 and reserved <= quantity),
  updated_at timestamptz not null default now()
);
create function public.initialize_product_inventory()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.inventory (product_id, quantity) values (new.id, 0);
  return new;
end;
$$;
create trigger products_initialize_inventory after insert on public.products
  for each row execute function public.initialize_product_inventory();

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  updated_at timestamptz not null default now()
);
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity between 1 and 10000),
  created_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create table public.wishlists (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  currency char(3) not null default 'INR' check (currency = 'INR'),
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  shipping_amount numeric(12,2) not null default 0 check (shipping_amount >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  shipping_name text not null check (length(trim(shipping_name)) between 1 and 160),
  shipping_phone text not null default '',
  shipping_address jsonb not null default '{}'::jsonb check (jsonb_typeof(shipping_address) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_customer_created_idx on public.orders(customer_id, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  artisan_id uuid not null references public.artisan_profiles(id) on delete restrict,
  product_name text not null,
  product_image_url text,
  quantity integer not null check (quantity between 1 and 10000),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) generated always as (quantity * unit_price) stored
);
create index order_items_order_idx on public.order_items(order_id);
create index order_items_artisan_idx on public.order_items(artisan_id);

create function public.is_order_artisan(target_order uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.order_items oi
    join public.artisan_profiles ap on ap.id = oi.artisan_id
    where oi.order_id = target_order and ap.user_id = (select auth.uid())
  );
$$;

create table public.bulk_order_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  artisan_id uuid references public.artisan_profiles(id) on delete set null,
  category_id text not null references public.categories(id) on update cascade on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  business_name text not null default '',
  contact_name text not null check (length(trim(contact_name)) between 1 and 160),
  email text not null check (position('@' in email) > 1),
  phone text not null default '',
  quantity integer not null check (quantity > 0),
  budget numeric(12,2) check (budget is null or budget >= 0),
  deadline date,
  customization text not null default '' check (length(customization) <= 5000),
  response_amount numeric(12,2) check (response_amount is null or response_amount > 0),
  response_note text not null default '',
  status text not null default 'submitted' check (status in ('submitted', 'quoted', 'accepted', 'declined', 'completed', 'cancelled')),
  constraint quote_has_amount check (status <> 'quoted' or response_amount is not null),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bulk_requests_customer_idx on public.bulk_order_requests(customer_id, created_at desc);
create index bulk_requests_artisan_idx on public.bulk_order_requests(artisan_id, created_at desc);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  customer_name text not null default 'Customer' check (length(customer_name) between 1 and 160),
  artisan_id uuid not null references public.artisan_profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  customer_read_at timestamptz not null default now(),
  artisan_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, artisan_id, product_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 10000),
  kind text not null default 'text' check (kind in ('text', 'offer')),
  offer_amount numeric(12,2) check (offer_amount is null or offer_amount > 0),
  created_at timestamptz not null default now(),
  constraint offer_requires_amount check (kind <> 'offer' or offer_amount is not null)
);
create index messages_conversation_created_idx on public.messages(conversation_id, created_at);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade unique,
  rating smallint not null check (rating between 1 and 5),
  title text not null default '' check (length(title) <= 160),
  body text not null default '' check (length(body) <= 5000),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  unique (customer_id, product_id)
);
create index reviews_product_published_idx on public.reviews(product_id, is_published);

-- Seed the storefront categories currently used by the Emaarket UI.
insert into public.categories (id, name, description, image_url, sort_order) values
  ('phanek', 'Phanek', 'Hand-woven wrap skirts with the iconic Mayek Naibi border.', '/images/phanek.png', 1),
  ('innaphi', 'Innaphi', 'Sheer, airy shawls draped over the shoulder for ceremonies.', '/images/innaphi.png', 2),
  ('shawls', 'Shawls', 'Moirang Phee and Lasingphee woven on traditional looms.', '/images/shawl.png', 3),
  ('bamboo', 'Bamboo Crafts', 'Baskets, bowls and lamps from bamboo and cane.', '/images/bamboo.png', 4),
  ('pottery', 'Longpi Pottery', 'Wheel-free black stone pottery from Ukhrul.', '/images/pottery.png', 5),
  ('accessories', 'Accessories', 'Handmade clutches, jewellery and woven keepsakes.', '/images/accessories.png', 6);

alter table public.categories enable row level security;
alter table public.artisan_profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.bulk_order_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

create policy "Active categories are public" on public.categories for select using (is_active or public.is_admin());
create policy "Admins manage categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Active artisan profiles are public" on public.artisan_profiles for select using ((is_active and verified) or user_id = (select auth.uid()) or public.is_admin());
create policy "Artisans create own profile" on public.artisan_profiles for insert to authenticated with check (user_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('artisan', 'admin')));
create policy "Artisans update own profile" on public.artisan_profiles for update to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy "Admins delete artisan profiles" on public.artisan_profiles for delete to authenticated using (public.is_admin());
-- Prevent sellers from granting themselves the verification badge.
revoke update on public.artisan_profiles from authenticated;
grant update (slug, display_name, bio, story, location, district, craft, specialization, experience_years, languages, phone, avatar_url, cooperative, is_active) on public.artisan_profiles to authenticated;

create policy "Published products are public" on public.products for select using (status = 'published' or exists (select 1 from public.artisan_profiles ap where ap.id = artisan_id and ap.user_id = (select auth.uid())) or public.is_admin());
create policy "Artisans create own products" on public.products for insert to authenticated with check (exists (select 1 from public.artisan_profiles ap where ap.id = artisan_id and ap.user_id = (select auth.uid())));
create policy "Artisans update own products" on public.products for update to authenticated using (exists (select 1 from public.artisan_profiles ap where ap.id = artisan_id and ap.user_id = (select auth.uid())) or public.is_admin()) with check (exists (select 1 from public.artisan_profiles ap where ap.id = artisan_id and ap.user_id = (select auth.uid())) or public.is_admin());
create policy "Artisans delete own products" on public.products for delete to authenticated using (exists (select 1 from public.artisan_profiles ap where ap.id = artisan_id and ap.user_id = (select auth.uid())) or public.is_admin());

create policy "Product images public for published products" on public.product_images for select using (exists (select 1 from public.products p where p.id = product_id and p.status = 'published') or public.is_admin());
create policy "Product owners manage images" on public.product_images for all to authenticated using (exists (select 1 from public.products p join public.artisan_profiles ap on ap.id = p.artisan_id where p.id = product_id and ap.user_id = (select auth.uid())) or public.is_admin()) with check (exists (select 1 from public.products p join public.artisan_profiles ap on ap.id = p.artisan_id where p.id = product_id and ap.user_id = (select auth.uid())) or public.is_admin());

create policy "Inventory public for published products" on public.inventory for select using (exists (select 1 from public.products p where p.id = product_id and p.status = 'published') or public.is_admin());
create policy "Product owners manage inventory" on public.inventory for all to authenticated using (exists (select 1 from public.products p join public.artisan_profiles ap on ap.id = p.artisan_id where p.id = product_id and ap.user_id = (select auth.uid())) or public.is_admin()) with check (exists (select 1 from public.products p join public.artisan_profiles ap on ap.id = p.artisan_id where p.id = product_id and ap.user_id = (select auth.uid())) or public.is_admin());

create policy "Users manage own carts" on public.carts for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users manage own cart items" on public.cart_items for all to authenticated using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))) with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())) and exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy "Users manage own wishlist" on public.wishlists for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Customers and assigned artisans read orders" on public.orders for select to authenticated using (customer_id = (select auth.uid()) or public.is_order_artisan(id) or public.is_admin());
create policy "Admins manage orders" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Assigned artisans update fulfillment status" on public.orders for update to authenticated
  using (public.is_order_artisan(id) or public.is_admin())
  with check (status in ('processing', 'shipped', 'delivered', 'cancelled') and (public.is_order_artisan(id) or public.is_admin()));
revoke update on public.orders from authenticated;
grant update (status) on public.orders to authenticated;
create policy "Order participants read line items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid())) or public.is_order_artisan(order_id) or public.is_admin());
create policy "Admins manage order items" on public.order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

create function public.apply_order_inventory_status()
returns trigger language plpgsql security definer set search_path = '' as $$
declare item record;
begin
  if new.status = old.status then return new; end if;
  if not (
    (old.status in ('pending', 'paid') and new.status in ('processing', 'cancelled')) or
    (old.status = 'processing' and new.status in ('shipped', 'cancelled')) or
    (old.status = 'shipped' and new.status = 'delivered')
  ) then raise exception 'Invalid order status transition'; end if;
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    for item in select oi.product_id, oi.quantity from public.order_items oi where oi.order_id = new.id and oi.product_id is not null loop
      update public.inventory set reserved = greatest(0, reserved - item.quantity), updated_at = now() where product_id = item.product_id;
    end loop;
  elsif new.status = 'delivered' and old.status <> 'delivered' then
    for item in select oi.product_id, oi.quantity from public.order_items oi where oi.order_id = new.id and oi.product_id is not null loop
      update public.inventory set quantity = greatest(0, quantity - item.quantity), reserved = greatest(0, reserved - item.quantity), updated_at = now() where product_id = item.product_id;
    end loop;
  end if;
  return new;
end;
$$;
create trigger orders_apply_inventory_status after update of status on public.orders
  for each row execute function public.apply_order_inventory_status();

create policy "Customers read own bulk requests" on public.bulk_order_requests for select to authenticated using (customer_id = (select auth.uid()) or public.is_admin());
create policy "Admins manage bulk requests" on public.bulk_order_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Assigned artisans read bulk requests" on public.bulk_order_requests for select to authenticated using (exists (select 1 from public.artisan_profiles ap where ap.id = artisan_id and ap.user_id = (select auth.uid())));
create policy "Artisans browse unassigned requests" on public.bulk_order_requests for select to authenticated using (artisan_id is null and exists (select 1 from public.artisan_profiles ap where ap.user_id = (select auth.uid())));
create policy "Customers create own bulk requests" on public.bulk_order_requests for insert to authenticated with check (customer_id = (select auth.uid()));
create policy "Assigned artisans update requests" on public.bulk_order_requests for update to authenticated using (exists (select 1 from public.artisan_profiles ap where ap.id = artisan_id and ap.user_id = (select auth.uid())) or public.is_admin()) with check (exists (select 1 from public.artisan_profiles ap where ap.id = artisan_id and ap.user_id = (select auth.uid())) or public.is_admin());
-- Sellers can respond by changing status but cannot rewrite customer or request details.
revoke update on public.bulk_order_requests from authenticated;
grant update (status, response_amount, response_note) on public.bulk_order_requests to authenticated;
create function public.respond_to_bulk_request(target_request uuid, quote_amount numeric, quote_note text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare seller uuid;
begin
  if quote_amount <= 0 then raise exception 'Quote amount must be positive'; end if;
  if length(coalesce(quote_note, '')) > 5000 then raise exception 'Quote note is too long'; end if;
  select ap.id into seller from public.artisan_profiles ap where ap.user_id = (select auth.uid());
  if seller is null then raise exception 'An artisan profile is required'; end if;
  update public.bulk_order_requests set artisan_id = seller, response_amount = quote_amount,
    response_note = coalesce(quote_note, ''), status = 'quoted', updated_at = now()
  where id = target_request and status in ('submitted', 'quoted') and (artisan_id is null or artisan_id = seller);
  if not found then raise exception 'Request not available'; end if;
end;
$$;
revoke all on function public.respond_to_bulk_request(uuid, numeric, text) from public;
grant execute on function public.respond_to_bulk_request(uuid, numeric, text) to authenticated;

create policy "Conversation participants read conversations" on public.conversations for select to authenticated using (customer_id = (select auth.uid()) or exists (select 1 from public.artisan_profiles ap where ap.id = artisan_id and ap.user_id = (select auth.uid())) or public.is_admin());
create policy "Customers start conversations" on public.conversations for insert to authenticated with check (customer_id = (select auth.uid()));
create policy "Participants mark conversations read" on public.conversations for update to authenticated using (customer_id = (select auth.uid()) or exists (select 1 from public.artisan_profiles ap where ap.id = artisan_id and ap.user_id = (select auth.uid())) or public.is_admin()) with check (customer_id = (select auth.uid()) or exists (select 1 from public.artisan_profiles ap where ap.id = artisan_id and ap.user_id = (select auth.uid())) or public.is_admin());
revoke update on public.conversations from authenticated;
grant update (customer_read_at, artisan_read_at) on public.conversations to authenticated;
create policy "Participants read messages" on public.messages for select to authenticated using (exists (select 1 from public.conversations c where c.id = conversation_id and (c.customer_id = (select auth.uid()) or exists (select 1 from public.artisan_profiles ap where ap.id = c.artisan_id and ap.user_id = (select auth.uid())))) or public.is_admin());
create policy "Participants send messages as themselves" on public.messages for insert to authenticated with check (sender_id = (select auth.uid()) and exists (select 1 from public.conversations c where c.id = conversation_id and (c.customer_id = (select auth.uid()) or exists (select 1 from public.artisan_profiles ap where ap.id = c.artisan_id and ap.user_id = (select auth.uid())))));

create policy "Published reviews are public" on public.reviews for select using (is_published or customer_id = (select auth.uid()) or public.is_admin());
create policy "Customers review products they purchased" on public.reviews for insert to authenticated with check (
  customer_id = (select auth.uid()) and exists (
    select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
    where oi.id = public.reviews.order_item_id and oi.product_id = public.reviews.product_id and o.customer_id = (select auth.uid())
  )
);
create policy "Admins manage reviews" on public.reviews for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Keep timestamps current and expose collaboration tables to Supabase Realtime.
create function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger artisan_profiles_set_updated_at before update on public.artisan_profiles for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger inventory_set_updated_at before update on public.inventory for each row execute function public.set_updated_at();
create trigger carts_set_updated_at before update on public.carts for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger bulk_order_requests_set_updated_at before update on public.bulk_order_requests for each row execute function public.set_updated_at();
create trigger conversations_set_updated_at before update on public.conversations for each row execute function public.set_updated_at();

do $$
declare table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array['products', 'inventory', 'product_images', 'artisan_profiles', 'reviews', 'messages', 'conversations', 'orders', 'bulk_order_requests'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end;
$$;

-- Checkout derives all item names, artisan ownership, prices, and stock changes from trusted rows.
create function public.checkout_cart(shipping_name text, shipping_phone text, shipping_address jsonb)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
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
  values (customer, trim(shipping_name), coalesce(shipping_phone, ''), coalesce(shipping_address, '{}'::jsonb))
  returning id into new_order;

  for line in
    select ci.product_id, ci.quantity, p.name, p.price, p.artisan_id, inv.quantity as stock, inv.reserved
    from public.cart_items ci
    join public.products p on p.id = ci.product_id and p.status = 'published'
    join public.inventory inv on inv.product_id = p.id
    where ci.cart_id = cart_key
    order by ci.product_id
    for update of inv
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
revoke all on function public.checkout_cart(text, text, jsonb) from public;
grant execute on function public.checkout_cart(text, text, jsonb) to authenticated;
revoke insert on public.orders, public.order_items from anon, authenticated;

-- Publicly readable product images; uploads are confined to a folder named for the uploader's auth UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy "Anyone can view product image objects" on storage.objects for select using (bucket_id = 'product-images');
create policy "Users upload into own product image folder" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users update own product image objects" on storage.objects for update to authenticated using (bucket_id = 'product-images' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())) with check (bucket_id = 'product-images' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));
create policy "Users delete own product image objects" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));
