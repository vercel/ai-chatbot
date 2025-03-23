import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getKnowledgeDocumentById } from '@/lib/db/queries';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';
import fs from 'fs';

// Get paths from environment variables with fallbacks
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage');
const AUDIO_DIR = process.env.AUDIO_DIR || path.join(STORAGE_DIR, 'audio');

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const documentId = id;
    
    // Get the document to verify ownership
    const document = await getKnowledgeDocumentById({ id: documentId });
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Check if document belongs to the authenticated user
    if (document.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Find the audio file in the user's directory
    const userDir = path.join(AUDIO_DIR, session.user.id);
    if (!fs.existsSync(userDir)) {
      return NextResponse.json(
        { error: 'Audio file not found' },
        { status: 404 }
      );
    }
    
    // Look for files that start with the document ID
    const files = fs.readdirSync(userDir);
    const audioFile = files.find(file => file.startsWith(documentId));
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file not found' },
        { status: 404 }
      );
    }
    
    const filePath = path.join(userDir, audioFile);
    
    // Get file details
    const stats = await stat(filePath);
    const fileSize = stats.size;
    
    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'audio/mpeg'; // Default 
    
    switch (ext) {
      case '.mp3':
        contentType = 'audio/mpeg';
        break;
      case '.wav':
        contentType = 'audio/wav';
        break;
      case '.webm':
        contentType = 'audio/webm';
        break;
      case '.ogg':
        contentType = 'audio/ogg';
        break;
      case '.m4a':
        contentType = 'audio/mp4';
        break;
    }

    // Handle range requests for audio streaming
    const range = req.headers.get('range');
    
    if (range) {
      // Parse the range header
      const bytesPrefix = 'bytes=';
      if (range.startsWith(bytesPrefix)) {
        const bytesRange = range.substring(bytesPrefix.length);
        const parts = bytesRange.split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        
        // Check if the range is valid
        if (start >= fileSize || end >= fileSize || start > end) {
          return new NextResponse('Invalid Range', {
            status: 416, // Range Not Satisfiable
            headers: {
              'Content-Range': `bytes */${fileSize}`
            }
          });
        }
        
        // Create headers for the response
        const headers = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': `${end - start + 1}`,
          'Content-Type': contentType,
        };
        
        // Create a readable stream for the requested range
        const stream = fs.createReadStream(filePath, { start, end });
        
        // Use Next.js Response to stream the file
        return new NextResponse(stream as any, {
          status: 206, // Partial Content
          headers
        });
      }
    }
    
    // If no range is requested, return the entire file
    const headers = {
      'Content-Length': fileSize.toString(),
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    };
    
    const stream = fs.createReadStream(filePath);
    return new NextResponse(stream as any, {
      status: 200,
      headers
    });
    
  } catch (error) {
    console.error('Error serving audio file:', error);
    return NextResponse.json(
      { error: 'Failed to serve audio file' },
      { status: 500 }
    );
  }
}