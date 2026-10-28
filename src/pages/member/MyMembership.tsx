import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import {
  formatMoney,
  type Membership,
  type MembershipPlan,
  type Payment,
} from '../../lib/types'

export default function MyMembership() {
  const { profile } = useAuth()
  const [membership, setMembership] = useState<Membership | null>(null)
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return

    async function load() {
      const [m, p, pay] = await Promise.all([
        supabase.from('memberships').select('*').maybeSingle(),
        supabase.from('membership_plans').select('*').eq('active', true),
        supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
      ])
      setMembership(m.data as Membership | null)
      setPlans((p.data ?? []) as MembershipPlan[])
      setPayments((pay.data ?? []) as Payment[])
    }

    load()
  }, [profile])

  async function startCheckout(planId: string) {
    setBusy(planId)
    setError(null)
    const { data, error } = await supabase.functions.invoke(
      'create-checkout-session',
      { body: { plan_id: planId } },
    )
    if (error) {
      setError(error.message)
      setBusy(null)
      return
    }
    window.location.href = data.url
  }

  async function openPortal() {
    setBusy('portal')
    setError(null)
    const { data, error } = await supabase.functions.invoke(
      'create-portal-session',
      { body: {} },
    )
    if (error) {
      setError(error.message)
      setBusy(null)
      return
    }
    window.location.href = data.url
  }

  const isActive =
    membership?.status === 'active' || membership?.status === 'trialing'

  return (
    <section>
      <h2>Membership</h2>

      <div className="card">
        {membership ? (
          <>
            <p>
              Status: <strong className={`status status-${membership.status}`}>
                {membership.status}
              </strong>
            </p>
            {membership.current_period_end && (
              <p className="muted">
                {isActive ? 'Renews' : 'Ended'}{' '}
                {new Date(membership.current_period_end).toLocaleDateString()}
              </p>
            )}
            <button onClick={openPortal} disabled={busy === 'portal'}>
              {busy === 'portal' ? 'Opening…' : 'Manage billing'}
            </button>
          </>
        ) : (
          <p className="muted">No active membership.</p>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {!isActive && (
        <>
          <h3>Choose a plan</h3>
          <div className="plan-cards">
            {plans.map((plan) => (
              <div key={plan.id} className="card">
                <h4>{plan.name}</h4>
                <p className="price">
                  {formatMoney(plan.price_cents, plan.currency)}
                  <span className="muted"> / {plan.interval}</span>
                </p>
                {plan.description && <p className="muted">{plan.description}</p>}
                <button
                  onClick={() => startCheckout(plan.id)}
                  disabled={busy === plan.id || !plan.stripe_price_id}
                >
                  {busy === plan.id ? 'Redirecting…' : 'Subscribe'}
                </button>
              </div>
            ))}
            {plans.length === 0 && <p className="muted">No plans available.</p>}
          </div>
        </>
      )}

      {payments.length > 0 && (
        <>
          <h3>Payment history</h3>
          <table className="table">
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.paid_at
                      ? new Date(p.paid_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td>{formatMoney(p.amount_cents, p.currency)}</td>
                  <td className="muted">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}
