import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders, json } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'missing authorization' }, 401)

  // Anon client bound to the caller's JWT, so RLS decides what they can read
  // and auth.getUser() tells us who they are.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return json({ error: 'not authenticated' }, 401)
  const user = userData.user

  const { plan_id } = await req.json()
  if (!plan_id) return json({ error: 'plan_id required' }, 400)

  const { data: plan } = await supabase
    .from('membership_plans')
    .select('*')
    .eq('id', plan_id)
    .eq('active', true)
    .single()

  if (!plan?.stripe_price_id) {
    return json({ error: 'plan is not linked to a Stripe price' }, 400)
  }

  // Service-role client: memberships are not client-writable by design.
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: existing } = await admin
    .from('memberships')
    .select('stripe_customer_id')
    .eq('member_id', user.id)
    .maybeSingle()

  let customerId = existing?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await admin
      .from('memberships')
      .upsert(
        { member_id: user.id, stripe_customer_id: customerId, plan_id },
        { onConflict: 'member_id' },
      )
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    success_url: `${SITE_URL}/app/membership?checkout=success`,
    cancel_url: `${SITE_URL}/app/membership?checkout=cancelled`,
    // Read back in the webhook to attribute the subscription.
    metadata: { supabase_user_id: user.id, plan_id },
    subscription_data: {
      metadata: { supabase_user_id: user.id, plan_id },
    },
  })

  return json({ url: session.url })
})
