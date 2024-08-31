import check_missing_fields from '@/lib/api/check_missing_fields';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(
  'sk_test_51PbYoJRsQmUQn4A3WSGMWGEy7sUE3S0GwyRxjj0Gwv3IHoXfLQVI92h3KP7JHMPozEvJb76UxjBu19Sdh4hShR9J00l9sZoAba',
  {
    apiVersion: '2024-06-20',
  }
);

export async function POST(request: NextRequest) {
  try {
    console.log('Request received at:', new Date().toISOString());
    const res = await request.json();
    console.log('Request body:', JSON.stringify(res, null, 2));

    // Check for missing fields
    const missing_fields = check_missing_fields({
      fields: ['plan'], // Add any other required fields here
      reqBody: res,
    });

    if (missing_fields) {
      console.error('Missing required fields:', missing_fields);
      return new Response(
        JSON.stringify({ error: 'Missing required fields', missing_fields }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { plan } = res;
    console.log('Plan selected:', plan);

    // Validate the plan option
    if (!['yearly', 'monthly'].includes(plan)) {
      console.error('Invalid plan option provided:', plan);
      return new Response(
        JSON.stringify({ error: 'Invalid plan option provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create a Stripe customer
    console.log('Creating Stripe customer...');
    const customer = await stripe.customers.create();
    console.log('Customer created with ID:', customer.id);

    // Determine the price ID based on the plan
    const priceId =
      plan === 'yearly'
        ? 'price_1PsRQ0RsQmUQn4A3ZqBPIH2t'
        : 'price_1PsQnnRsQmUQn4A33OcScT4s';
    console.log('Price ID selected:', priceId);

    // Create a subscription
    console.log('Creating subscription for customer:', customer.id);
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      // trial_period_days: 3, // Uncomment if you want to include a trial period
    });
    console.log('Subscription created with ID:', subscription.id);

    // Create an ephemeral key for client-side use
    console.log('Creating ephemeral key for customer:', customer.id);
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2024-06-20' }
    );
    console.log('Ephemeral key created:', ephemeralKey.secret);

    // Extract the payment intent from the latest invoice
    const latestInvoice = subscription.latest_invoice;
    console.log('Latest invoice details:', JSON.stringify(latestInvoice, null, 2));

    const paymentIntent = typeof latestInvoice === 'object' && latestInvoice !== null
        ? latestInvoice.payment_intent
        : null;

    if (
      typeof paymentIntent !== 'object' ||
      paymentIntent === null ||
      !('client_secret' in paymentIntent)
    ) {
      console.error('Failed to retrieve valid payment intent');
      return new Response(
        JSON.stringify({
          error: 'Failed to retrieve valid payment intent',
          invoiceDetails: latestInvoice, // Log invoice details for diagnosis
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(
      'Payment intent retrieved with client secret:',
      paymentIntent.client_secret
    );

    // Return the necessary data to the client
    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
        publishableKey:
          'pk_test_51PbYoJRsQmUQn4A3GHoqsIpL4lRtNGiAuUdfN3BlLXXxTVxnLn0BtqyI8Z7Jr6WUFWaUvzypvaKgA1V9y749CBfk00yCcpedHK',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing request:', errorMessage);
    console.error('Error stack trace:', (error as Error).stack);

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
