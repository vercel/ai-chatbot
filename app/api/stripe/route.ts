import supabase from '@/lib/supabase/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(
  'sk_test_51PbYoJRsQmUQn4A3WSGMWGEy7sUE3S0GwyRxjj0Gwv3IHoXfLQVI92h3KP7JHMPozEvJb76UxjBu19Sdh4hShR9J00l9sZoAba',
  {
    apiVersion: '2024-06-20'
  }
)
export async function POST(request: Request) {
  const res = await request.json()
  const { email, plan } = res
  // check everything comes
  // check options also, "yearly" or "monthly"
  const customer = await stripe.customers.create({ email: email })
  // Create a subscription
  const prodId =
    plan === 'yearly' ? 'prod_QjvGTCqeDIfYhA' : 'prod_QjudObH4R5c9sX'
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: prodId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  })
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customer.id },
    { apiVersion: '2024-06-20' }
  )
  // TODO: this should be saved
  // Respond with the necessary client secrets and customer ID
  const latestInvoice = subscription.latest_invoice
  const paymentIntent =
    typeof latestInvoice === 'object' && latestInvoice !== null
      ? latestInvoice.payment_intent
      : null
  return Response.json({
    subscriptionId: subscription.id,
    clientSecret: paymentIntent ? paymentIntent?.toString : null,
    ephemeralKey: ephemeralKey.secret,
    customer: customer.id,
    publishableKey:
      'pk_test_51PbYoJRsQmUQn4A3GHoqsIpL4lRtNGiAuUdfN3BlLXXxTVxnLn0BtqyI8Z7Jr6WUFWaUvzypvaKgA1V9y749CBfk00yCcpedHK'
  })
}
