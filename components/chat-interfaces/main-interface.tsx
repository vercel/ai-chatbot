import { PromptForm } from '@/components/prompt-form';
import { ChatList } from '@/components/chat-list'
import { useUIState, useAIState } from 'ai/rsc'
import { UIState } from '@/lib/chat/actions'
import { Session } from '@/lib/types'
import { useEffect } from 'react'

export interface MainInterfaceProps {
    input: string;
    setInput: (value: string) => void;
    session: Session;
}

export interface SideChatProps {
    input: string;
    setInput: (value: string) => void;
    messages: UIState;
}

export function SideChat({input, setInput, session}: MainInterfaceProps) {

    const [messages] = useUIState()
    
    return (
        <div className="h-full flex flex-col justify-between border rounded-md bg-neutral-950 p-6">
            <ChatList messages={messages} session={session} isShared={false}/>
            <PromptForm input={input} setInput={setInput}/>
        </div>
    )
}

export function DatabaseView () {
    return (
        <div className="border rounded-md p-3 h-1/3 bg-neutral-950">
        <h3 className="text-sky-100 text-lg ">Database View</h3>
        <div className="w-full border">
        </div>
        </div>
    )
}

export function QueryResults () {
    const exampleData = [
        {
            "Prompt": "What is Dak Prescott's EPA per play?",
            "Attribute": "dak_prescott_epa_per_play",
            "Response": "0.12"
        }
    ]
    return (
        <div className="h-1/3 border rounded-md p-3 bg-neutral-950 mb-3">
        <h3 className="text-sky-100 text-lg mb-4">Query Results</h3>
        <table className="w-full">
            <thead>
                <tr>
                    <th className="text-left">Prompt</th>
                    <th className="text-left">Attribute</th>
                    <th className="text-left">Response</th>
                </tr>
            </thead>
            <tbody>
                {exampleData.map((row, index) => (
                    <tr key={index}>
                        <td>{row.Prompt}</td>
                        <td>{row.Attribute}</td>
                        <td>{row.Response}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        </div>
    )
}

export function PlotResults () {
    return (
        <div className="h-1/3 border rounded-md p-3 bg-neutral-950 mb-3">
        <h3 className="text-sky-100 text-lg ">Plot Results</h3>
        </div>
    )
}

export function MainInterface({input, setInput}: MainInterfaceProps) {

    const [messages] = useUIState()
    const [aiState] = useAIState()

    return (
        <div className="p-4 w-full flex flex-row x-divide">
            <div className="flex flex-col w-5/12">
                <SideChat 
                    session={aiState.session}
                    input={input}
                    setInput={setInput}
                />
            </div>
            <div className="flex flex-col ml-3 w-7/12">
                <PlotResults />
                <QueryResults />
                <DatabaseView />
            </div>
        </div>
    )
}