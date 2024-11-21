import { stripe } from '@/lib/stripe'
import { translatePlan } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import { Plan, Period } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    // you can implement some basic check here like, is user valid or not
    const data = await request.json();
    const { priceId, session } = data;

    const period_plan = priceId.split('_')
    const period = period_plan[0] as Period
    const plan = period_plan[1] as Plan

    let userExists = false;

    try {
       const stripeUser = await stripe.customers.retrieve(session.stripeId)
       userExists = stripeUser && !stripeUser.deleted
    } catch(error) {
      console.log(error)
    }

    const checkoutSession: Stripe.Checkout.Session =
      await stripe.checkout.sessions.create({
        //payment_method_types: ['card', 'apple_pay'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          }
        ],
        custom_text: {
          submit: {
            message: `Você está assinando o plano ${translatePlan[plan]} ${translatePlan[period]}.`,
          },
        },
        customer: userExists ? session?.stripeId : undefined,
        customer_email: userExists ? undefined : session?.email,
        mode: 'subscription',
        success_url: `${process.env.VERCEL_URL}/checkout/result?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.VERCEL_URL}/checkout`,
        metadata: {
          userId: session.id,
          email: session.email,
          period,
          plan,
        }
      });
    return NextResponse.json({ result: checkoutSession, ok: true });
  } catch (error) {
    console.log(error);
    return new NextResponse('Internal Server', { status: 500 });
  }
}