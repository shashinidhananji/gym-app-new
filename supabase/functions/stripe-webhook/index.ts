import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

// Service role: this function is the only writer of billing state.
const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

async function memberIdForCustomer(customerId: string): Promise<string | null> {
  const { data } = await admin
    .from('memberships')
    .select('member_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  if (data?.member_id) return data.member_id

  // Fall back to the metadata we set when creating the customer.
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return null
  return customer.metadata?.supabase_user_id ?? null
}

async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = sub.customer as string
  const memberId =
    sub.metadata?.supabase_user_id ?? (await memberIdForCustomer(customerId))
  if (!memberId) return

  let planId = sub.metadata?.plan_id ?? null
  if (!planId) {
    const priceId = sub.items.data[0]?.price.id
    const { data: plan } = await admin
      .from('membership_plans')
      .select('id')
      .eq('stripe_price_id', priceId)
      .maybeSingle()
    planId = plan?.id ?? null
  }

  await admin.from('memberships').upsert(
    {
      member_id: memberId,
      plan_id: planId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      status: sub.status,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'member_id' },
  )
}

async function recordInvoice(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  const memberId = await memberIdForCustomer(customerId)
  if (!memberId) return

  const { data: membership } = await admin
    .from('memberships')
    .select('id')
    .eq('member_id', memberId)
    .maybeSingle()

  await admin.from('payments').upsert(
    {
      member_id: memberId,
      membership_id: membership?.id ?? null,
      stripe_invoice_id: invoice.id,
      amount_cents: invoice.amount_paid ?? invoice.amount_due ?? 0,
      currency: invoice.currency,
      status: invoice.status ?? 'unknown',
      paid_at: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : null,
    },
    { onConflict: 'stripe_invoice_id' },
  )
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) return new Response('missing signature', { status: 400 })

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    )
  } catch (err) {
    return new Response(
      `signature verification failed: ${err instanceof Error ? err.message : err}`,
      { status: 400 },
    )
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          session.subscription as string,
        )
        await syncSubscription(sub)
      }
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      await syncSubscription(event.data.object as Stripe.Subscription)
      break
    }
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      await recordInvoice(event.data.object as Stripe.Invoice)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
