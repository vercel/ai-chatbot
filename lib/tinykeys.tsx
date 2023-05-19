// forked from https://github.com/jamiebuilds/tinykeys
// to fix navigator not being defined in SSR context
// import { type ModifierKey } from "react";

type ModifierKey = any;
/*

MIT License

Copyright (c) 2020 Jamie Kyle

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

type KeyBindingPress = [string[], string];

/**
 * A map of keybinding strings to event handlers.
 */
export interface KeyBindingMap {
  [keybinding: string]: (event: React.KeyboardEvent) => void;
}

export interface Options {
  ignoreFocus?: boolean;
}

/**
 * These are the modifier keys that change the meaning of keybindings.
 *
 * Note: Ignoring "AltGraph" because it is covered by the others.
 */
let KEYBINDING_MODIFIER_KEYS = ["Shift", "Meta", "Alt", "Control"];

/**
 * Keybinding sequences should timeout if individual key presses are more than
 * 1s apart.
 */
let TIMEOUT = 1000;

/**
 * When focus is on these elements, ignore the keydown event.
 */
let inputs = ["select", "textarea", "input"];

export const isAppleDevice = (): boolean => {
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
};

/**
 * Parses a "Key Binding String" into its parts
 *
 * grammar    = `<sequence>`
 * <sequence> = `<press> <press> <press> ...`
 * <press>    = `<key>` or `<mods>+<key>`
 * <mods>     = `<mod>+<mod>+...`
 */
function parse(str: string): KeyBindingPress[] {
  const modifierKey = (isAppleDevice() ? "Meta" : "Control") as ModifierKey;
  return str
    .trim()
    .split(" ")
    .map((press) => {
      let mods = press.split("+");

      let key = mods.pop()!;
      mods = mods.map((mod) => (mod === "$mod" ? modifierKey : mod));
      return [mods, key];
    });
}

/**
 * This tells us if a series of events matches a key binding sequence either
 * partially or exactly.
 */
function match(event: React.KeyboardEvent, press: KeyBindingPress): boolean {
  // prettier-ignore
  return !(
		// Allow either the `event.key` or the `event.code`
		// MDN event.key: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
		// MDN event.code: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
		(
			press[1].toUpperCase() !== event.key.toUpperCase() &&
			press[1] !== event.code
		) ||

		// Ensure all the modifiers in the keybinding are pressed.
		press[0].find((mod) => {
			return !event.getModifierState(mod as ModifierKey)
		}) ||

		// KEYBINDING_MODIFIER_KEYS (Shift/Control/etc) change the meaning of a
		// keybinding. So if they are pressed but aren't part of this keybinding,
		// then we don't have a match.
		KEYBINDING_MODIFIER_KEYS.find(mod => {
			return !press[0].includes(mod) && event.getModifierState(mod as ModifierKey)
		})
	)
}

/**
 * Subscribes to keybindings.
 *
 * Returns an unsubscribe method.
 *
 * @example
 * ```js
 * import keybindings from "../src/keybindings"
 *
 * keybindings(window, {
 * 	"Shift+d": () => {
 * 		alert("The 'Shift' and 'd' keys were pressed at the same time")
 * 	},
 * 	"y e e t": () => {
 * 		alert("The keys 'y', 'e', 'e', and 't' were pressed in order")
 * 	},
 * 	"$mod+d": () => {
 * 		alert("Either 'Control+d' or 'Meta+d' were pressed")
 * 	},
 * })
 * ```
 */
export default function keybindings(
  target: Window | HTMLElement,
  keyBindingMap: KeyBindingMap,
  options: Options = {}
): () => void {
  const keyBindings = Object.keys(keyBindingMap).map((key) => {
    return [parse(key), keyBindingMap[key]] as const;
  });

  const possibleMatches = new Map<KeyBindingPress[], KeyBindingPress[]>();

  let timer: any = null;

  const onKeyDown = (event: React.KeyboardEvent): void => {
    // Ignore modifier keydown events
    // Note: This works because:
    // - non-modifiers will always return false
    // - if the current keypress is a modifier then it will return true when we check its state
    // MDN: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/getModifierState
    if (
      event.getModifierState &&
      event.getModifierState(event.key as ModifierKey)
    ) {
      return;
    }

    // Ignore event when a focusable item is focused
    if (options.ignoreFocus) {
      if (document.activeElement) {
        if (
          inputs.indexOf(document.activeElement.tagName.toLowerCase()) !== -1 ||
          (document.activeElement as HTMLElement).contentEditable === "true"
        ) {
          return;
        }
      }
    }

    keyBindings.forEach((keyBinding) => {
      let sequence = keyBinding[0];

      let callback = keyBinding[1];

      let prev = possibleMatches.get(sequence);

      let remainingExpectedPresses = prev ? prev : sequence;

      let currentExpectedPress = remainingExpectedPresses[0];

      let matches = match(event, currentExpectedPress);

      if (!matches) {
        possibleMatches.delete(sequence);
      } else if (remainingExpectedPresses.length > 1) {
        possibleMatches.set(sequence, remainingExpectedPresses.slice(1));
      } else {
        possibleMatches.delete(sequence);
        callback(event);
      }
    });

    clearTimeout(timer);
    timer = setTimeout(possibleMatches.clear.bind(possibleMatches), TIMEOUT);
  };

  target.addEventListener("keydown", onKeyDown as any);
  return (): void => {
    target.removeEventListener("keydown", onKeyDown as any);
  };
}
