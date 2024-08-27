import check_missing_fields from '@/lib/api/check_missing_fields'
import supabase from '@/lib/supabase/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(
  'sk_test_51PbYoJRsQmUQn4A3WSGMWGEy7sUE3S0GwyRxjj0Gwv3IHoXfLQVI92h3KP7JHMPozEvJb76UxjBu19Sdh4hShR9J00l9sZoAba',
  {
    apiVersion: '2024-06-20'
  }
)

export async function POST(request: Request) {
  try {
    const res = await request.json()

    // Check for missing fields
    const missing_fields = check_missing_fields({
      fields: ['plan'], // Add any other required fields here
      reqBody: res
    })

    if (missing_fields) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields', missing_fields }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const { plan } = res

    // Validate the plan option
    if (!['yearly', 'monthly'].includes(plan)) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan option provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Create a Stripe customer
    const customer = await stripe.customers.create()

    // Determine the product ID based on the plan
    const prodId =
      plan === 'yearly'
        ? 'price_1PsRQ0RsQmUQn4A3ZqBPIH2t'
        : 'price_1PsQnnRsQmUQn4A33OcScT4s'

    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: prodId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      // trial_period_days: 3, // Remove this line to disable the free trial
    });
    

    // Create an ephemeral key for client-side use
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2024-06-20' }
    )

    // Extract the payment intent from the latest invoice
    const latestInvoice = subscription.latest_invoice
    const paymentIntent =
      typeof latestInvoice === 'object' && latestInvoice !== null
        ? latestInvoice.payment_intent
        : null

    // Return the necessary data to the client
    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent ? paymentIntent?.toString : null,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
        publishableKey:
          'pk_test_51PbYoJRsQmUQn4A3GHoqsIpL4lRtNGiAuUdfN3BlLXXxTVxnLn0BtqyI8Z7Jr6WUFWaUvzypvaKgA1V9y749CBfk00yCcpedHK'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error processing request:', error)

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        details: error
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
