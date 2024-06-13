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
import { SeparatorVertical } from 'lucide-react';
import { ExternalLink } from '@/components/external-link';

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
      <div className={`w-11/12 m-auto ${position} px-4 sm:px-6 lg:px-8`}>
        <PromptForm input={input} setInput={setInput} />
      </div>
      {messages.length === 0 ? (
        <div className="mx-auto sm:px-4">
          <div className="mb-4 gap-2 px-4 sm:px-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-11/12 m-auto">
            {cachedMessages.map((cached, index) => (
              <div
                key={index}
                className="mt-4 cursor-pointer rounded-lg border bg-white p-4 hover:bg-zinc-50"
                onClick={async () => {
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
                <p className="text-sm text-sky-500">{cached.subheading}</p>
              </div>
            ))}
          </div>
          <div className="inset-x-0 w-full pb-12 m-auto h-full relative text-center mt-20">
            <div className="flex flex-col m-auto w-11/12 space-around mt-30 mb-20 mx-auto p-5">
                {/* <p className="text-left text-balance mb-5 font-medium text-sky-600">SUPPORTED</p> */}
                <div className="flex flex-col sm:flex-row justify-start mb-5">
                  <div className="flex-col p-5 border border-rounded w-full sm:w-1/3 rounded-md text-left  mb-3 sm:mb-0">
                  <div>
                  <div className="flex flex-row">
                   <svg className="mb-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="rgb(14, 165, 233)" fill="none">
                      <path d="M21.3006 6.05187C21.1484 5.22701 20.7411 4.45623 20.1372 3.85008C19.5309 3.24641 18.7599 2.83927 17.9348 2.68704C13.7379 1.98816 9.32857 3.26088 6.29895 6.28553C3.27 9.30951 1.9905 13.7155 2.68454 17.9122C2.83679 18.7371 3.24405 19.5079 3.84791 20.114C4.45425 20.7177 5.22527 21.1248 6.0504 21.2771C10.2213 22.0738 14.6996 20.7027 17.6917 17.6794C20.7496 14.6729 22.0291 10.2497 21.3006 6.05187Z" stroke="currentColor" stroke-width="1.5" />
                      <path d="M4 20L20 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M9 12L12 15M12 9L15 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <p className="ml-2 font-bold text-sky-500">IN BETA TESTING</p>
                  </div>
                    <div className="mb-5">
                    <ExternalLink href="">
                      <span className="text-left text-xl">nflfastR</span>
                    </ExternalLink>
                    </div>
                  </div>
                    <p className="text-gray-600 text-left">NFLfastR, as a database, offers a comprehensive and organized repository of NFL play-by-play data. It also includes roster data, historical game outcomes, and contract data, all accessible through our natural language interface.</p>
                   </div>
                  <div className="flex-col bg-gray-100 p-5 border border-rounded w-full sm:w-1/3 rounded-md text-left ml-0 sm:ml-3 mb-3 sm:mb-0">
                  <div>
                  <div className="flex flex-row">
                  <svg className="mb-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color="rgb(107, 114, 128)" fill={"none"}>
                      <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M2 12C4.28031 14.4289 7.91083 16 12 16C16.0892 16 19.7197 14.4289 22 12" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M12 2V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5.1556 5C4.77388 6.5 5.04007 9 6.56621 11C8.1708 13.1028 9.18243 16 5.36932 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18.8444 5C19.2261 6.5 18.9599 9 17.4338 11C15.8292 13.1028 14.8176 16 18.6307 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="ml-2 font-bold text-gray-500">UPCOMING</p>
                  </div>
                    <div className="mb-5">
                    <ExternalLink href="">
                      <span className="text-left text-xl">NBA API</span>
                    </ExternalLink>
                    </div>
                  </div>
                    <p className="text-gray-600 text-left">The NBA API provides access to a vast database of NBA statistics, player and team performance metrics, game logs, and other basketball-related data.</p>
                   </div>
                   <div className="flex-col bg-gray-100 p-5 border border-rounded w-full sm:w-1/3 rounded-md text-left ml-0 sm:ml-3  mb-3 sm:mb-0">
                  <div>
                  <div className="flex flex-row">
                  <svg className="mb-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="rgb(107, 114, 128)" fill="none">
    <path d="M14.6341 16.5168L22 3M17.5475 3L12.3738 12.7865C11.7391 13.9871 11.3456 14.149 10.0348 13.749C8.36082 13.2381 5.01415 11.4686 3.34756 12.2423C1.6805 13.0162 1.54011 18.1781 3.03845 19.2361C4.71629 20.4208 9.68674 19.9937 11.7961 19.5103" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M8 13L6 20" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
    <path d="M12 19C12 17.3453 12.3453 17 14 17H18C19.6547 17 20 17.3453 20 19C20 20.6547 19.6547 21 18 21H14C12.3453 21 12 20.6547 12 19Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>
                  <p className="ml-2 font-bold text-gray-500">UPCOMING</p>
                  </div>
                    <div className="mb-5">
                    <ExternalLink href="">
                      <span className="text-left text-xl">NHL API</span>
                    </ExternalLink>
                    </div>
                  </div>
                    <p className="text-gray-600 text-left">The NHL API offers comprehensive access to a wide array of hockey data, including game statistics, player and team performance metrics, schedules, and play-by-play details.</p>
                   </div>
                </div>
                <div className="bg-gray-600/[0.5] w-full h-[1px] mb-5"></div>
                <div className="flex flex-row mb-3 items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={45} height={45} color={"#000"} fill={"none"} opacity={0.8}>
                    <ellipse cx="12" cy="5" rx="8" ry="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M20 12C20 13.6569 16.4183 15 12 15C7.58172 15 4 13.6569 4 12" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M20 5V19C20 20.6569 16.4183 22 12 22C7.58172 22 4 20.6569 4 19V5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 8V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M8 15V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p className="ml-3 text-left text-balance 
                bg-gradient-to-br 
                from-black from-30% 
                to-black/60 bg-clip-text py-3 text-3xl font-medium leading-none tracking-tighter text-transparent sm:text-3xl md:text-3xl lg:text-3xl">Supported Databases</p>
                </div>
                
                <p className="text-md text-left text-gray-600 w-1/2">We currently support the <ExternalLink href="">nflfastR</ExternalLink> database. With upcoming support for NBA, association football, ice hockey, and baseball datasets.</p>
            </div>
          </div>
        </div>
      ) : null}
      {messages?.length >= 2 ? (
        <div className="flex justify-center space-x-2 p-4">
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
      ) : null}
    </div>
  );
}
