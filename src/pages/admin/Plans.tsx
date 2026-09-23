import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatMoney, type BillingInterval, type MembershipPlan } from '../../lib/types'

export default function Plans() {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    price: '',
    interval: 'month' as BillingInterval,
    stripe_price_id: '',
    description: '',
  })

  async function load() {
    const { data } = await supabase
      .from('membership_plans')
      .select('*')
      .order('price_cents')
    setPlans((data ?? []) as MembershipPlan[])
  }

  useEffect(() => {
    load()
  }, [])

  async function addPlan(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const { error } = await supabase.from('membership_plans').insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      price_cents: Math.round(Number(form.price) * 100),
      interval: form.interval,
      stripe_price_id: form.stripe_price_id.trim() || null,
    })

    if (error) {
      setError(error.message)
      return
    }
    setForm({ name: '', price: '', interval: 'month', stripe_price_id: '', description: '' })
    load()
  }

  async function toggleActive(plan: MembershipPlan) {
    const { error } = await supabase
      .from('membership_plans')
      .update({ active: !plan.active })
      .eq('id', plan.id)
    if (error) setError(error.message)
    else load()
  }

  return (
    <section>
      <h2>Membership plans</h2>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Stripe price</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>
                {formatMoney(p.price_cents, p.currency)}
                <span className="muted"> / {p.interval}</span>
              </td>
              <td className="muted">
                {p.stripe_price_id || 'not linked'}
              </td>
              <td>
                <button className="link-btn" onClick={() => toggleActive(p)}>
                  {p.active ? 'active' : 'inactive'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {plans.length === 0 && <p className="muted">No plans yet.</p>}

      <h3>Add a plan</h3>
      <p className="muted">
        Create the Product and recurring Price in Stripe first, then paste its
        price ID here so checkout can use it.
      </p>
      {error && <p className="error">{error}</p>}
      <form className="inline-form wrap" onSubmit={addPlan}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <select
          value={form.interval}
          onChange={(e) =>
            setForm({ ...form, interval: e.target.value as BillingInterval })
          }
        >
          <option value="month">monthly</option>
          <option value="year">yearly</option>
        </select>
        <input
          placeholder="price_xxx"
          value={form.stripe_price_id}
          onChange={(e) => setForm({ ...form, stripe_price_id: e.target.value })}
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button type="submit">Add plan</button>
      </form>
    </section>
  )
}
