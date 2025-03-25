import { NextResponse } from 'next/server';
import { createKnowledgeDocument } from '@/lib/knowledge';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as Blob;
    const title = formData.get('title') as string;
    const meetingUrl = formData.get('meetingUrl') as string;

    // Convert audio blob to base64
    const buffer = await audio.arrayBuffer();
    const base64Audio = Buffer.from(buffer).toString('base64');

    // Create knowledge document with recording
    const document = await createKnowledgeDocument({
      title,
      content: `Meeting Recording\nURL: ${meetingUrl}\nRecording: [Audio File]`,
      metadata: {
        type: 'meeting_recording',
        meetingUrl,
        audioData: base64Audio,
      },
    });

    return NextResponse.json({ success: true, documentId: document.id });
  } catch (error) {
    console.error('Error saving recording:', error);
    return NextResponse.json(
      { error: 'Failed to save recording' },
      { status: 500 }
    );
  }
} 