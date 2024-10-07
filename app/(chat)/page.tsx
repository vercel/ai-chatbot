import { Chat } from "@/components/chat";
import { generateUUID } from "@/utils/functions";
import { getUserFromSession } from "../(auth)/actions";

export default async function Page() {
  const id = generateUUID();
  const user = await getUserFromSession();
  return <Chat key={id} id={id} initialMessages={[]} user={user} />;
}
