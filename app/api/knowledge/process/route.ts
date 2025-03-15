import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

/**
 * API route for processing document content
 * This route is simplified to only handle text content
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the request body
    const { sourceType, content, url } = await req.json();
    
    // Validate the request
    if (!sourceType) {
      return NextResponse.json(
        { error: 'Missing source type' },
        { status: 400 }
      );
    }

    let processedContent = '';
    
    // Process different source types
    switch (sourceType) {
      case 'text':
        // Text doesn't need processing
        processedContent = content || '';
        break;
        
      default:
        return NextResponse.json(
          { error: `Unsupported source type: ${sourceType}. Only text is supported in this version.` },
          { status: 400 }
        );
    }

    // Return the processed content
    return NextResponse.json({
      success: true,
      content: processedContent,
    });
    
  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
