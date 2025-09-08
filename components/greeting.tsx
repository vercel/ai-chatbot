import { motion } from 'framer-motion';
import { RouteIcon } from './icons';

export const Greeting = () => {
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
        Jornada Solar Inteligente
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-lg text-zinc-500 mt-2"
      >
        Descubra o potencial solar da sua propriedade com nossos co-agentes
        especializados
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
        className="text-sm text-zinc-400 mt-4 max-w-2xl"
      >
        Envie uma foto do seu telhado, conta de luz ou endereço para começar.
        Nossos agentes vão guiá-lo através das fases: Investigação → Detecção →
        Análise → Dimensionamento → Recomendação.
      </motion.div>
    </div>
  );
};
