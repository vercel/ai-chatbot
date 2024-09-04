import check_missing_fields from '@/lib/api/check_missing_fields';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(`${process.env.NEXT_PUBLIC_STRIPE_SECRET}`, {
  apiVersion: '2024-06-20',
});

console.log("Stripe API Key in use:", process.env.NEXT_PUBLIC_STRIPE_SECRET);
console.log("Stripe API Key in use:", process.env.NEXT_PUBLIC_STRIPE_KEY);



export async function POST(request: NextRequest) {
  try {
    console.log('Request received at:', new Date().toISOString());
    const res = await request.json();
    console.log('Request body:', JSON.stringify(res, null, 2));

    // Check for missing fields
    const missing_fields = check_missing_fields({
      fields: ['plan', 'free_trial'], // Add any other required fields here
      reqBody: res,
    });

    if (missing_fields) {
      console.error('Missing required fields:', missing_fields);
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields', missing_fields }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { plan, free_trial } = res;
    console.log('Plan selected:', plan);
    console.log('Free trial selected:', free_trial);

    // Validate the plan option
    if (!['yearly', 'monthly'].includes(plan)) {
      console.error('Invalid plan option provided:', plan);
      return new NextResponse(
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

    if (free_trial) {
      // If free_trial is true, create a SetupIntent to collect payment method
      console.log('Creating SetupIntent for customer...');
      const setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        payment_method_types: ['card'],
      });
      console.log('SetupIntent created with ID:', setupIntent.id);

      // Return the SetupIntent client secret to the client
      return new NextResponse(
        JSON.stringify({
          setupIntentClientSecret: setupIntent.client_secret,
          customer: customer.id,
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_KEY,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      // If free_trial is false, create a subscription and charge immediately
      const priceId =
        plan === 'yearly'
        ? 'price_1PtvV6RsQmUQn4A3KjPNyi5D'
        // ? 'price_1PsRQ0RsQmUQn4A3ZqBPIH2t'
        : 'price_1PtvV9RsQmUQn4A3WGqf3GFQ';
        // : 'price_1PsQnnRsQmUQn4A33OcScT4s';
      console.log('Price ID selected:', priceId);

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

      if (!paymentIntent?.client_secret) {
        throw new Error('Failed to retrieve payment intent client secret');
      }

      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: '2024-06-20' }
      );

      return new NextResponse(
        JSON.stringify({
          subscriptionId: subscription.id,
          clientSecret: paymentIntent.client_secret,
          ephemeralKey: ephemeralKey.secret,
          customer: customer.id,
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_KEY,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing request:', errorMessage);
    console.error('Error stack trace:', (error as Error).stack);

    return new NextResponse(
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

