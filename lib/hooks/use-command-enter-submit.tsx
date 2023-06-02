import type { RefObject } from "react";
import { useRef } from "react";

export function useCmdEnterSubmit(): {
  formRef: RefObject<HTMLFormElement>;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
} {
  const formRef = useRef<HTMLFormElement>(null);

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ): void => {
    if (event.key === "Enter") {
      formRef.current?.requestSubmit();
    }
  };

  return { formRef, onKeyDown: handleKeyDown };
}
