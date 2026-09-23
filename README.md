# Gym App

Gym management app: memberships with Stripe billing, trainer-assigned daily
food and exercise plans, and live occupancy tracking via QR check-in.

React + Vite + TypeScript on the frontend, Supabase (Postgres, Auth, Realtime,
Edge Functions) on the backend.

## Setup

### 1. Install

```bash
npm install
cp .env.example .env
```

### 2. Supabase

Create a project at [supabase.com](https://supabase.com), then put the Project
URL and anon key into `.env`.

Apply the schema — either paste each file in `supabase/migrations/` into the
SQL editor in order, or use the CLI:

```bash
supabase link --project-ref <your-ref>
supabase db push
```

Make yourself an admin after signing up:

```sql
update profiles set role = 'admin' where id = '<your-user-id>';
```

### 3. Stripe

Create a Product with a recurring Price per membership tier. Add each plan
under **Plans** in the admin UI, pasting its `price_xxx` ID.

Set the Edge Function secrets and deploy:

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_xxx \
  STRIPE_WEBHOOK_SECRET=whsec_xxx \
  SITE_URL=http://localhost:5173

supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
# Stripe calls this one unauthenticated, so JWT verification must be off.
supabase functions deploy stripe-webhook --no-verify-jwt
```

Point a Stripe webhook at the `stripe-webhook` function URL, subscribed to
`checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, and
`invoice.payment_failed`.

### 4. Run

```bash
npm run dev
```

## How it works

**Roles.** Everyone signs up as `member`; an admin promotes to `trainer` or
`admin`. Row level security enforces this server-side — members can only read
their own data. Staff routes are also gated in the router, but the database is
the real boundary.

**Billing.** The frontend never writes membership state. `create-checkout-session`
sends the member to Stripe Checkout; the `stripe-webhook` function is the only
writer of `memberships` and `payments`, using the service role key. This means a
member cannot grant themselves a membership by calling the API directly.

**Occupancy.** Each member has a rotatable `qr_token` rendered as a QR code.
Staff scan it and the `scan_check_in` function toggles them in or out. A partial
unique index guarantees one open check-in per member, so live occupancy is just
the count of rows where `checked_out_at is null`. The admin dashboard subscribes
to Realtime on `check_ins`, so the count updates as people scan.

**Schedules.** A trainer builds one schedule per member per day, holding food and
exercise items. Members see today's plan on their home screen.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + production build |
| `npm run lint` | oxlint |
