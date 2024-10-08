import { Chat } from "@/components/chat";
import { generateUUID } from "@/utils/functions";

import { auth } from "../(auth)/auth";

export default async function Page() {
  const id = generateUUID();
  const session = await auth();

  return <Chat key={id} id={id} initialMessages={[]} user={session?.user} />;
}
