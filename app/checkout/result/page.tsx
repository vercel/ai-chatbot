import type { Stripe } from "stripe";

import { stripe } from "@/lib/stripe";
import Link from "next/link";

export default async function ResultPage({
  searchParams,
}: {
  searchParams: { session_id: string };
}): Promise<JSX.Element> {
  if (!searchParams.session_id)
    throw new Error("Please provide a valid session_id (`cs_test_...`)");

  const checkoutSession: Stripe.Checkout.Session =
    await stripe.checkout.sessions.retrieve(searchParams.session_id, {
      expand: ["line_items", "payment_intent"],
    });

  const paymentIntent = checkoutSession.payment_intent as Stripe.PaymentIntent;

  // console.log("Checkout Session", checkoutSession);

  if (checkoutSession.status === "complete" ) 
    return (
      <div className="page-container container mx-auto my-32">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Obrigado pela assinatura!</h1>
          <p className="text-lg mt-4">
            Você receberá um email de confirmação em breve.
          </p>
          {/* Back to checkout page button */}
          <Link href="/checkout">
            <button className="mt-0 block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              Voltar
            </button>
          </Link>
        </div>
      </div>
    );

  if (checkoutSession.status !== "complete")
    return (
      <div className="page-container container mx-auto my-32">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Ocorreu um erro!</h1>
          <p className="text-lg mt-4">
            Por favor, tente novamente mais tarde.
          </p>
          <Link href="/checkout">
            <button className="mt-0 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              Voltar
            </button>
          </Link>
        </div>
      </div>
    );
    

  return (
    <>
      {/* Voltar */}
      <h2>Status: {paymentIntent?.status}</h2>
      <h3>Checkout Session response:</h3>
      <h3>Payment Intent response:</h3>
        <pre>{JSON.stringify(checkoutSession, null, 2)}</pre>
    </>
  );
}