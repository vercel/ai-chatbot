import { ensurePageSession } from "@/lib/auth/route-guards";
import { MeetingTranscriberClient } from "@/components/meeting/transcriber";

export default async function Page() {
  await ensurePageSession();
  return <MeetingTranscriberClient />;
}
