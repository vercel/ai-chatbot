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
  console.log(res)
  const customer = await stripe.customers.create()

  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customer.id },
    { apiVersion: '2024-06-20' }
  )

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1199, // Amount in the smallest currency unit (e.g., cents for EUR)
    currency: 'usd',
    customer: customer.id,
    automatic_payment_methods: {
      enabled: true
    }
  })
  // TODO: this should be saved
  // Respond with the necessary client secrets and customer ID
  return Response.json({
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customer.id,
    publishableKey:
      'pk_test_51PbYoJRsQmUQn4A3GHoqsIpL4lRtNGiAuUdfN3BlLXXxTVxnLn0BtqyI8Z7Jr6WUFWaUvzypvaKgA1V9y749CBfk00yCcpedHK'
  })
}
