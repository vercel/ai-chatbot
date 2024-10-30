import { auth } from "@/app/[locale]/(auth)/auth";
import { Chat } from "@/components/custom/chat";
import { Splash } from "@/components/custom/splash";
import { generateUUID } from "@/lib/utils";

export default async function Page() {
  const id = generateUUID();
  const session = await auth();
  const loggedIn = session && session.user
  console.log(session)
  if (loggedIn) {
    return <Chat key={id} id={id} initialMessages={[]} />;
  } else {
    return <Splash />;
  }
}
