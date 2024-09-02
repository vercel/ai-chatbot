import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(`${process.env.NEXT_PUBLIC_STRIPE_SECRET_TEST}`, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    console.log('Received request at:', new Date().toISOString());

    const res = await request.json();
    console.log('Request body:', JSON.stringify(res, null, 2));

    const { customerId, plan, free_trial, paymentMethodId } = res;

    // Validate that we have all necessary data
    if (!customerId || !plan || !paymentMethodId) {
      console.error('Validation failed: Missing required fields');
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Validated request data:');
    console.log('Customer ID:', customerId);
    console.log('Plan:', plan);
    console.log('Free Trial:', free_trial);

    // Determine the price ID based on the plan
    const priceId =
      plan === 'yearly'
        ? 'price_1PsRQ0RsQmUQn4A3ZqBPIH2t'
        : 'price_1PsQnnRsQmUQn4A33OcScT4s';

    console.log('Price ID selected:', priceId);

    // Calculate the trial end timestamp (e.g., 3 days from now) if applicable
    const trialEndTimestamp = free_trial
      ? Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60 // 3 days from now
      : 'now';

    if (free_trial) {
      console.log('Trial end timestamp:', trialEndTimestamp);
    } else {
      console.log('No trial; charging immediately');
    }

    // Set up subscription parameters
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      trial_end: free_trial ? trialEndTimestamp : 'now',
      default_payment_method: paymentMethodId, // Attach the valid payment method collected by SetupIntent
    };

    console.log('Subscription parameters:', JSON.stringify(subscriptionParams, null, 2));

    // Create the subscription
    console.log('Creating subscription for customer:', customerId);
    const subscription = await stripe.subscriptions.create(subscriptionParams);
    console.log('Subscription created with ID:', subscription.id);

    // The payment intent might be null if the subscription starts with a trial
    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice ? latestInvoice.payment_intent as Stripe.PaymentIntent : null;

    if (paymentIntent && paymentIntent.client_secret) {
      console.log('Payment intent client secret:', paymentIntent.client_secret);
    } else {
      console.log('Payment intent not available immediately due to free trial.');
    }

    // Return a response without relying on the payment intent
    return new NextResponse(
      JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent ? paymentIntent.client_secret : null,
        customer: customerId,
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_KEY_TEST, // Ensure this is the test key
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error encountered:', (error as Error).message);
    console.error('Error stack trace:', (error as Error).stack);

    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
