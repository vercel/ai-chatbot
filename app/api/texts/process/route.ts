import { NextRequest, NextResponse } from 'next/server';
import { processText } from '@/lib/extension';

/**
 * Process text files from the Chrome extension
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Process the text
    const result = await processText(body);
    
    // Our processText function doesn't return success property
    // It returns the processed data directly
    if (result) {
      return NextResponse.json({ 
        success: true, 
        message: 'Text processed successfully',
        data: {
          id: body.id,
          filename: result.filename
        }
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to process text'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error processing text:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process text'
    }, { status: 500 });
  }
}