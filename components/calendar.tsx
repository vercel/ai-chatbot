
import { Button } from "@/components/ui/button"
import { auth, EnrichedSession } from 'auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { Event } from '@microsoft/microsoft-graph-types'

// define a prop type for the events prop


export default async function Calendar() {

  const session = (await auth()) as EnrichedSession;

  if (!session) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  // const { AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET } = process.env;
  // const clientId = AUTH_GOOGLE_ID;
  // const clientSecret = AUTH_GOOGLE_SECRET;
  const accessToken = session?.accessToken;
  const refreshToken = session?.refreshToken;
  console.log('Access token: ', accessToken);



  const client = Client.init({
    authProvider: (done) =>
      done(
        null,
        accessToken // WHERE DO WE GET THIS FROM?
      ),
  });
  
  let response = await client.api('/me/events')
	.select('subject,body,bodyPreview,organizer,attendees,start,end,location')
	.get();
  
    const events: Event[] = await response.value;


  // const [view, setView] = useState<"day" | "week" | "month">("month")
  // const [currentDate, setCurrentDate] = useState(new Date())

  // Helper function to format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  // Helper function to get events for a specific date
  const getEventsForDate = (date: Date): Event[] => {
    return events.filter(event => 
      event.start?.dateTime === date.toDateString()
    );
  }

  // Function to render day view
  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    return (
      <div className="grid grid-cols-1 gap-4">
        {dayEvents.map(event => (
          <div key={event.id} className="bg-card p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">{event.start?.dateTime}</div>
              <div className="text-sm text-muted-foreground">{event.subject}</div>
            </div>
            <div className="text-sm text-muted-foreground">{event.bodyPreview}</div>
          </div>
        ))}
      </div>
    )
  }

  // Function to render week view
  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    return (
      <div className="grid grid-cols-7 gap-4">
        {[...Array(7)].map((_, index) => {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + index);
          const dayEvents = getEventsForDate(day);
          
          return (
            <div key={index} className="bg-card p-4 rounded-lg">
              <div className="text-lg font-medium">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className="text-sm text-muted-foreground">{formatDate(day)}</div>
              <div className="mt-4 grid gap-2">
                {dayEvents.map(event => (
                  <div key={event.id} className="bg-primary text-primary-foreground p-2 rounded-md">
                    <div className="text-sm font-medium">{event.start?.dateTime}</div>
                    <div className="text-xs">{event.subject}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Function to render month view
  const renderMonthView = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const calendar = [];
    let day = startDate;

    while (day <= monthEnd || calendar.length % 7 !== 0) {
      const dayEvents = getEventsForDate(day);
      calendar.push(
        <div key={day.toISOString()} className="bg-card p-4 rounded-lg">
          <div className="text-lg font-medium">{day.getDate()}</div>
          <div className="grid gap-2 mt-4">
            {dayEvents.map(event => (
              <div key={event.id} className="bg-primary text-primary-foreground p-2 rounded-md">
                <div className="text-sm font-medium">{event.start?.dateTime}</div>
                <div className="text-xs">{event.subject}</div>
              </div>
            ))}
          </div>
        </div>
      );
      day = new Date(day.setDate(day.getDate() + 1));
    }

    return <div className="grid grid-cols-7 gap-4">{calendar}</div>;
  }

  return (
    <div className="bg-background rounded-lg shadow-lg">
      <header className="flex items-center justify-between bg-card p-4 rounded-t-lg">
        <div className="flex items-center gap-4">
          <Button
            variant={view === "day" ? "secondary" : "ghost"}
            onClick={() => setView("day")}
            className="px-3 py-1 rounded-md"
          >
            Day
          </Button>
          <Button
            variant={view === "week" ? "secondary" : "ghost"}
            onClick={() => setView("week")}
            className="px-3 py-1 rounded-md"
          >
            Week
          </Button>
          <Button
            variant={view === "month" ? "secondary" : "ghost"}
            onClick={() => setView("month")}
            className="px-3 py-1 rounded-md"
          >
            Month
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="p-2 rounded-md" onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))}>
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <div className="text-lg font-medium">
            {formatDate(currentDate)}
          </div>
          <Button variant="ghost" className="p-2 rounded-md" onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))}>
            <ChevronRightIcon className="w-5 h-5" />
          </Button>
        </div>
      </header>
      <div className="p-4">
        {view === "day" && renderDayView()}
        {view === "week" && renderWeekView()}
        {view === "month" && renderMonthView()}
      </div>
    </div>
  )
}


function ChevronLeftIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}


function ChevronRightIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}


function XIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}