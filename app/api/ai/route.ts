import { Message, StreamingTextResponse, OpenAIStream } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { messages, id, selectedChatModel } = await request.json();
    console.log('AI API received request:', { 
      id, 
      selectedChatModel,
      messageCount: messages.length,
      messageTypes: messages.map((m: Message) => m.role).join(', ')
    });
    
    // Get your API key from environment variables
    const apiKey = process.env.AI_PROVIDER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI API key not configured' },
        { status: 500 }
      );
    }
    
    // Create an OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });
    
    // Format messages for the OpenAI API
    const formattedMessages = messages.map((message: Message) => ({
      role: message.role,
      content: message.content,
    }));
    console.log('Formatted messages for OpenAI:', formattedMessages);
    
    // Determine the model to use
    let modelName = 'gpt-4o-mini';
    if (selectedChatModel) {
      if (selectedChatModel === 'fast') {
        modelName = 'gpt-4o-mini';
      } else if (selectedChatModel === 'smart') {
        modelName = 'gpt-4o';
      } else {
        modelName = selectedChatModel;
      }
    }

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: formattedMessages,
      stream: true,
    });
    
    // Use the AI SDK's built-in stream converter
    const stream = OpenAIStream(response, {
      onStart: async () => {
        console.log('Stream started');
      },
      onToken: async (token: string) => {
        console.log('Token received:', token);
      },
      onCompletion: async (completion: string) => {
        console.log('Stream completed');
      }
    });
    
    // Return using StreamingTextResponse for proper SSE handling
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Error in AI API:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return NextResponse.json(
      { error: 'Failed to process AI request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 