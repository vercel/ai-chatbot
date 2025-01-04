"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ChatRequestOptions, CreateMessage, Message } from "ai";
import { memo, useEffect, useState } from "react";

interface SuggestedActionsProps {
  chatId: string;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
}

const suggestedActions = [
  {
    title: "Shows me today's top",
    label: "trending stocks",
    action: "Shows me the daily top trending stocks",
  },
  {
    title: "Show me a stock chart",
    label: "for Google",
    action: "Show me a stock chart for Google",
  },
  {
    title: "What is the price",
    label: "of Apple Inc.?",
    action: "What is the price of Apple stock",
  },
  {
    title: "What are some recent",
    label: `events about Amazon?`,
    action: `What are some recent events about Amazon?`,
  },
  {
    title: `What are Microsoft's`,
    label: "latest financials?",
    action: `What are Microsoft's latest financials?`,
  },
  {
    title: "How is the stock market",
    label: "performing today by sector?",
    action: `How is the stock market performing today by sector?`,
  },
  // {
  //   title: "Write code that",
  //   label: `demonstrates djikstra's algorithm`,
  //   action: `Write code that demonstrates djikstra's algorithm`,
  // },
  // {
  //   title: "Help me write an essay",
  //   label: `about silicon valley`,
  //   action: `Help me write an essay about silicon valley`,
  // },
  // {
  //   title: "What is the weather",
  //   label: "in San Francisco?",
  //   action: "What is the weather in San Francisco?",
  // },
];

interface ExampleMessage {
  title: string;
  label: string;
  action: string;
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const [randExamples, setRandExamples] = useState<ExampleMessage[]>([]);

  useEffect(() => {
    const shuffledExamples = [...suggestedActions].sort(
      () => 0.5 - Math.random()
    );
    setRandExamples(shuffledExamples);
  }, []);

  return (
    <div className="grid sm:grid-cols-2 gap-2 w-full">
      {randExamples.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? "hidden sm:block" : "block"}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, "", `/chat/${chatId}`);

              append({
                role: "user",
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
