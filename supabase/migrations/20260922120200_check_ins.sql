-- Check-in events. Live occupancy is the count of rows still open.

create table check_ins (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references profiles (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  checked_in_by uuid references profiles (id) on delete set null,
  check (checked_out_at is null or checked_out_at >= checked_in_at)
);

-- Enforces that a member cannot be checked in twice at once. The occupancy
-- count depends on this holding.
create unique index check_ins_one_open_per_member
  on check_ins (member_id) where checked_out_at is null;

create index check_ins_open_idx on check_ins (checked_in_at desc)
  where checked_out_at is null;

alter table check_ins enable row level security;

create policy check_ins_select on check_ins
  for select using (member_id = auth.uid() or is_staff());

create policy check_ins_staff_insert on check_ins
  for insert with check (is_staff());

create policy check_ins_staff_update on check_ins
  for update using (is_staff()) with check (is_staff());

-- Resolves a scanned QR token to a member, then toggles their check-in state.
-- SECURITY DEFINER so staff can look up by qr_token without a broad select
-- policy on it; the is_staff() guard is enforced inside.
create or replace function scan_check_in(token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target profiles%rowtype;
  open_row check_ins%rowtype;
begin
  if not is_staff() then
    raise exception 'not authorised';
  end if;

  select * into target from profiles where qr_token = token;
  if not found then
    raise exception 'unknown QR code';
  end if;

  select * into open_row from check_ins
  where member_id = target.id and checked_out_at is null;

  if found then
    update check_ins set checked_out_at = now() where id = open_row.id;
    return jsonb_build_object(
      'action', 'checked_out',
      'member_id', target.id,
      'full_name', target.full_name
    );
  end if;

  insert into check_ins (member_id, checked_in_by)
  values (target.id, auth.uid());

  return jsonb_build_object(
    'action', 'checked_in',
    'member_id', target.id,
    'full_name', target.full_name
  );
end;
$$;

-- Drives the live occupancy count on the admin dashboard.
alter publication supabase_realtime add table check_ins;

-- Lets the dashboard read a count without exposing individual rows.
create or replace function current_occupancy()
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::int from check_ins where checked_out_at is null;
$$;
