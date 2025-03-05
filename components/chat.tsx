'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { useState, useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { Connection, Transaction } from '@solana/web3.js';
import ConnectWalletButton from './ConnectWalletButton';

import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';

import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';

interface SwapTransactionDetails {
  operation: 'swap';
  transaction_data: string;
  input_mint: string;
  output_mint: string;
  input_amount: number;
}

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();
  const [swapDetails, setSwapDetails] = useState<SwapTransactionDetails | null>(null);

  // Handle wallet connection and transaction
  useEffect(() => {
    if (swapDetails) {
      console.log('swapDetails', swapDetails);
      const handleTransaction = async () => {
        try {
          // Get Phantom provider
          const provider = (window as any).phantom?.solana;
          if (!provider?.isPhantom) {
            window.open('https://phantom.app/', '_blank');
            return;
          }

          // Connect to wallet
          await provider.connect();

          // Create and send transaction
          const connection = new Connection('https://api.mainnet-beta.solana.com');
          
          // Decode the transaction data
          const serializedTransaction = Buffer.from(swapDetails.transaction_data, 'base64');
          
          // Use the correct deserialization method based on transaction version
          let transaction;
          try {
            // First try to deserialize as a legacy transaction
            transaction = Transaction.from(serializedTransaction);
          } catch (error) {
            // If that fails, try to deserialize as a versioned transaction
            const { VersionedTransaction } = await import('@solana/web3.js');
            transaction = VersionedTransaction.deserialize(serializedTransaction);
          }

          // Sign and send transaction
          const signed = await provider.signTransaction(transaction);
          const signature = await connection.sendRawTransaction(
            signed instanceof Transaction ? 
              signed.serialize() : 
              signed.serialize()
          );
          
          // Wait for confirmation
          await connection.confirmTransaction(signature);
          
          console.log('Transaction completed:', signature);
          setSwapDetails(null);
        } catch (error) {
          console.error('Transaction failed:', error);
          setSwapDetails(null);
        }
      };

      handleTransaction();
    }
  }, [swapDetails]);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
    data,
  } = useChat({
    id,
    body: { id, selectedChatModel: selectedChatModel },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      console.log('Chat response finished:', { messages, data });
      
      // Check last message for swap transaction
      const lastMessage = messages[messages.length - 1];
      try {
        const content = JSON.parse(lastMessage.content);
        if (
          content.operation === 'swap' &&
          content.transaction_data &&
          content.input_mint &&
          content.output_mint &&
          typeof content.input_amount === 'number'
        ) {
          console.log('Received swap operation:', content);
          setSwapDetails(content); // This will trigger the wallet popup
        }
      } catch (e) {
        // Not JSON or doesn't match schema
      }

      mutate('/api/history');
    },
    onError: (error) => {
      console.error('Chat error in browser:', error);
      toast.error('An error occurred, please try again!');
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={id}
          isLoading={isLoading}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}
