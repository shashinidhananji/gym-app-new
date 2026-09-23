export type UserRole = 'admin' | 'trainer' | 'member'

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: UserRole
  qr_token: string
  created_at: string
}

export type BillingInterval = 'month' | 'year'

export interface MembershipPlan {
  id: string
  name: string
  description: string | null
  price_cents: number
  currency: string
  interval: BillingInterval
  stripe_price_id: string | null
  active: boolean
  created_at: string
}

export type MembershipStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'

export interface Membership {
  id: string
  member_id: string
  plan_id: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: MembershipStatus
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  member_id: string
  membership_id: string | null
  stripe_invoice_id: string
  amount_cents: number
  currency: string
  status: string
  paid_at: string | null
  created_at: string
}

export interface CheckIn {
  id: string
  member_id: string
  checked_in_at: string
  checked_out_at: string | null
  checked_in_by: string | null
}

export interface Schedule {
  id: string
  member_id: string
  trainer_id: string | null
  date: string
  notes: string | null
  created_at: string
}

export type ScheduleItemKind = 'food' | 'exercise'

export interface ScheduleItem {
  id: string
  schedule_id: string
  kind: ScheduleItemKind
  title: string
  detail: string | null
  time_of_day: string | null
  position: number
}

export function formatMoney(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}
