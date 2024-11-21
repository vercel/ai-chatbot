// /api/session route
import { auth } from '@/auth';
import { kv } from '@vercel/kv';
import { getUser } from '@/app/login/actions';
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe';
import { User } from '@/lib/types';

export async function POST(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    // Authenticate the user
    const session = await auth();

    // Fetch user details from Vercel KV
    const user = await kv.hgetall<User>(`user:${session.user.email}`);

    if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // Fetch the Stripe customer info using the stored Stripe ID
    let stripeCustomer: Stripe.Customer | null = null;
    if (user.stripeId) {
        try {
            stripeCustomer = await stripe.customers.retrieve(user.stripeId);
        } catch (error) {
            console.error('Error fetching Stripe customer:', error);
        }
    }

    // Check if there's an active subscription in Stripe
    let activeSubscription = 'free';
    if (stripeCustomer) {
        const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomer.id,
            status: 'active',
            limit: 1,
        });

        if (subscriptions.data.length > 0) {
            const subscription = subscriptions.data[0];
            if (subscription.items.data[0].plan.id.includes('premium')) {
                activeSubscription = 'premium';
            } else if (subscription.items.data[0].plan.id.includes('basic')) {
                activeSubscription = 'basic';
            }
        }
    }

    // Return user data along with Stripe subscription info
    return new Response(
        JSON.stringify({
            ...user,
            plan: activeSubscription, // Override the plan from Stripe if active subscription exists
        }),
        { status: 200 }
    );
}
