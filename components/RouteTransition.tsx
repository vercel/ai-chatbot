"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function RouteTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      initial={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
