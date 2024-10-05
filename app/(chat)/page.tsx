import { Chat } from "@/components/chat";
import { generateUUID } from "@/utils/functions";

export default async function Page() {
  const id = generateUUID();
  return <Chat key={id} id={id} initialMessages={[]} />;
}
