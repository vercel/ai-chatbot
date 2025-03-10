'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from "@ai-sdk/react";
import { useState, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Connection, Transaction } from "@solana/web3.js";

import { ChatHeader } from "@/components/chat-header";
import type { Vote } from "@/lib/db/schema";
import { fetcher, generateUUID } from "@/lib/utils";

import { Artifact } from "./artifact";
import { MultimodalInput } from "./multimodal-input";
import { Messages } from "./messages";
import { VisibilityType } from "./visibility-selector";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { toast } from "sonner";

interface SwapTransactionDetails {
  operation: "swap";
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
  const [swapDetails, setSwapDetails] = useState<SwapTransactionDetails | null>(
    null
  );

  // Handle wallet connection and transaction
  useEffect(() => {
    console.log("@@swapDetails", swapDetails);
    if (swapDetails) {
      console.log("swapDetails", swapDetails);
      const handleTransaction = async () => {
        try {
          console.log("Starting the provider");
          // Get Phantom provider
          const provider = (window as any).phantom?.solana;
          if (!provider?.isPhantom) {
            console.log("Phantom provider not found");
            window.open("https://phantom.app/", "_blank");
            return;
          }

          console.log("Connecting to wallet");
          // Connect to wallet
          await provider.connect();
          console.log("Connected to wallet");

          // Create and send transaction
          // Use a more reliable RPC endpoint
          const connection = new Connection(
            "https://mainnet.helius-rpc.com/?api-key=b61a3f14-fb2e-49fc-9f3f-7f7b0b6a3a0c",
            "confirmed"
          );

          // Decode the transaction data
          const serializedTransaction = Buffer.from(
            swapDetails.transaction_data,
            "base64"
          );

          console.log("Serialized transaction", serializedTransaction);

          // Use the correct deserialization method based on transaction version
          let transaction;
          try {
            // First try to deserialize as a legacy transaction
            transaction = Transaction.from(serializedTransaction);
            console.log("Transaction deserialized as legacy transaction");

            // Update the blockhash only
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;

            // Log the transaction details for debugging
            console.log(
              "Transaction instructions:",
              transaction.instructions.map((inst) => ({
                programId: inst.programId.toString(),
                dataLength: inst.data.length,
              }))
            );
          } catch (error) {
            console.log("Error deserializing transaction:", error);
            // If that fails, try to deserialize as a versioned transaction
            const { VersionedTransaction } = await import("@solana/web3.js");
            transaction = VersionedTransaction.deserialize(
              serializedTransaction
            );
            console.log("Transaction deserialized as versioned transaction");

            // For versioned transactions, we need to update the blockhash differently
            const { blockhash } = await connection.getLatestBlockhash();
            const messageV0 = transaction.message;
            messageV0.recentBlockhash = blockhash;
          }

          // Sign and send transaction
          console.log("Signing transaction with updated blockhash...");
          const signed = await provider.signTransaction(transaction);
          console.log("Transaction signed, sending to network...");

          const signature = await connection.sendRawTransaction(
            signed instanceof Transaction
              ? signed.serialize()
              : signed.serialize()
          );

          console.log("Transaction sent, signature:", signature);

          // Wait for confirmation
          console.log("Waiting for confirmation...");
          await connection.confirmTransaction(signature);

          console.log("Transaction completed:", signature);

          // Display success message with transaction hash
          toast.success(
            <div>
              Transaction completed!
              <div className="mt-2 text-xs break-all">
                <a
                  href={`https://solscan.io/tx/${signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {signature}
                </a>
              </div>
            </div>,
            {
              duration: 10000, // Show for 10 seconds
            }
          );

          setSwapDetails(null);
        } catch (error) {
          console.error("Transaction failed:", error);
          toast.error(
            "Transaction failed: " +
              (error instanceof Error ? error.message : String(error))
          );
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
    onError: (error) => {
      console.error("Chat error in browser:", error);
      toast.error("An error occurred, please try again!");
    },
  });

  // Track previous messages length to detect new messages
  const [prevMessagesLength, setPrevMessagesLength] = useState(
    initialMessages.length
  );
  // Track processed message IDs to prevent infinite loops
  const [processedSwapMessageIds, setProcessedSwapMessageIds] = useState(
    new Set()
  );

  // Process messages for swap operations
  useEffect(() => {
    // Only process if we have a new message (length increased)
    if (messages.length <= prevMessagesLength) {
      setPrevMessagesLength(messages.length);
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (
      !lastMessage ||
      !lastMessage.id ||
      lastMessage.role !== "assistant" ||
      processedSwapMessageIds.has(lastMessage.id)
    ) {
      setPrevMessagesLength(messages.length);
      return;
    }

    console.log("Processing new AI message:", lastMessage.content);

    try {
      // First try standard JSON parsing
      let content;
      let rawContent = lastMessage.content;

      // Check if content is wrapped in a code block
      const codeBlockMatch = rawContent.match(
        /```(?:json)?\s*([\s\S]*?)\s*```/
      );
      if (codeBlockMatch && codeBlockMatch[1]) {
        console.log("Found code block, extracting content");
        rawContent = codeBlockMatch[1];
      }

      try {
        content = JSON.parse(rawContent);
      } catch (jsonError) {
        // If that fails, try to handle Python-style single quotes
        const fixedContent = rawContent
          .replace(/'/g, '"')
          .replace(/\\"/g, '\\\\"'); // Handle escaped quotes

        console.log("Attempting to parse fixed content:", fixedContent);
        content = JSON.parse(fixedContent);
      }

      console.log("@@content", content);
      if (
        content.operation === "swap" &&
        content.transaction_data &&
        content.input_mint &&
        content.output_mint &&
        typeof content.input_amount === "number"
      ) {
        console.log("Received swap operation:", content);

        // Create the user-friendly message
        const userFriendlyContent =
          "Your transaction is being prepared. Please review and sign with your wallet.\n\nTransaction details:\n```" +
          JSON.stringify(content) +
          "```";

        // Update the message in state for immediate UI update
        const updatedMessages = [...messages];
        updatedMessages[updatedMessages.length - 1] = {
          ...lastMessage,
          content: userFriendlyContent,
        };
        setMessages(updatedMessages);

        // Mark as processed to prevent infinite loops
        if (lastMessage.id) {
          setProcessedSwapMessageIds((prev) => {
            const newSet = new Set(prev);
            newSet.add(lastMessage.id);
            return newSet;
          });
        }

        // Set swap details to trigger wallet transaction
        setSwapDetails(content);
      } else {
        console.log("Not a swap operation");
      }
    } catch (e) {
      console.log(
        "Error: " +
          e +
          "\nContent: " +
          (lastMessage ? lastMessage.content : "No content available")
      );
      // Not JSON or doesn't match schema
    }

    mutate("/api/history");
  }, [
    messages,
    mutate,
    prevMessagesLength,
    setMessages,
    processedSwapMessageIds,
  ]);

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher
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
