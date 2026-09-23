-- Trainer-assigned daily plans: one schedule per member per day, holding
-- both food and exercise items.

create table schedules (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references profiles (id) on delete cascade,
  trainer_id uuid references profiles (id) on delete set null,
  date date not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (member_id, date)
);

create index schedules_member_date_idx on schedules (member_id, date desc);

create table schedule_items (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references schedules (id) on delete cascade,
  kind text not null check (kind in ('food', 'exercise')),
  title text not null,
  detail text,
  time_of_day time,
  position integer not null default 0
);

create index schedule_items_schedule_idx on schedule_items (schedule_id, position);

alter table schedules enable row level security;
alter table schedule_items enable row level security;

create policy schedules_select on schedules
  for select using (member_id = auth.uid() or is_staff());

create policy schedules_staff_write on schedules
  for all using (is_staff()) with check (is_staff());

create policy schedule_items_select on schedule_items
  for select using (
    exists (
      select 1 from schedules s
      where s.id = schedule_id and (s.member_id = auth.uid() or is_staff())
    )
  );

create policy schedule_items_staff_write on schedule_items
  for all using (is_staff()) with check (is_staff());
