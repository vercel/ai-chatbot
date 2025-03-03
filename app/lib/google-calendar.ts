export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  meetingLink?: string;
  description?: string;
}

export async function fetchCalendarEvents(accessToken: string): Promise<CalendarEvent[]> {
  try {
    const timeMin = new Date();
    timeMin.setHours(0, 0, 0, 0);
    
    const timeMax = new Date();
    timeMax.setHours(23, 59, 59, 999);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const data = await response.json();
    
    return data.items.map((item: any) => ({
      id: item.id,
      title: item.summary,
      startTime: item.start.dateTime || item.start.date,
      endTime: item.end.dateTime || item.end.date,
      meetingLink: item.hangoutLink || item.conferenceData?.entryPoints?.[0]?.uri,
      description: item.description,
    }));
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
} 