"use client";

import { PromptForm } from '@/components/prompt-form';
import { ChatList } from '@/components/chat-list'
import { useUIState, useAIState } from 'ai/rsc'
import { UIState } from '@/lib/chat/actions'
import { Session } from '@/lib/types'
import { useState, useEffect } from 'react'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'
import { ChatPanel } from '@/components/chat-panel'
import { nanoid } from 'nanoid'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { IconCopy } from '@/components/ui/icons'

export interface MainInterfaceProps {
    input: string;
    setInput: (value: string) => void;
    session: Session|undefined;
}

export interface SideChatProps {
    input: string;
    setInput: (value: string) => void;
    messages: UIState;
}

export interface ToolResult {
    prompt: string;
    result: string;
}

export interface AIMessage {
    role: string;
    content: Array<{
        type: string;
        result: {
            userPrompt: string;
            queryAnswer: string;
        }
    }>;
}

export function SideChat({input, setInput, session}: MainInterfaceProps) {

    const [messages] = useUIState()
    const { messagesRef, isAtBottom, scrollToBottom } = useScrollAnchor()
    
    return (
        <div ref={messagesRef} className="h-full overflow-scroll flex flex-col justify-between border rounded-md p-6">
            <ButtonScrollToBottom
                isAtBottom={isAtBottom}
                scrollToBottom={scrollToBottom}
            />
            <ChatList messages={messages} session={session} isShared={false}/>
            <ChatPanel
              position="absolute bottom-0"
              id={nanoid()}
              input={input}
              setInput={setInput}
            />
        </div>
    )
}

export function QueryResults () {

    const aiState = useAIState()
    const [toolResults, setToolResults] = useState<ToolResult[]>([]);

    useEffect(() => {
        const queryResults = []
        const toolMessages = aiState[0].messages.filter((message: AIMessage) => message.role === 'tool')
        if (!toolMessages) return
        
        for (const message of toolMessages) {
            for (const content of message.content) {
                if (content.type === 'tool-result') {
                    
                    queryResults.push({
                        prompt: content.result.userPrompt,
                        result: content.result.queryAnswer
                    })
                }
            }
        }

        if (queryResults.length > 0) {
            setToolResults([...queryResults])
        }

    }, [aiState])

    return (
        <div className="h-full border rounded-md rounded-md p-3 mb-3 overflow-y-scroll">
        <h3 className="text-sky-800 text-lg mb-4">Query Results</h3>
        <table className="w-full slate-500 rounded-md">
            <thead>
                <tr>
                    <th className="text-left w-1/3 text-md rounded-md p-1">Prompt</th>
                    <th className="text-left w-1/3 text-md rounded-md p-1">Response</th>
                    <th className="text-left w-1/3 text-md rounded-md p-1"></th>
                </tr>
            </thead>
            <tbody>
                {toolResults.map((data, index) => (
                    <tr key={index}>
                        <td className="text-left w-1/2 text-md p-1">
                        <div className=" rounded-md p-2">
                                <p className="text-zinc-600">{data?.prompt}</p>
                            </div></td>
                        <td className="text-left w-1/3 text-md p-1">
                            <div className=" rounded-md p-2">
                                <p className="text-zinc-600">{data?.result}</p>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        </div>
    )
}

export function PlotResults () {
    return (
        <div className="h-1/2 border rounded-md p-3 mb-3">
        <h3 className=" text-sky-800 text-lg ">Plot Results</h3>
        </div>
    )
}

export function MainInterface({input, setInput}: MainInterfaceProps) {

    const [messages] = useUIState()
    const [aiState] = useAIState()
    const { scrollRef } = useScrollAnchor()

    return (
        <div className="p-4 w-full flex flex-row x-divide h-full">
            <div ref={scrollRef} className="flex flex-col w-5/12">
                <SideChat 
                    session={aiState.session}
                    input={input}
                    setInput={setInput}
                />
            </div>
            <div className="flex flex-col ml-3 w-7/12">
                <QueryResults />
                {/* <PlotResults /> */}
            </div>
        </div>
    )
}