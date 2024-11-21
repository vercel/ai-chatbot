import { loadStripe } from "@stripe/stripe-js";
const configValue: string = (process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string);
import Stripe from 'stripe';

export async function getStripeJs(){
  return await loadStripe(configValue) 
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
