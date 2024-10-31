'use client';

import { ChatRequestOptions, CreateMessage, Message } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { BoldIcon, ItalicIcon, MessageIcon } from './icons';
import { Button } from '../ui/button';

export interface FloatingMenuState {
  isVisible: boolean;
  position: { top: number; left: number };
  selectedText: string;
}

interface FloatingMenuProps {
  floatingMenu: FloatingMenuState;
  setFloatingMenu: Dispatch<SetStateAction<FloatingMenuState>>;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
}

export const FloatingMenu = ({
  floatingMenu,
  setFloatingMenu,
  append,
}: FloatingMenuProps) => {
  const [showAssistantInput, setShowAssistantInput] = useState(false);

  useEffect(() => {
    if (!floatingMenu.isVisible) {
      setShowAssistantInput(false);
    }
  }, [floatingMenu.isVisible]);

  return (
    <AnimatePresence>
      {floatingMenu.isVisible ? (
        <motion.div
          className={cx(
            'absolute z-50 flex bg-muted border dark:border-zinc-700 rounded-xl p-1 items-center drop-shadow-xl',
            { 'dark:bg-zinc-700 dark:border-zinc-600': showAssistantInput }
          )}
          initial={{
            opacity: 0,
            scale: 0.95,
            top: floatingMenu.position.top + 2,
            left: floatingMenu.position.left,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            top: floatingMenu.position.top,
            left: floatingMenu.position.left,
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            top: floatingMenu.position.top + 2,
            left: floatingMenu.position.left,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {showAssistantInput ? (
            <input
              placeholder="Ask or edit..."
              className="px-2 outline-none py-1 bg-transparent"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  const { value } = event.target as HTMLInputElement;

                  append({
                    role: 'user',
                    content: `I've highlighted the following text: ${floatingMenu.selectedText}\n\n${value}`,
                  });

                  setFloatingMenu({
                    isVisible: false,
                    position: { top: 0, left: 0 },
                    selectedText: '',
                  });
                }
              }}
            />
          ) : (
            <>
              <Button
                variant="ghost"
                className="p-2 h-fit dark:hover:bg-zinc-700"
                onClick={() => {
                  setShowAssistantInput(true);
                }}
              >
                <MessageIcon />
              </Button>
              <Button
                variant="ghost"
                className="p-2 h-fit dark:hover:bg-zinc-700"
              >
                <BoldIcon />
              </Button>
              <Button
                variant="ghost"
                className="p-2 h-fit dark:hover:bg-zinc-700"
              >
                <ItalicIcon />
              </Button>
            </>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
