import * as React from 'react';

import { shareChat } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { PromptForm } from '@/components/prompt-form';
import { IconShare } from '@/components/ui/icons';
import { ChatShareDialog } from '@/components/chat-share-dialog';
import { useAIState, useActions, useUIState } from 'ai/rsc';
import type { AI } from '@/lib/chat/actions';
import { nanoid } from 'nanoid';
import { UserMessage } from './stocks/message';

export interface ChatPanelProps {
  id?: string;
  title?: string;
  input: string;
  setInput: (value: string) => void;
  position?: string;
}

export interface CachedMessage {
  heading: string;
  subheading: string;
  message: string;
  // cached should be an object
  cached?: any;
}

export function ChatPanel({
  id,
  title,
  input,
  setInput,
  position
}: ChatPanelProps) {
  const [aiState] = useAIState();
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions();
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);

  let cachedMessages = [
    {
      heading: 'What is',
      subheading: "Dak Prescott's EPA per play in 2023?",
      message: "What is Dak Prescott's EPA per play in 2023?",
      cached: {
        queryResponse: "Dak Prescott's EPA per play in 2023 is 0.2.",
        querySummary: "Dak Prescott's EPA per play in 2023 is 0.2."
      }
    },
    {
      heading: "What is Brock Purdy's",
      subheading: "EPA per play when targeting Brandon Aiyuk?",
      message: "What is Brock Purdy's EPA per play when targeting Brandon Aiyuk?"
    },
    {
      heading: "What is the Philadelphia Eagles'",
      subheading: "4th and short success rate in 2023?",
      message: "What is the Philadelphia Eagles' 4th and short success rate in 2023?"
    },
    {
      heading: "What is Christian McCaffrey's",
      subheading: "EPA per rush?",
      message: "What is Christian McCaffrey's EPA per rush?"
    },
    {
      heading: "What is the most effective offense",
      subheading: "in the Redzone by EPA per play?",
      message: "What is the most effective offense in the Redzone by EPA per play?"
    },
    {
      heading: "What is Justin Jefferson's",
      subheading: "average yards per reception in 2023?",
      message: "What is Justin Jefferson's average yards per reception in 2023?"
    },
    {
      heading: "What is the Kansas City Chiefs'",
      subheading: "3rd down conversion rate in 2023?",
      message: "What is the Kansas City Chiefs' 3rd down conversion rate in 2023?"
    },
    {
      heading: "What is the most effective defense",
      subheading: "on 3rd down by EPA per play?",
      message: "What is the most effective defense on 3rd down by EPA per play?"
    },
    {
      heading: "What is Patrick Mahomes' EPA",
      subheading: "when throwing for 10+ air yards against the Raiders?",
      message: "What is Patrick Mahomes' average EPA per play when throwing for 10+ air yards against the Raiders (over the course of his whole career)?"
    },
    {
      heading: "What is the average",
      subheading: "yards per play for the San Francisco 49ers in 2023?",
      message: "What is the average yards per play for the San Francisco 49ers in 2023?"
    },
    {
      heading: "What is the New England Patriots'",
      subheading: "defensive success rate against the run in 2023?",
      message: "What is the New England Patriots' defensive success rate against the run in 2023?"
    },
    {
      heading: "What is Lamar's",
      subheading: "CPOE when targeting OBJ?",
      message: "What is Lamar's CPOE when targeting OBJ?"
    }
  ];

  return (
    <div className="inset-x-0 w-full pb-12 m-auto h-full relative">
      <div className={`w-11/12 m-auto ${position}`}>
        <PromptForm input={input} setInput={setInput} />
      </div>
      {messages.length === 0 ? (
        <div className="mx-auto sm:px-4">
          <div className="mb-4 gap-2 px-4 sm:px-0 grid grid-cols-4 sm:grid-cols-3 xs:grid-cols-1 w-11/12 m-auto">
            {cachedMessages.map((cached, index) => (
              <div
                key={index}
                className={`mt-4 cursor-pointer rounded-lg border bg-white p-4 hover:bg-zinc-50`}
                onClick={async () => {
                  // setInput(cached.message)
                  setMessages(currentMessages => [
                    ...currentMessages,
                    {
                      id: nanoid(),
                      display: <UserMessage>{cached.message}</UserMessage>
                    }
                  ]);

                  const responseMessage = await submitUserMessage(
                    cached.message
                  );

                  setMessages(currentMessages => [
                    ...currentMessages,
                    responseMessage
                  ]);
                }}
              >
                <h3 className="text-sm font-semibold">{cached.heading}</h3>
                <p className="text-sm text-sky-500">
                  {cached.subheading}
                </p>
              </div>
            ))}
          </div>
          
        </div>
      ) : null}
      {messages?.length >= 2 ? (
        <div className="flex w-6/12 m-auto">
          <div className="flex space-x-2">
            {id && title ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShareDialogOpen(true)}
                >
                  <IconShare className="mr-2" />
                  Share
                </Button>
                <ChatShareDialog
                  open={shareDialogOpen}
                  onOpenChange={setShareDialogOpen}
                  onCopy={() => setShareDialogOpen(false)}
                  shareChat={shareChat}
                  chat={{
                    id,
                    title,
                    messages: aiState.messages
                  }}
                />
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
