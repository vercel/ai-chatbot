import { cookies } from 'next/headers';
import { Conversation } from "@/components/conversation";

export default async function CallPage() {
  const cookieStore = await cookies();
  return (
      <>
        <Conversation />
      </>
  );
}