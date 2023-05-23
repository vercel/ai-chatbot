import { cn } from "@/lib/utils";
import { ExternalLink } from "./external-link";
import { fontMessage } from "@/lib/fonts";

function ExampleBubble({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex-1 flex items-start justify-between p-4 rounded-lg relative bg-zinc-100 text-sm font-medium group hover:bg-zinc-200 hover transition-colors cursor-pointer select-none",
        fontMessage.className
      )}
      style={{}}
    >
      <div
        className="bg-zinc-100 group-hover:bg-zinc-200 w-9 h-6 absolute left-0 top-full -mt-[1px] scale-75 origin-top-left transition-colors"
        style={{
          clipPath:
            'path("M31.1838 0C24.9593 10.7604 13.3251 18 0 18C9.94113 18 18 9.94113 18 0H31.1838Z")',
        }}
      ></div>
      <p>{children}</p>
    </div>
  );
}

export function EmptyScreen() {
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center pt-4 pb-8 pr-0 lg:pr-[260px] lg:pl-16"
      )}
    >
      <div className="p-8 rounded-lg flex flex-col items-center justify-center gap-8 max-w-2xl">
        <div className="flex items-center justify-center gap-6">
          <div className="text-zinc-500 font-medium">
            <p>Welcome to Next.js Chatbot!</p>
            <p className="mt-2">
              This is an open source AI chatbot app built with{" "}
              <ExternalLink href="https://nextjs.org">Next.js</ExternalLink> and{" "}
              <ExternalLink href="https://vercel.com/storage/postgres">
                Vercel Postgres
              </ExternalLink>
              . You can start a conversation here or try the following examples:
            </p>
          </div>
        </div>
        <div className="grid gap-x-4 gap-y-6 grid-cols-2 w-full">
          <ExampleBubble>Explain technical concepts</ExampleBubble>
          <ExampleBubble>Summarize article</ExampleBubble>
          <ExampleBubble>Get assistance</ExampleBubble>
          <ExampleBubble>Draft an email</ExampleBubble>
        </div>
      </div>
    </div>
  );
}
