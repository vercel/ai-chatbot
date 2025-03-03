import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createMeeting, getMeeting, deleteMeeting } from '@/lib/whereby/api';

/**
 * API route for creating a new meeting
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    console.error('Unauthorized access to meetings API');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { roomNamePrefix, roomMode, isLocked, endDate } = await req.json();
    
    console.log(`Creating meeting for user ${session.user.id}`);
    
    const meeting = await createMeeting({
      roomNamePrefix,
      roomMode,
      isLocked,
      endDate
    });
    
    return NextResponse.json(meeting);
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create meeting' },
      { status: 500 }
    );
  }
}

/**
 * API route for getting meetings or a specific meeting
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    console.error('Unauthorized access to meetings API');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const meetingId = req.nextUrl.searchParams.get('id');
    
    if (meetingId) {
      console.log(`Getting meeting ${meetingId} for user ${session.user.id}`);
      const meeting = await getMeeting(meetingId);
      return NextResponse.json(meeting);
    }
    
    // In a real implementation, this would return a list of meetings from a database
    // For this demo, we're returning a mock list
    return NextResponse.json([
      {
        meetingId: 'abc123',
        roomUrl: 'https://whereby.com/abc123',
        hostRoomUrl: 'https://whereby.com/abc123?host=true',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        title: 'Team Standup'
      },
      {
        meetingId: 'def456',
        roomUrl: 'https://whereby.com/def456',
        hostRoomUrl: 'https://whereby.com/def456?host=true',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        title: 'Project Review'
      }
    ]);
  } catch (error: any) {
    console.error('Error getting meetings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve meetings' },
      { status: 500 }
    );
  }
}

/**
 * API route for deleting a meeting
 */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    console.error('Unauthorized access to meetings API');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const meetingId = req.nextUrl.searchParams.get('id');
    
    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }
    
    console.log(`Deleting meeting ${meetingId} for user ${session.user.id}`);
    
    await deleteMeeting(meetingId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete meeting' },
      { status: 500 }
    );
  }
} 