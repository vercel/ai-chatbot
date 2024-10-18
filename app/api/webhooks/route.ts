import type { Stripe } from "stripe";
import { NextResponse } from "next/server";
import { editUser } from "@/app/signup/actions";
import { stripe } from "@/lib/stripe";
import { createSubscription, cancelSubscription } from './actions'

export async function POST(req: Request) {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await (await req.blob()).text(),
      req.headers.get("stripe-signature") as string,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    // On error, log and return the error message.
    if (err! instanceof Error) console.log(err);
    console.log(`❌ Error message: ${errorMessage}`);
    return NextResponse.json(
      { message: `Webhook Error: ${errorMessage}` },
      { status: 400 },
    );
  }

  // Successfully constructed event.
  console.log("✅ Success:", event.id);

  const permittedEvents: string[] = [
    "checkout.session.completed",
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "customer.subscription.deleted"
  ];

  if (permittedEvents.includes(event.type)) {
    let data;

    try {
      switch (event.type) {
        case "checkout.session.completed":
          data = event.data.object as Stripe.Checkout.Session;
          console.log(`💰 CheckoutSession status: ${data.payment_status}`);
          const session = await stripe.checkout.sessions.retrieve(
            (event.data.object as Stripe.Checkout.Session).id,
            {
              expand: ["line_items"],
            }
          );
          console.log('Session', session)

          const customerId = session.customer as string;
          const customerDetails = session.customer_details;

          if (customerDetails?.email) {

            const plan = session.line_items.data[0].price.unit_amount === 499 ? 'basico' : 'premium'
            const period = session.line_items.data[0].price.recurring.interval
            const completed = await createSubscription(customerDetails.email, plan, period)
            console.log('Subscription', completed)

          }
          // console.log('Data', data)
          // const period = data.line_items.data[0].price.recurring.interval
          // const plan = data.line_items.data[0].price.unit_amount === 4.99 ? 'basico' : 'premium'
          // const completed = await createSubscription(data.customer_details.email, plan, period)
          // console.log('Subscription', completed)
          break;
        case "payment_intent.payment_failed":
          data = event.data.object as Stripe.PaymentIntent;
          console.log(`❌ Payment failed: ${data.last_payment_error?.message}`);
          break;
        case "payment_intent.succeeded":
          data = event.data.object as Stripe.PaymentIntent;
          console.log(`💰 PaymentIntent status: ${data.status}`);
          break;
        case "customer.subscription.deleted":
          data = event.data.object as Stripe.Subscription;
          console.log(`🔓 Subscription deleted: ${data.id}`);
          const deleted = await cancelSubscription(data.customer_details.email)
          console.log('Subscription', deleted)
          break;
        default:
          throw new Error(`Unhandled event: ${event.type}`);
      }
    } catch (error) {
      console.log(error);
      return NextResponse.json(
        { message: "Webhook handler failed" },
        { status: 500 },
      );
    }
  }
  // Return a response to acknowledge receipt of the event.
  return NextResponse.json({ message: "Received" }, { status: 200 });
}

export async function GET() {
    return NextResponse.json({ message: "Hello" });
}