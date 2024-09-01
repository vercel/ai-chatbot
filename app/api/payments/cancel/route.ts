import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import admin from 'firebase-admin';

const stripe = new Stripe(`${process.env.NEXT_PUBLIC_STRIPE_SECRET}`, {
  apiVersion: '2024-06-20',
});

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

export async function cancelSubscription(request: NextRequest) {
  try {
    const res = await request.json();
    const { subscription_id, user_id } = res;

    // Retrieve the subscription to check its status
    const subscription = await stripe.subscriptions.retrieve(subscription_id);

    if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
      // Cancel the subscription immediately if it hasn't been paid
      await stripe.subscriptions.cancel(subscription_id);

      // Set userTime to 0 in Firestore
      await db.collection('users').doc(user_id).update({
        userTime: 0,
      });

      console.log(`Subscription ${subscription_id} cancelled immediately for user ${user_id}`);
      return new NextResponse(
        JSON.stringify({ success: true, message: 'Subscription cancelled immediately.' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      // Cancel the subscription at the end of the current period if it's already paid
      await stripe.subscriptions.update(subscription_id, {
        cancel_at_period_end: true,
      });

      // Set userTime to 0 in Firestore, effective at the next billing date
      await db.collection('users').doc(user_id).update({
        userTime: 100,
      });

      console.log(`Subscription ${subscription_id} set to cancel at period end for user ${user_id}`);
      return new NextResponse(
        JSON.stringify({ success: true, message: 'Subscription will be cancelled at the end of the current period.' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
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
