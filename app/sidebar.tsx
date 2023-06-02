import { Login } from "@/components/ui/login";
import { NextChatLogo } from "@/components/ui/nextchat-logo";
import { UserMenu } from "@/components/ui/user-menu";
import { db, chats } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { type Session } from "@auth/nextjs/types";
import { eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { SidebarItem } from "./sidebar-item";
import { ExternalLink } from "./external-link";

export interface SidebarProps {
  session?: Session;
  newChat?: boolean;
}

export function Sidebar({ session, newChat }: SidebarProps) {
  return (
    <div className="hidden shrink-0 bg-zinc-200/80 dark:bg-black md:flex md:w-[260px] md:flex-col">
      <div className="flex h-full min-h-0 flex-col ">
        <div className="scrollbar-trigger relative h-full w-full flex-1 items-start">
          <aside className="flex h-full w-full flex-col p-2 shadow-lg ring-1 ring-zinc-900/10 dark:ring-zinc-200/10 relative z-10">
            <div className="flex flex-row gap-1 items-center justify-between text-base font-semibold tracking-tight antialiased bg-black text-white px-4 py-4 -m-2 mb-2">
              <div className="flex flex-row gap-2 whitespace-nowrap items-center">
                <NextChatLogo className="h-6 w-6" />
                <span className="select-none">Next.js Chatbot</span>
              </div>
              <div>
                {session?.user ? <UserMenu session={session} /> : <Login />}
              </div>
            </div>
            <Link
              href="/"
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-2 rounded p-2 text-sm text-zinc-800 dark:text-zinc-200 font-medium transition-colors duration-300 dark:hover:bg-zinc-300/20 select-none",
                newChat
                  ? "bg-zinc-500/20 text-zinc-900 font-semibold hover:bg-zinc-500/30 dark:text-white"
                  : "hover:bg-zinc-500/10"
              )}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Link>

            <div className="mt-2 pt-2 border-t border-zinc-300 dark:border-zinc-700 flex-1 flex-col overflow-y-auto overflow-x-hidden transition-opacity duration-500">
              <div className="flex flex-col pb-2 text-sm text-zinc-100">
                {/* @ts-ignore */}
                <SidebarList session={session} />
              </div>
            </div>

            <div>
              <div className="flex gap-4 items-center justify-center text-sm font-medium leading-4 whitespace-nowrap">
                <a
                  href="https://github.com/vercel/nextjs-ai-chatbot/"
                  target="_blank"
                  className="inline-flex gap-2 px-3 py-2 items-center border border-zinc-300 rounded-md hover:border-zinc-600 transition-colors"
                >
                  <svg
                    aria-label="Vercel logomark"
                    height="13"
                    role="img"
                    className="w-auto overflow-hidden"
                    viewBox="0 0 74 64"
                  >
                    <path
                      d="M37.5896 0.25L74.5396 64.25H0.639648L37.5896 0.25Z"
                      fill="var(--geist-foreground)"
                    ></path>
                  </svg>
                  <span>Deploy</span>
                </a>
                <ExternalLink href="https://github.com/vercel/nextjs-ai-chatbot/">
                  View on GitHub
                </ExternalLink>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

Sidebar.displayName = "Sidebar";

async function SidebarList({ session }: { session?: Session }) {
  const results: any[] = await (
    await unstable_cache(
      () =>
        db.query.chats.findMany({
          columns: {
            id: true,
            title: true,
          },
          where: eq(chats.userId, session?.user?.email || ""),
        }),
      // @ts-ignore
      [session?.user?.id || ""],
      {
        revalidate: 3600,
      }
    )
  )();

  return results.map((c) => (
    <SidebarItem key={c.id} title={c.title} href={`/chat/${c.id}`} id={c.id} />
  ));
}
