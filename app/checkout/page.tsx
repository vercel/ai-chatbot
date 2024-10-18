"use client"

import CheckoutForm from "@/components/CheckoutForm";
import { CheckIcon } from "@radix-ui/react-icons";
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react";

export default function DonatePage(): JSX.Element {

    const router = useRouter()
    const [ periodo, setPeriodo ] = useState('mensal'); // false = mensal, true = anual
    const valores = {
        mensal: {
            free: 0,
            basico: 4.99,
            premium: 9.99
        },
        anual: {
            free: 0,
            basico: 39.99,
            premium: 79.99
        }
    };

    const [ session, setSession ] = useState(null as any);

    useEffect(() => {
        const fetchSession = async () => {
            const response = await fetch('/api/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                })
            });

            const data = await response.json();

            if (!data) 
                router.push("/login")
            
            setSession(data);
        }

        fetchSession();
    }, [router]);

    const currentPlan = () => {
        if (!session) return 'free';
        if (session?.plan == 'free') return 'free';
        if (session?.plan == 'basico') return 'basico';
        if (session?.plan == 'premium') return 'premium';
    }

  return (
    <div className="page-container container mx-auto my-32">
        {/* <CheckoutForm uiMode="hosted" /> */}
        <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Assine Lexgpt</h1>
            <p className="mt-4 text-lg text-gray-600">Escolha o plano que melhor se adequa a você</p>
        </div>
        {/* Your signature */}
        <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">Plano atual: <strong>{currentPlan()}</strong></p>
        </div>
        <div className="mt-8 text-center">
            <label className="inline-flex items-center cursor-pointer">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-300 mr-3">Mensal</span>
                <input type="checkbox" value={periodo} className="sr-only peer" onChange={() => setPeriodo(periodo == 'mensal' ? 'anual' : 'mensal')}/>
                <div className="relative w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Anual (poupe 35%)</span>
            </label>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mt-8">
            <div className="flex-1 rounded-2xl bg-white shadow-md py-6 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-4">
                <div className="py-4 px-6 sm:py-4 lg:flex-auto text-left">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Free</h2>
                    <p className="text-lg mt-4">R$ 0,0/mês</p>
                    <small className="text-xs text-gray-600">Acesso aos bots de demonstração, incluindo os chats de:</small>

                    <div className="p-2 sm:p-4 lg:flex-auto">
                        <div className="mt-4 flex items-center gap-x-4">
                            <h4 className="flex-none text-sm font-semibold leading-6 text-indigo-600">Inclui</h4>
                            <div className="h-px flex-auto bg-gray-100" />
                        </div>
                        <ul
                        role="list"
                        className="mt-8  gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6">
                            <li className="flex gap-x-3">
                                <CheckIcon aria-hidden="true" className="h-6 w-5 flex-none text-indigo-600" />
                                jurisprudência do STF
                            </li>
                            <li className="flex gap-x-3">
                                <CheckIcon aria-hidden="true" className="h-6 w-5 flex-none text-indigo-600" />
                                redação de peças simples (versão gpt-3)
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mx-auto max-w-xs px-8">
                    {
                        currentPlan() == 'free' ? (
                            <button className="mt-0 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Assinado</button>
                        ) : (
                            <CheckoutForm 
                                price={0} 
                                period={periodo}
                                uiMode="hosted" />
                        )
                    }
                    {/* <span className="text-xs text-gray-600">Conta padrão</span> */}
                    {/* <button className="mt-0 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Assinar</button> */}
                </div>
            </div>
            <div className="flex-1 rounded-2xl bg-white shadow-md py-6 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-4">
                <div className="py-4 px-6 sm:py-4 lg:flex-auto text-left">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Básico</h2>
                    <p className="text-lg mt-4">R$ {periodo == 'mensal' ? '4,99' : '39,99'} <small>{periodo}</small></p>
                    <small className="text-xs text-gray-600">Acesso aos bots básicos</small>

                    <div className="p-2 sm:p-4 lg:flex-auto">
                        <div className="mt-4 flex items-center gap-x-4">
                            <h4 className="flex-none text-sm font-semibold leading-6 text-indigo-600">incluindo os chats:</h4>
                            <div className="h-px flex-auto bg-gray-100" />
                        </div>
                        <ul
                        role="list"
                        className="mt-8  gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6"
                        >
                            <li className="flex gap-x-3">
                                <CheckIcon aria-hidden="true" className="h-6 w-5 flex-none text-indigo-600" />
                                legislação
                            </li>
                            <li className="flex gap-x-3">
                                <CheckIcon aria-hidden="true" className="h-6 w-5 flex-none text-indigo-600" />
                                jurisprudência
                            </li>
                            <li className="flex gap-x-3">
                                <CheckIcon aria-hidden="true" className="h-6 w-5 flex-none text-indigo-600" />
                                doutrina
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mx-auto max-w-xs px-8">
                    {
                        currentPlan() == 'basico' ? (
                            <button className="mt-0 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Assinado</button>
                        ) : (
                            <CheckoutForm 
                                price={periodo == 'mensal' ? valores.mensal.basico : valores.anual.basico} 
                                period={periodo}
                                uiMode="hosted" />
                        )
                    }
                    {/* <CheckoutForm 
                        price={periodo == 'mensal' ? valores.mensal.basico : valores.anual.basico} 
                        period={periodo}
                        uiMode="hosted" /> */}
                    {/* <button className="mt-0 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Assinar</button> */}
                </div>
            </div>
            <div className="flex-1 rounded-2xl bg-white shadow-md py-6 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-4">
                <div className="py-4 px-6 sm:py-4 lg:flex-auto text-left">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Premium</h2>
                    <p className="text-lg mt-4">R$ {periodo == 'mensal' ? '9,99' : '79,99'} <small>{periodo}</small></p>
                    <small className="text-xs text-gray-600">Acesso aos bots avançados</small>

                    <div className="p-2 sm:p-4 lg:flex-auto">
                        <div className="mt-4 flex items-center gap-x-4">
                            <h4 className="flex-none text-sm font-semibold leading-6 text-indigo-600">incluindo os chats:</h4>
                            <div className="h-px flex-auto bg-gray-100" />
                        </div>
                        <ul
                        role="list"
                        className="mt-8  gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6"
                        >
                            <li className="flex gap-x-3">
                                <CheckIcon aria-hidden="true" className="h-6 w-5 flex-none text-indigo-600" />
                                redação de peças avançadas (versão gpt-4)
                            </li>
                            <li className="flex gap-x-3">
                                <CheckIcon aria-hidden="true" className="h-6 w-5 flex-none text-indigo-600" />
                                todos os outros bots (versão gpt-4)
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mx-auto max-w-xs px-8">
                    {
                        currentPlan() == 'premium' ? (
                            <button className="mt-0 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Assinado</button>
                        ) : (
                            <CheckoutForm 
                                price={periodo == 'mensal' ? valores.mensal.premium : valores.anual.premium} 
                                period={periodo}
                                uiMode="hosted" />
                        )
                    }
                    {/* <CheckoutForm 
                        price={periodo == 'mensal' ? valores.mensal.premium : valores.anual.premium} 
                        period={periodo}
                        uiMode="hosted" /> */}
                    {/* <button className="mt-0 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Assinar</button> */}
                </div>
            </div>
        </div>
        <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">Quando o teste grátis acabar, será cobrado o preço normal do plano que você escolheu. Você sempre pode cancelar antes.</p>
            <p className="text-sm text-gray-600">Cancelamento a qualquer momento. Sem taxas de cancelamento.</p>
        </div>
    </div>
  );
}