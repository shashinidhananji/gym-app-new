-- Profiles extend auth.users with gym-specific fields and a role.

create type user_role as enum ('admin', 'trainer', 'member');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  role user_role not null default 'member',
  -- Not the user id: a separate token so a leaked QR can be rotated.
  qr_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create index profiles_role_idx on profiles (role);

-- SECURITY DEFINER so policies on profiles can call it without recursing
-- into their own RLS check.
create or replace function is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'trainer')
  );
$$;

create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table profiles enable row level security;

create policy profiles_select_own on profiles
  for select using (id = auth.uid() or is_staff());

create policy profiles_update_own on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_admin_update on profiles
  for update using (is_admin()) with check (is_admin());

-- New signups always land as 'member'. Promoting to staff is a deliberate
-- admin action, so role is never taken from client-supplied metadata.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
