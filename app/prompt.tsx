"use client";

import { CornerDownLeft, RefreshCcw, StopCircle } from "lucide-react";
import { useState } from "react";
import Textarea from "react-textarea-autosize";

import { Button } from "@/components/ui/button";
import { fontMessage } from "@/lib/fonts";
import { useCmdEnterSubmit } from "@/lib/hooks/use-command-enter-submit";
import { cn } from "@/lib/utils";

export interface PromptProps {
  onSubmit: (value: string) => void;
  onRefresh?: () => void;
  onAbort?: () => void;
  isLoading: boolean;
}

export function Prompt({
  onSubmit,
  onRefresh,
  onAbort,
  isLoading,
}: PromptProps) {
  const [input, setInput] = useState("");
  const { formRef, onKeyDown } = useCmdEnterSubmit();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setInput("");
        await onSubmit(input);
      }}
      ref={formRef}
      className="stretch flex w-full flex-row gap-3 md:max-w-2xl lg:max-w-xl xl:max-w-3xl mx-auto px-4 lg:pl-16"
    >
      <div className="relative flex h-full flex-1 flex-row-reverse items-stretch md:flex-col">
        <div>
          <div className="ml-1 flex h-full justify-center gap-0 md:m-auto md:mb-2 md:w-full md:gap-2">
            {onRefresh ? (
              <Button
                variant="ghost"
                className="relative border-0 h-full md:h-auto px-3 md:border bg-white dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400"
                onClick={onRefresh}
              >
                <div className="flex h-gull w-full items-center justify-center gap-2">
                  <RefreshCcw className="h-4 w-4 text-zinc-500 md:h-3 md:w-3" />
                  <span className="hidden md:block">Regenerate response</span>
                </div>
              </Button>
            ) : null}
            {/* <button
                      id="share-button"
                      className="btn btn-neutral flex justify-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="h-3 w-3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                        />
                      </svg>
                      Share
                    </button> */}
          </div>
        </div>
        <div className="relative flex w-full grow flex-col rounded-md dark:focus:border-white border border-zinc/10 bg-white shadow-[0_10px_20px_-10px_rgba(0,0,0,0.20)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:shadow-[0_5px_15px_rgba(0,0,0,0.10)] focus-within:border-zinc-800 focus-within:shadow-[0_15px_10px_-12px_rgba(0,0,0,0.22)] transition-all duration-200 focus-within:duration-1000 ease-in-out">
          <Textarea
            tabIndex={0}
            onKeyDown={onKeyDown}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message."
            spellCheck={false}
            className={cn(
              "m-0 max-h-[200px] w-full sm:text-sm resize-none border-0 bg-transparent p-0 py-[13px] pl-4 pr-7 outline-none ring-0 focus:ring-0 focus-visible:ring-0 dark:bg-transparent",
              fontMessage.className
            )}
            style={{
              height: 46,
              overflowY: "hidden",
            }}
          />
          {isLoading ? (
            <button
              type="button"
              onClick={onAbort}
              className="absolute top-0 bottom-0 m-auto h-8 w-8 flex items-center justify-center right-2 rounded p-2 text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-zinc-900 enabled:dark:hover:text-zinc-400 dark:disabled:hover:bg-transparent"
            >
              <StopCircle className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              className="absolute top-0 bottom-0 m-auto h-8 w-8 flex items-center justify-center right-2 rounded p-2 text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-zinc-900 enabled:dark:hover:text-zinc-400 dark:disabled:hover:bg-transparent"
            >
              <CornerDownLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

Prompt.displayName = "Prompt";
