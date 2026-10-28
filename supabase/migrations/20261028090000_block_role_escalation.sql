-- profiles_update_own restricts which ROW a user may update but not which
-- COLUMNS, so any member could set their own role to 'admin'. Policies can't
-- compare OLD and NEW, so the column guard goes in a trigger instead.

create or replace function prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    raise exception 'only admins can change roles';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on profiles
  for each row execute function prevent_role_escalation();
