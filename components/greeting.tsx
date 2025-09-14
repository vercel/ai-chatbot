"use client";
import { motion } from 'framer-motion';
import { RouteIcon } from './icons';
import Link from 'next/link';
import { getGreetingVariantClient } from '@/lib/ab/variant';

export const Greeting = () => {
  const variant = getGreetingVariantClient();
  const isB = variant === 'B';
  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold flex items-center gap-3"
      >
        <RouteIcon size={32} />
        {isB ? 'Simule agora sua jornada solar' : 'Jornada Solar Inteligente'}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-lg text-zinc-500 mt-2"
      >
        {isB
          ? 'Comece em segundos: envie sua conta de luz ou endereço. Vamos calcular seu potencial e economia.'
          : 'Descubra o potencial solar da sua propriedade com nossos co-agentes especializados'}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
        className="text-sm text-zinc-400 mt-4 max-w-2xl"
      >
        {isB ? (
          <>
            Resultados claros, passos simples. Da investigação à recomendação com transparência.
          </>
        ) : (
          <>
            Envie uma foto do seu telhado, conta de luz ou endereço para começar.
            Nossos agentes vão guiá-lo através das fases: Investigação → Detecção →
            Análise → Dimensionamento → Recomendação.
          </>
        )}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.8 }}
        className="mt-6"
      >
        <Link
          href={isB ? '/upload-bill' : '/journey'}
          className="inline-flex items-center rounded-md bg-yellow-400 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-yellow-300 focus-yello"
        >
          {isB ? 'Simular agora' : 'Começar'}
        </Link>
      </motion.div>
    </div>
  );
};
