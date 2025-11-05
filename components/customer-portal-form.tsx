"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStripePortal } from "@/lib/stripe/server";
import type { Subscription, Price, Product } from "@/lib/db/schema";

interface CustomerPortalFormProps {
  subscription:
    | (Subscription & {
        price: Price & {
          product: Product;
        };
      })
    | null;
}

export function CustomerPortalForm({
  subscription,
}: CustomerPortalFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subscriptionPrice =
    subscription &&
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: subscription?.price?.currency || "USD",
      minimumFractionDigits: 0,
    }).format((Number(subscription?.price?.unitAmount) || 0) / 100);

  const handleStripePortalRequest = async () => {
    setIsSubmitting(true);
    const redirectUrl = await createStripePortal("/account");
    setIsSubmitting(false);
    return router.push(redirectUrl);
  };

  return (
    <div className="w-full max-w-3xl m-auto my-8 border rounded-md p-6 border-zinc-700">
      <div className="mb-4">
        <h3 className="mb-1 text-2xl font-medium">Your Plan</h3>
        <p className="text-zinc-300">
          {subscription
            ? `You are currently on the ${subscription?.price?.product?.name} plan.`
            : "You are not currently subscribed to any plan."}
        </p>
      </div>
      <div className="mt-8 mb-4 text-xl font-semibold">
        {subscription ? (
          `${subscriptionPrice}/${subscription?.price?.interval}`
        ) : (
          <a href="/pricing" className="text-pink-500 underline">
            Choose your plan
          </a>
        )}
      </div>
      <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center border-t pt-4 border-zinc-700">
        <p className="pb-4 sm:pb-0 text-zinc-500">
          Manage your subscription on Stripe.
        </p>
        <button
          onClick={handleStripePortalRequest}
          disabled={isSubmitting}
          className="py-2 px-4 text-sm font-semibold text-white rounded-md bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50"
        >
          {isSubmitting ? "Loading..." : "Open customer portal"}
        </button>
      </div>
    </div>
  );
}
