-- Auth identity profiles. Apply through Supabase CLI or SQL editor.
create type public.app_role as enum ('customer', 'artisan', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
create function public.create_profile_for_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare requested text;
begin
  requested := coalesce(new.raw_user_meta_data ->> 'requested_role', 'customer');
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when requested = 'artisan' then 'artisan'::public.app_role else 'customer'::public.app_role end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_user();

-- Admin is intentionally never a self-service signup role. Assign only by trusted operator:
-- update public.profiles set role = 'admin' where id = '<auth user UUID>';
