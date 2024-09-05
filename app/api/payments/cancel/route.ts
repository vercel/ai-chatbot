import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(`${process.env.NEXT_PUBLIC_STRIPE_SECRET}`, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    const res = await request.json();
    const { subscriptionId } = res;

    if (!subscriptionId) {
      throw new Error('No subscription ID provided.');
    }

    // Retrieve the subscription to check its status
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    let message = '';

    if (subscription.status === 'trialing') {
      // Cancel the subscription immediately if it hasn't been paid
      await stripe.subscriptions.cancel(subscriptionId);
      message = 'Subscription cancelled immediately.';
    } else {
      // Cancel the subscription at the end of the current period if it's already paid
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      message = 'Subscription will be cancelled at the end of the current period.';
    }

    return new NextResponse(
      JSON.stringify({ message }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
