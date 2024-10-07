import Link from "next/link";
import { MessageIcon, VercelIcon } from "./icons";
import { motion } from "framer-motion";

export const Overview = () => {
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
        <p className="flex flex-row justify-center gap-4 items-center text-zinc-900 dark:text-zinc-50">
          <VercelIcon />
          <span>+</span>
          <MessageIcon />
        </p>
        <p>
          This is an open source chatbot app template built with Next.js and the
          AI SDK by Vercel. It uses the streamText function on the server and
          the useChat hook on the client to create a seamless chatbot
          experience.
        </p>
        <p>
          {" "}
          You can learn more about the AI SDK by reading the{" "}
          <Link
            className="text-blue-500 dark:text-blue-400"
            href="https://sdk.vercel.ai/docs"
            target="_blank"
          >
            documentation
          </Link>
          .
        </p>
      </div>
    </motion.div>
  );
};
