"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

type SuggestedActionsProps = {
  onSelect: (text: string) => void;
  inputId?: string;
};

const categories = ["Leadership", "Benefits", "Operations"] as const;

const suggestions: Array<{ icon: string; text: string }> = [
  { icon: "📊", text: "Prep for board update" },
  { icon: "🏥", text: "Is my mammogram covered?" },
  { icon: "💬", text: "Summarize last town hall" },
  { icon: "🎯", text: "Vision talking points" },
  { icon: "👨‍⚕️", text: "Find a care provider" },
  { icon: "💊", text: "Check prescription coverage" },
];

export function SuggestedActions(props: SuggestedActionsProps) {
  const { onSelect, inputId } = props;
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    (value: string) => {
      onSelect(value);
      // focus input if provided
      if (inputId) {
        const el = document.getElementById(inputId) as HTMLInputElement | null;
        if (el) {
          el.focus();
          // move cursor to end
          const len = el.value.length;
          el.setSelectionRange(len, len);
        }
      }
    },
    [onSelect, inputId]
  );

  return (
    <div className="flex flex-col gap-3" ref={containerRef}>
      <div
        aria-label="Suggestion categories"
        className={cn(
          "-webkit-overflow-scrolling-touch flex touch-pan-y gap-2 overflow-x-auto",
          "[&>*]:shrink-0"
        )}
        role="tablist"
      >
        {categories.map((cat) => (
          <button
            aria-label={`Category ${cat}`}
            className={cn(
              "rounded-2xl px-3 py-1.5 font-medium text-sm",
              "bg-gradient-to-r from-[var(--transcarent-blue)] to-[var(--transcarent-blue-dark)] text-white",
              "shadow-sm transition-transform duration-150 hover:scale-[1.02] hover:shadow",
              "focus-visible:ring-2 focus-visible:ring-[var(--transcarent-blue)] focus-visible:ring-offset-2"
            )}
            key={cat}
            type="button"
          >
            {cat}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
          "mt-1"
        )}
      >
        {suggestions.map((s) => (
          <button
            aria-label={`Use suggestion: ${s.text}`}
            className={cn(
              "group rounded-2xl p-3 text-left",
              "border border-border/60",
              "bg-gradient-to-br from-[color-mix(in_oklab,var(--transcarent-gold)_22%,white)] to-[color-mix(in_oklab,var(--transcarent-blue)_8%,white)]",
              "shadow-sm transition duration-150 hover:scale-[1.02] hover:shadow-md",
              "focus-visible:ring-2 focus-visible:ring-[var(--transcarent-blue)] focus-visible:ring-offset-2"
            )}
            key={s.text}
            onClick={() => handleSelect(`${s.icon} ${s.text}`)}
            type="button"
          >
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-lg">
                {s.icon}
              </span>
              <span className="font-medium text-foreground text-sm">
                {s.text}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SuggestedActions;
