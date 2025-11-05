"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getStripe } from "@/lib/stripe/client";
import { checkoutWithStripe } from "@/lib/stripe/server";
import type { Product, Price } from "@/lib/db/schema";

interface PricingProps {
  products: (Product & { prices: Price[] })[];
  userId?: string;
}

export function Pricing({ products, userId }: PricingProps) {
  const router = useRouter();
  const [priceIdLoading, setPriceIdLoading] = useState<string>();
  const [billingInterval, setBillingInterval] = useState<"month" | "year">(
    "month"
  );

  const handleStripeCheckout = async (priceId: string) => {
    setPriceIdLoading(priceId);

    if (!userId) {
      setPriceIdLoading(undefined);
      return router.push("/login");
    }

    const { errorRedirect, sessionId } = await checkoutWithStripe(
      priceId,
      "/account"
    );

    if (errorRedirect) {
      setPriceIdLoading(undefined);
      return router.push(errorRedirect);
    }

    if (!sessionId) {
      setPriceIdLoading(undefined);
      return router.push("/error?message=Unable+to+create+checkout+session");
    }

    const stripe = await getStripe();
    stripe?.redirectToCheckout({ sessionId });

    setPriceIdLoading(undefined);
  };

  if (!products.length) {
    return (
      <section className="bg-black">
        <div className="max-w-6xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
          <p className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
            No subscription pricing plans found. Create them in your{" "}
            <a
              className="text-pink-500 underline"
              href="https://dashboard.stripe.com/products"
              rel="noopener noreferrer"
              target="_blank"
            >
              Stripe Dashboard
            </a>
            .
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-black">
      <div className="max-w-6xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
        <div className="sm:flex sm:flex-col sm:align-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
            Pricing Plans
          </h1>
          <p className="max-w-2xl m-auto mt-5 text-xl text-zinc-200 sm:text-center sm:text-2xl">
            Start building for free, then add a site plan to go live.
          </p>
          <div className="relative self-center mt-6 bg-zinc-900 rounded-lg p-0.5 flex sm:mt-8 border border-zinc-800">
            <button
              onClick={() => setBillingInterval("month")}
              type="button"
              className={`${
                billingInterval === "month"
                  ? "relative w-1/2 bg-zinc-700 border-zinc-800 shadow-sm text-white"
                  : "ml-0.5 relative w-1/2 border border-transparent text-zinc-400"
              } rounded-md m-1 py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 focus:z-10 sm:w-auto sm:px-8`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingInterval("year")}
              type="button"
              className={`${
                billingInterval === "year"
                  ? "relative w-1/2 bg-zinc-700 border-zinc-800 shadow-sm text-white"
                  : "ml-0.5 relative w-1/2 border border-transparent text-zinc-400"
              } rounded-md m-1 py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 focus:z-10 sm:w-auto sm:px-8`}
            >
              Yearly billing
            </button>
          </div>
        </div>
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
          {products.map((product) => {
            const price = product.prices?.find(
              (p) => p.interval === billingInterval
            );
            if (!price) return null;

            const priceString = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: price.currency || "USD",
              minimumFractionDigits: 0,
            }).format((Number(price.unitAmount) || 0) / 100);

            return (
              <div
                key={product.id}
                className="flex flex-col rounded-lg shadow-sm divide-y divide-zinc-600 bg-zinc-900 border border-zinc-800"
              >
                <div className="p-6">
                  <h2 className="text-2xl font-semibold leading-6 text-white">
                    {product.name}
                  </h2>
                  <p className="mt-4 text-zinc-300">{product.description}</p>
                  <p className="mt-8">
                    <span className="text-5xl font-extrabold white">
                      {priceString}
                    </span>
                    <span className="text-base font-medium text-zinc-100">
                      /{billingInterval}
                    </span>
                  </p>
                  <button
                    type="button"
                    disabled={priceIdLoading === price.id}
                    onClick={() => handleStripeCheckout(price.id)}
                    className="block w-full py-2 mt-8 text-sm font-semibold text-center text-white rounded-md bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50"
                  >
                    {priceIdLoading === price.id ? "Loading..." : "Subscribe"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
