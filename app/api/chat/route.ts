import { NextRequest, NextResponse } from 'next/server';
import { generateUUID } from '@/lib/utils';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';

// Define what the notebook context should look like
interface NotebookContext {
  blockId: string;
  blockType: 'markdown' | 'python' | 'csv';
  notebookId: string;
}

// POST /api/chat - Simplified chat API that just forwards to the AI API
export async function POST(request: NextRequest) {
  try {
    // Parse the request
    const json = await request.json();
    const { id } = json;
    let { messages } = json;
    const notebookContext = json.notebookContext as NotebookContext | undefined;
    const selectedChatModel = 'fast'; //json.selectedChatModel || DEFAULT_CHAT_MODEL;

    
    // Add context to system message if this is a notebook context request
    if (notebookContext) {
      let systemMessage = "You are a helpful AI assistant.";
      
      // Add block-specific context to the system message
      switch (notebookContext.blockType) {
        case 'markdown':
          systemMessage = "You are a helpful AI assistant specialized in markdown formatting and text improvement. Help the user enhance their markdown content.";
          break;
        case 'python':
          systemMessage = "You are a helpful AI assistant specialized in Python programming. Help the user analyze, debug, and improve their Python code.";
          break;
        case 'csv':
          systemMessage = "You are a helpful AI assistant specialized in data analysis. Help the user understand, clean, and visualize their CSV data.";
          break;
      }

      // Update or add system message
      const hasSystemMessage = messages.some(
        (message: any) => message.role === 'system'
      );

      if (hasSystemMessage) {
        messages = messages.map((message: any) => {
          if (message.role === 'system') {
            return { ...message, content: systemMessage };
          }
          return message;
        });
      } else {
        messages = [{ role: 'system', content: systemMessage }, ...messages];
      }
    }
    
    // Log the formatted messages
    console.log('Formatted messages:', {
      messageCount: messages.length,
      context: notebookContext?.blockType || 'general',
      model: selectedChatModel
    });
    
    // Forward directly to the AI API (not via nextAuth)
    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/ai`;
    
    console.log('Sending request to:', apiUrl);
    
    // Get the authorization header from the original request if any
    const authHeader = request.headers.get('Authorization');
    
    // Direct API call
    const response = await fetch(
      // Ensure we have a valid absolute URL by using the request's URL as base if needed
      new URL(apiUrl.startsWith('http') ? apiUrl : `/api/ai`, request.nextUrl.origin), 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add a development bypass header for authentication
          'X-Auth-Skip': 'true',
          // Forward any authorization header if present
          ...(authHeader ? { 'Authorization': authHeader } : {}),
        },
        body: JSON.stringify({
          messages,
          id: id || generateUUID(),
          selectedChatModel,
        }),
      }
    );
    
    // If there's an error from the AI API
    if (!response.ok) {
      try {
        const errorData = await response.json();
        return NextResponse.json(
          { error: 'AI service error', details: errorData },
          { status: response.status }
        );
      } catch (e) {
        return NextResponse.json(
          { error: 'AI service error', details: { status: response.status, statusText: response.statusText } },
          { status: response.status }
        );
      }
    }
    
    // Return the streaming response directly
    console.log('Forwarding stream response to client');
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request', details: String(error) },
      { status: 500 }
    );
  }
} 