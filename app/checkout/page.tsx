"use client";

import CancelDialog from "@/components/cancel-dialog";
import SubscribeComponent from "@/components/subscribe";
import { Plan, User } from "@/lib/types";
import { translatePlan } from "@/lib/utils";
import { CheckIcon } from "@radix-ui/react-icons";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { format } from 'date-fns'

const priceIds = {
  month: {
    basic: 'month_basic',
    premium: 'month_premium',
  },
  anual: {
    basic: 'anual_basic',
    premium: 'anual_premium',
  },
};

interface PlanCardProps {
  price: string;
  features: string[];
  planKey: Plan;
  priceId?: typeof priceIds;
}

export default function DonatePage(): JSX.Element {
  const router = useRouter();
  const [period, setPeriod] = useState<'month' | 'anual'>('month');
  const [session, setSession] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!data) {
        router.push("/login");
        return;
      }

      setSession(data);
      setLoading(false);
    };

    fetchSession();
  }, [router]);

  const currentPlan = () => {
    if (loading) return 'Carregando...';
    if (!session || session.plan === 'free') return translatePlan['free'];
    if (session.plan) return `${translatePlan[session.plan]} ${translatePlan[session.period]}`;
    return 'free'; // Default to free if no plan is found
  };

  function PlanCard({ price, features, planKey, priceId }: PlanCardProps) {
    return (
      <div className="flex-1 rounded-2xl bg-white shadow-md py-6 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-4">
        <div className="py-4 px-6 sm:py-4 lg:flex-auto text-left">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">{translatePlan[planKey]}</h2>
          <p className="text-lg mt-4 dark:text-gray-800">{price}</p>
          <div className="p-2 sm:p-4 lg:flex-auto">
            <ul className="mt-8 gap-4 text-sm leading-6 text-gray-600">
              {features.map((feature: string) => (
              <li key={feature} className="flex gap-x-3">
                  <CheckIcon aria-hidden="true" className="h-6 w-5 flex-none text-indigo-600" />
                  {feature}
              </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-xs px-8">
          {loading ? 
          <button disabled className="mt-0 block w-full rounded-md bg-indigo-300 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
            Carregando...
          </button>
            : planKey === 'free' && session?.plan !== 'free' ?
              <CancelDialog session={session}>
                <button className="mt-0 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                  Assinar
                </button>
              </CancelDialog>
            : (session?.plan === planKey && (session.period === period || session.period === null )) ? (
              <button disabled className="mt-0 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm opacity-80 cursor-not-allowed">
                Assinado
              </button>
          ) : (
          <SubscribeComponent priceId={priceId} session={session} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container container mx-auto my-32">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-300">Assine Lexgpt</h1>
        <p className="mt-4 text-lg text-gray-600">Escolha o plano que melhor se adequa a você</p>
      </div>
      <div className="mt-8 text-center">
        <p className="text-md text-gray-600">
          Plano atual: <strong>{currentPlan()}</strong>
        </p>
        {session?.startDate &&
        <p className="text-md text-gray-600">
          {session?.plan === 'free' ? 'Criado' : 'Assinado' } em: <strong>{format(session.startDate, 'dd/MM/yyyy')}</strong>
        </p>}
        {session?.chargeDate &&
        <p className="text-md text-gray-600">
          Próxima fatura: <strong>{format(session.chargeDate, 'dd/MM/yyyy')}</strong>
        </p>}
      </div>
      <div className="mt-8 text-center">
        <label className="inline-flex items-center cursor-pointer">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-300 mr-3">Mensal</span>
          <input
            type="checkbox"
            value={period}
            className="sr-only peer"
            onChange={() => setPeriod(period === 'month' ? 'anual' : 'month')}
          />
          <div className="relative w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:size-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Anual (poupe 35%)</span>
        </label>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mt-8">
        {/* Free Plan */}
        <PlanCard
          price="R$ 0,00"
          features={['jurisprudência do STF', 'redação de peças simples (versão gpt-3)']}
          planKey="free"
        />

        {/* Basic Plan */}
        <PlanCard
          price={`R$ ${period === 'month' ? '4,99 mensal' : '39,99 anual'}`}
          features={['legislação', 'jurisprudência', 'doutrina']}
          planKey="basic"
          priceId={priceIds[period].basic}
        />

        {/* Premium Plan */}
        <PlanCard
          price={`R$ ${period === 'month' ? '9,99 mensal' : '79,99 anual'}`}
          features={['redação de peças avançadas (gpt-4)', 'todos os outros bots (gpt-4)']}
          planKey="premium"
          priceId={priceIds[period].premium}
        />
      </div>
      {session && session.plan !== 'free' &&
      <CancelDialog session={session}>
        <button className="mx-auto mt-6 block rounded-md bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-red-500">
          Cancelar Assinatura
        </button>
      </CancelDialog>}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">Cancelamento a qualquer momento. Sem taxas de cancelamento.</p>
      </div>
    </div>
  );
}
