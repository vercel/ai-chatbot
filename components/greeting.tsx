import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export const Greeting = () => {
  // Use client-side only rendering to prevent hydration errors
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Server-side or during hydration, render a simple version without animations
    return (
      <div
        key="overview"
        className="max-w-3xl  w-full mx-auto md:-mt-16 px-8 flex flex-col justify-center items-center"
      >
        <div className="text-2xl font-semibold opacity-0">Hello there!</div>
        <div className="text-2xl text-zinc-500 opacity-0">
          How can I help you today?
        </div>
      </div>
    );
  }

  // Client-side render with animations
  return (
    <div
      key="overview"
      className="max-w-3xl w-full mx-auto md:-mt-16 px-8 flex flex-col justify-center items-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold"
      >
        Hello there!
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-2xl text-zinc-500"
      >
        How can I help you today?
      </motion.div>
    </div>
  );
};
