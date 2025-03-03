'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Video, Share2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { MeetingRoom } from '@/components/meeting-room';

interface Meeting {
  meetingId: string;
  roomUrl: string;
  hostRoomUrl: string;
  startDate: string;
  endDate: string;
  title?: string;
}

export default function MeetsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [joinUrl, setJoinUrl] = useState('');
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch meetings on page load
    fetchMeetings();
  }, []);
  
  async function fetchMeetings() {
    try {
      const response = await fetch('/api/meetings');
      if (!response.ok) throw new Error('Failed to fetch meetings');
      const data = await response.json();
      setMeetings(data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    }
  }
  
  async function handleCreateMeeting() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomNamePrefix: 'wizzo-meeting',
          roomMode: 'normal',
          isLocked: false,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create meeting');
      
      const meeting = await response.json();
      toast.success('Meeting created successfully');
      
      // Set the active meeting and embed URL
      setActiveMeeting(meeting);
      setEmbedUrl(meeting.hostRoomUrl);
      
      // Refresh the meetings list
      fetchMeetings();
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error('Failed to create meeting');
    } finally {
      setIsLoading(false);
    }
  }
  
  function handleJoinMeeting() {
    if (!joinUrl) {
      toast.error('Please enter a meeting link or ID');
      return;
    }
    
    let url = joinUrl;
    
    // If the user entered just an ID, convert it to a URL
    if (!url.startsWith('http') && !url.includes('/')) {
      url = `https://whereby.com/${url}`;
    }
    
    // Set the embed URL for the meeting iframe
    setEmbedUrl(url);
    setJoinUrl('');
  }
  
  async function handleShareMeeting(meeting: Meeting) {
    try {
      await navigator.clipboard.writeText(meeting.roomUrl);
      toast.success('Meeting link copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy meeting link');
    }
  }

  function handleCloseMeeting() {
    setEmbedUrl(null);
    setActiveMeeting(null);
  }

  function handleJoinExistingMeeting(meeting: Meeting) {
    setActiveMeeting(meeting);
    setEmbedUrl(meeting.roomUrl);
  }

  return (
    <div className="flex flex-col w-full h-full p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Video Meetings</h1>
      </div>
      
      {embedUrl ? (
        <MeetingRoom 
          roomUrl={embedUrl} 
          onClose={handleCloseMeeting}
          title={activeMeeting?.title || "Meeting Room"}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Video className="mr-2 h-5 w-5" />
                Start a New Meeting
              </h2>
              <p className="text-muted-foreground mb-6">
                Create a new video meeting and invite participants to join. Share your screen, chat, and collaborate in real-time.
              </p>
              <Button 
                className="w-full" 
                onClick={handleCreateMeeting}
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Start New Meeting'}
              </Button>
            </div>
            
            <div className="border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Join a Meeting
              </h2>
              <p className="text-muted-foreground mb-6">
                Join an existing meeting by entering the meeting URL or ID provided by the host.
              </p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Paste meeting link or ID"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={joinUrl}
                  onChange={(e) => setJoinUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinMeeting()}
                />
                <Button onClick={handleJoinMeeting}>Join</Button>
              </div>
            </div>
          </div>
          
          <div className="mt-8 border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Recent Meetings</h2>
            {meetings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No recent meetings found
              </p>
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <div key={meeting.meetingId} className="flex justify-between items-center p-4 border rounded-md">
                    <div>
                      <h3 className="font-medium">{meeting.title || `Meeting ${meeting.meetingId}`}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(meeting.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleShareMeeting(meeting)}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleJoinExistingMeeting(meeting)}
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Screen Sharing</h3>
                <p className="text-sm text-muted-foreground">Share your screen during meetings.</p>
              </div>
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Meeting Chat</h3>
                <p className="text-sm text-muted-foreground">Chat with participants during the meeting.</p>
              </div>
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Meeting Recording</h3>
                <p className="text-sm text-muted-foreground">Record your meetings for later review.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 