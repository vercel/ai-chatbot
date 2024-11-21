import type { Stripe } from "stripe";
import { stripe } from "@/lib/stripe";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { translatePlan } from '@/lib/utils';

export default async function ResultPage({
  searchParams,
}: {
  searchParams: { session_id: string };
}): Promise<JSX.Element> {
  if (!searchParams.session_id) {
    return <ErrorCard
      title="Sessão Inválida"
      description="Não conseguimos encontrar a sessão. Por favor, tente novamente."
    />;
  }

  if (searchParams.session_id === 'cancel') {
    return <CancelCard />;
  }

  let checkoutSession: Stripe.Checkout.Session | null = null;
  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(
      searchParams.session_id,
      { expand: ["line_items", "payment_intent"] }
    );
  } catch (error) {
    console.error("Error retrieving checkout session:", error);
  }

  if (!checkoutSession || checkoutSession.status !== "complete") {
    return <ErrorCard
      title="Ocorreu um erro!"
      description="Não conseguimos confirmar sua assinatura. Por favor, tente novamente mais tarde."
    />;
  }

  return <SuccessCard checkoutSession={checkoutSession} />;
}

function ErrorCard({ title, description }: { title: string, description: string }) {
  return (
    <div className="w-full max-w-md mx-auto mt-16 bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-center text-red-600 mb-4">❌ {title}</h2>
        <p className="text-center text-gray-600 mb-6">{description}</p>
        <div className="flex justify-center">
          <Link href="/checkout">
            <Button variant="outline">Voltar para o Checkout</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function CancelCard() {
  return (
    <div className="w-full max-w-md mx-auto mt-16 bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-center text-yellow-600 mb-4">⚠️ Assinatura Cancelada</h2>
        <p className="text-center text-gray-600 mb-6">
          Suas assinaturas e faturas foram canceladas.
        </p>
        <div className="flex justify-center">
          <Link href="/checkout">
            <Button variant="outline">Voltar para o Checkout</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function SuccessCard({ checkoutSession }: { checkoutSession: Stripe.Checkout.Session }) {
  const { email, name } = checkoutSession.customer_details || {};
  const { period, plan } = checkoutSession.metadata || {};

  return (
    <div className="w-full max-w-md mx-auto mt-16 bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-center text-green-600 mb-4">✅ Assinatura Confirmada!</h2>
        <p className="text-center text-gray-600 mb-6">
          Obrigado por assinar o LexGPT. Sua jornada com IA começa agora!
        </p>
        <div className="space-y-4 mb-6 text-gray-800">
          <p><strong>Seu Nome:</strong> {name}</p>
          <p><strong>E-mail:</strong> {email}</p>
          <p><strong>Plano:</strong> {translatePlan[plan]}</p>
          <p><strong>Período:</strong> {translatePlan[period]}</p>
          <p className="text-sm text-gray-500">
            Você receberá um e-mail de confirmação em breve com todos os detalhes da sua assinatura.
          </p>
        </div>
        <div className="flex flex-col space-y-2">
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">Voltar para o Início</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}