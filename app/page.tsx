import { getServerSession } from "@/lib/session/get-server-session";
import { Chat } from "./chat";
import { Sidebar } from "./sidebar";

// Prisma does not support Edge without the Data Proxy currently
export const runtime = "nodejs"; // default
export const preferredRegion = "home";
export const dynamic = "force-dynamic";

export default async function IndexPage() {
  const session = await getServerSession();
  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <Sidebar session={session} newChat />
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Chat />
      </div>
    </div>
  );
}
