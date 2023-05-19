import type { RefObject } from "react";
import { useRef } from "react";
import { isModifierPressed } from "./is-modifier-pressed";

export function useCmdEnterSubmit(): {
  formRef: RefObject<HTMLFormElement>;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
} {
  const formRef = useRef<HTMLFormElement>(null);

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ): void => {
    // Capture `⌘`|Ctrl + Enter
    if (isModifierPressed(event) && event.key === "Enter") {
      formRef.current?.requestSubmit();
    }
  };

  return { formRef, onKeyDown: handleKeyDown };
}
