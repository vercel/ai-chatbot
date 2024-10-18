"use client";

import type Stripe from "stripe";

import React, { useState } from "react";

import { formatAmountForDisplay } from "@/utils/stripe-helpers";
import * as config from "@/lib/stripe/config";
import { createCheckoutSession } from "@/app/actions/stripe";
import getStripe from "@/utils/get-stripe";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

interface CheckoutFormProps {
  uiMode: Stripe.Checkout.SessionCreateParams.UiMode;
  price: number;
  period: string;
}

export default function CheckoutForm(props: CheckoutFormProps): JSX.Element {
  const [loading] = useState<boolean>(false);
  const [input, setInput] = useState<{ customDonation: number }>({
    customDonation: Math.round(config.MAX_AMOUNT / config.AMOUNT_STEP),
  });
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (
    e,
  ): void =>
    setInput({
      ...input,
      [e.currentTarget.name]: e.currentTarget.value,
    });

  const formAction = async (data: FormData): Promise<void> => {
    const uiMode = data.get(
      "uiMode",
    ) as Stripe.Checkout.SessionCreateParams.UiMode;
    const { client_secret, url } = await createCheckoutSession(data);

    if (uiMode === "embedded") return setClientSecret(client_secret);

    window.location.assign(url as string);
  };

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    const formData = new FormData();
    formData.append("uiMode", props.uiMode);
    formData.append("customDonation", props.price.toString());
    formData.append("period", props.period);
    const { client_secret, url } = await createCheckoutSession(formData);

    if (props.uiMode === "embedded") return setClientSecret(client_secret);

    window.location.assign(url as string)
  }

  return (
    <>
        <button 
            className="mt-0 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            disabled={loading} onClick={handleClick}>
                Assinar
        </button>
    </>
  )

  return (
    <>
      <form action={formAction}>
        <input type="hidden" name="uiMode" value={props.uiMode} />
        <input
          type="number"
          name="customDonation"
          value={input.customDonation}
          onChange={handleInputChange}
          min={config.MIN_AMOUNT}
          max={config.MAX_AMOUNT}
          step={config.AMOUNT_STEP}
        />
        <button
          className="checkout-style-background"
          type="submit"
          disabled={loading}
        >
          {formatAmountForDisplay(input.customDonation, config.CURRENCY)}
        </button>
      </form>
      {clientSecret ? (
        <EmbeddedCheckoutProvider
          stripe={getStripe()}
          options={{ clientSecret }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      ) : null}
    </>
  );
}