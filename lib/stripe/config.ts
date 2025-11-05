import Stripe from "stripe";

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY_LIVE ?? process.env.STRIPE_SECRET_KEY ?? "",
  {
    apiVersion: "2024-12-18.acacia",
    appInfo: {
      name: "AI Chatbot",
      version: "3.1.0",
    },
  }
);
