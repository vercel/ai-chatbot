'use client'

import { useActions, useUIState } from 'ai/rsc'
import { IconArrowRight } from "./ui/icons";
import { nanoid } from "@/lib/utils";
import { ChatMessage } from "./chat-message";
import { Message } from "ai";

export function FollowUpQuestionsCards({followUpQuestions}: {followUpQuestions: string[]}) {
  const [messages, setMessages] = useUIState()
  const { submitUserMessage } = useActions()


  const onClickQuestion = async (question: string) => {
    const userMessage = {
      id: nanoid(),
      content: question,
      role: 'user'
    } as Message

    // Optimistically add user message UI
    setMessages(currentMessages => [
      ...currentMessages,
      {
        id: nanoid(),
        display: <ChatMessage message={userMessage} />
      }
    ])

    // Submit and get response message
    const responseMessage = await submitUserMessage(question)
    setMessages(currentMessages => [...currentMessages, responseMessage])
  }


  if (followUpQuestions.length === 0) return null

  return (
    <div className="pt-8">
      <h3 className="text-sm text-muted-foreground">Ask another question</h3>
      <div className="mt-3 flex flex-col gap-3">
        {followUpQuestions.map((question, ind) => (
          <div className="mt-3 flex flex-col gap-3" key={ind} onClick={() => onClickQuestion(question)}>
            <div className="border-1 flex rounded-md border p-4 transition-colors duration-200 ease-in-out hover:bg-gray-50">
              <div className="flex shrink-0 items-center justify-center pr-3">
                <IconArrowRight className="size-4 text-muted-foreground" />
              </div>
              <div className="flex min-w-0 max-w-full flex-col">
                <h3 className="truncate text-sm">{question}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


