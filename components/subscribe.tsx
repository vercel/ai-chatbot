'use client';
import { loadStripe } from '@stripe/stripe-js';

type props = {
  priceId: string;
  session: any | null;
};

const SubscribeComponent = ({ priceId, session }: props) => {
  const handleSubmit = async () => {
    const stripe = await loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string
    );
    if (!stripe) {
      return;
    }
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId,
          session,
        })
      });
      const data = await response.json();

      if (!data.ok) throw new Error('Something went wrong');
      await stripe.redirectToCheckout({
        sessionId: data.result.id,
      });
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <button onClick={handleSubmit} className="mt-0 block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Assinar</button>
  );
};
export default SubscribeComponent;