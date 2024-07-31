// create a page that renders the calendar component

import Calendar from "@/components/calendar";
import { EnrichedSession, auth } from "@/auth";

export default async function CalendarPage() {
  const session = (await auth()) as EnrichedSession;
  return (
    <div>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
