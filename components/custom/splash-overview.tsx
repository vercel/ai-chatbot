import { motion } from "framer-motion";
import Link from "next/link";
import {useTranslations} from 'next-intl';

import { LogoOpenAI, MessageIcon, VercelIcon } from "./icons";

export function SplashOverview(){
  const globals = useTranslations('globals');
  const content = useTranslations('content');

  return (
    <motion.div
      key="overview"
      className="max-w-[500px] mt-20 mx-4 md:mx-0"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="border rounded-lg p-6 flex flex-col gap-4 text-zinc-500 text-sm dark:text-zinc-400 dark:border-zinc-700">
        <p className="flex flex-row justify-center gap-4 items-center text-zinc-900 dark:text-zinc-50 font-semibold">
          { globals('site_title') }
        </p>
        <p>
          { content('splash_overview_message') }
        </p>
      </div>
    </motion.div>
  );
};
