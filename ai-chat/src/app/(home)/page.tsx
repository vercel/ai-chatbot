import { ChatHeader } from "@ai-chat/components/chat-header";
import { Greeting } from "@ai-chat/components/greeting";

import { DEFAULT_CHAT_MODEL } from "@ai-chat/lib/ai/models";

export default function Home() {
  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={"asdfasfasfasf"}
          selectedModelId={DEFAULT_CHAT_MODEL}
          selectedVisibilityType={"public"}
          isReadonly={true}
          session={{}}
        />

        <Greeting />
        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {/* {!true && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
              selectedVisibilityType={visibilityType}
            />
          )} */}
        </form>
      </div>
    </>
  );
}
