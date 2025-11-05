"use server";

import { stripe } from "@/lib/stripe/config";
import { createOrRetrieveCustomer } from "@/lib/stripe/admin";
import {
  getURL,
  calculateTrialEndUnixTimestamp,
} from "@/lib/stripe/helpers";
import { auth } from "@/app/(auth)/auth";
import type Stripe from "stripe";

type CheckoutResponse = {
  errorRedirect?: string;
  sessionId?: string;
};

export async function checkoutWithStripe(
  priceId: string,
  redirectPath: string = "/account"
): Promise<CheckoutResponse> {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user?.id || !user?.email) {
      throw new Error("Could not get user session.");
    }

    let customerId: string;
    try {
      customerId = await createOrRetrieveCustomer({
        uuid: user.id,
        email: user.email,
      });
    } catch (err) {
      console.error(err);
      throw new Error("Unable to access customer record.");
    }

    // Get price details to determine type
    const price = await stripe.prices.retrieve(priceId);

    let params: Stripe.Checkout.SessionCreateParams = {
      allow_promotion_codes: true,
      billing_address_collection: "required",
      customer: customerId,
      customer_update: {
        address: "auto",
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      cancel_url: getURL(),
      success_url: getURL(redirectPath),
    };

    if (price.type === "recurring") {
      params = {
        ...params,
        mode: "subscription",
        subscription_data: {
          trial_end: calculateTrialEndUnixTimestamp(
            price.recurring?.trial_period_days
          ),
        },
      };
    } else if (price.type === "one_time") {
      params = {
        ...params,
        mode: "payment",
      };
    }

    let checkoutSession;
    try {
      checkoutSession = await stripe.checkout.sessions.create(params);
    } catch (err) {
      console.error(err);
      throw new Error("Unable to create checkout session.");
    }

    if (checkoutSession) {
      return { sessionId: checkoutSession.id };
    } else {
      throw new Error("Unable to create checkout session.");
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        errorRedirect: `/error?message=${encodeURIComponent(error.message)}`,
      };
    } else {
      return {
        errorRedirect: "/error?message=An+unknown+error+occurred",
      };
    }
  }
}

export async function createStripePortal(currentPath: string) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user?.id || !user?.email) {
      throw new Error("Could not get user session.");
    }

    let customerId;
    try {
      customerId = await createOrRetrieveCustomer({
        uuid: user.id,
        email: user.email,
      });
    } catch (err) {
      console.error(err);
      throw new Error("Unable to access customer record.");
    }

    if (!customerId) {
      throw new Error("Could not get customer.");
    }

    try {
      const { url } = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: getURL("/account"),
      });

      if (!url) {
        throw new Error("Could not create billing portal");
      }

      return url;
    } catch (err) {
      console.error(err);
      throw new Error("Could not create billing portal");
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return `/error?message=${encodeURIComponent(error.message)}`;
    } else {
      return "/error?message=An+unknown+error+occurred";
    }
  }
}
