import { isAppleDevice } from "@/lib/tinykeys";

/**
 * Uses the Meta key on macOS, and the Ctrl key on other platforms.
 */
export const isModifierPressed = (
  event: KeyboardEvent | React.KeyboardEvent
): boolean => {
  return isAppleDevice() ? event.metaKey : event.ctrlKey;
};
