-- Membership plans, member subscriptions, and the payment audit log.

create table membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'usd',
  interval text not null check (interval in ('month', 'year')),
  stripe_price_id text unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create type membership_status as enum (
  'active', 'trialing', 'past_due', 'canceled', 'incomplete'
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references profiles (id) on delete cascade,
  plan_id uuid references membership_plans (id) on delete set null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status membership_status not null default 'incomplete',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A member has at most one subscription record; Stripe state is mirrored onto it.
create unique index memberships_member_idx on memberships (member_id);
create index memberships_status_idx on memberships (status);

create table payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references profiles (id) on delete cascade,
  membership_id uuid references memberships (id) on delete set null,
  stripe_invoice_id text not null unique,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index payments_member_idx on payments (member_id, created_at desc);

alter table membership_plans enable row level security;
alter table memberships enable row level security;
alter table payments enable row level security;

-- Plans are a public catalogue to signed-in users; only admins edit them.
create policy plans_select on membership_plans
  for select to authenticated using (active or is_staff());

create policy plans_admin_write on membership_plans
  for all using (is_admin()) with check (is_admin());

-- Read-only to clients. Writes happen in the Stripe webhook via the service
-- role, which bypasses RLS, so a member cannot grant themselves a membership.
create policy memberships_select on memberships
  for select using (member_id = auth.uid() or is_staff());

create policy payments_select on payments
  for select using (member_id = auth.uid() or is_staff());
