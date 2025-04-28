'use client';

import { motion } from 'framer-motion';

type OrbState = 'idle' | 'listening' | 'speaking';

interface OrbitVisualizerProps {
  state: OrbState;
}

export function OrbitVisualizer({ state }: OrbitVisualizerProps) {
  const animationVariants = {
    idle: {
      scale: [1, 1.05, 1],
      opacity: [0.8, 0.9, 0.8],
      transition: { repeat: Infinity, duration: 3 }
    },
    listening: {
      scale: [1, 1.1, 1],
      opacity: [0.8, 1, 0.8],
      transition: { repeat: Infinity, duration: 1.5 }
    },
    speaking: {
      scale: [1, 1.15, 1],
      opacity: [0.8, 1, 0.8],
      transition: { repeat: Infinity, duration: 0.8 }
    }
  };

  return (
    <div className="relative flex items-center justify-center p-4">
      <motion.div
        className="size-32 md:size-48 lg:size-48 rounded-full bg-gradient-to-br from-[#3a86ff] to-[#00b24b]"
        animate={animationVariants[state]}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent to-[#ff006e] opacity-20" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#3a86ff] to-transparent opacity-30" />
      </motion.div>
      
      {/* Ripple effects */}
      <motion.div
        className="absolute size-32 md:size-48 lg:size-56 rounded-full border-2 border-[#3a86ff]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "easeOut"
        }}
      />
    </div>
  );
} 