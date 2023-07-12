import { Chat } from "@/components/chat"
import { nanoid } from "@/lib/utils"

export interface ChatPageProps {
    params: {
      userId: string
    }
}

export default async function ChatPage({ params }: ChatPageProps) {
    // const id = "Jake"
    // console.log(params.userId, id)
    // return <Chat id = {id} userId={params.userId} />

    return <div>Missing Character ID</div>
}