import { NextRequest, NextResponse } from 'next/server';
import { processNote } from '@/lib/extension';

/**
 * Process notes from the Chrome extension
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Process the note
    const result = await processNote(body);
    
    // Our processNote function doesn't return success property
    // It returns the processed data directly
    if (result) {
      return NextResponse.json({ 
        success: true, 
        message: 'Note processed successfully',
        data: {
          id: body.id,
          filename: result.filename
        }
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to process note'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error processing note:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process note'
    }, { status: 500 });
  }
}