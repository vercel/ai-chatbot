import { Message, CreateMessage, ChatRequestOptions } from "ai";
import { motion } from "framer-motion";
import { useTranslations } from 'next-intl';

interface SuggestedPromptProps {
  keyName: string;
  index: number;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
}

const SuggestedPrompt = ({ keyName, index, append }: SuggestedPromptProps) => {
  const suggested_prompts = useTranslations('suggested_prompts');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.05 * index }}
      key={index}
      className={index > 1 ? "hidden sm:block" : "block"}
    >
      <button
        onClick={() =>
          append({
            role: "user",
            content: suggested_prompts(`${keyName}.action`),
          })
        }
        className="w-full text-left border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-lg p-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col"
      >
        <span className="font-medium">
          {suggested_prompts(`${keyName}.title`)}
        </span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {suggested_prompts(`${keyName}.label`)}
        </span>
      </button>
    </motion.div>
  );
};

interface SuggestedPromptsProps {
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
}

export const SuggestedPrompts = ({ append }: SuggestedPromptsProps) => {
  const suggested_prompts_keys = [
    'strategic_campaign',
    'social_toolkit',
    'volunteer_mobilisation',
    'standard_campaign',
  ] as const;

  return (
    <div className="grid sm:grid-cols-2 gap-2 w-full md:px-0 mx-auto md:max-w-[500px]">
      {suggested_prompts_keys.map((key, index) => (
        <SuggestedPrompt key={index} index={index} keyName={key} append={append} />
      ))}
    </div>
  );
};
