import ChatBoxSimple from "@/components/ChatBoxSimple";
import ContextDrawer from "@/components/ContextDrawer";
import VideoLoop from "@/components/VideoLoop";
import { ABOUT_TEXT, INITIAL_MESSAGES, MEMORY_ITEMS } from "@/lib/mockData";

export default function ChatPage() {
  return (
    <div className="h-full">
      <div className="grid h-full gap-6 lg:grid-cols-[280px,1fr]">
        {/* Avatar column (hidden on small screens) */}
        <div className="hidden flex-col gap-4 lg:flex">
          <div className="aspect-square w-full">
            <VideoLoop blur={14} mask="circle" />
          </div>
          <ContextDrawer about={ABOUT_TEXT} memory={MEMORY_ITEMS} />
        </div>

        {/* Chat column */}
        <div className="flex flex-col">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <h1 className="font-semibold text-2xl">Chat</h1>
            <ContextDrawer about={ABOUT_TEXT} memory={MEMORY_ITEMS} />
          </div>
          <ChatBoxSimple initialMessages={INITIAL_MESSAGES} />
        </div>
      </div>
    </div>
  );
}
