import { useMemo } from "react";

export function useNameGuard(input: string) {
  const warning = useMemo(() => (/\bglenn\b/i.test(input) ? "It's Glen 🙂" : ""), [input]);
  return { warning };
}
