import { NextRequest, NextResponse } from 'next/server';
import { claudeUnified, type ChatRequest } from '@/lib/ai/claude-unified';
import { z } from 'zod';

// Schema de validação
const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
  sessionId: z.string().optional(),
  provider: z.enum(['claude-sdk', 'claude-chat', 'claude-main']).optional(),
  stream: z.boolean().optional(),
  options: z.object({
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    tools: z.array(z.string()).optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Validar request
    const body = await req.json();
    const validatedData = requestSchema.parse(body);
    
    // Se for streaming
    if (validatedData.stream) {
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of claudeUnified.streamChat(validatedData as ChatRequest)) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
            
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } catch (error) {
            const errorChunk = {
              type: 'error',
              error: error instanceof Error ? error.message : 'Erro desconhecido',
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
          } finally {
            controller.close();
          }
        },
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
    
    // Chat sem streaming
    const response = await claudeUnified.chat(validatedData as ChatRequest);
    
    return NextResponse.json({
      success: true,
      ...response,
    });
    
  } catch (error) {
    console.error('Erro na API unificada:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

// Endpoint de health check
export async function GET(req: NextRequest) {
  try {
    const health = await claudeUnified.healthCheck();
    
    return NextResponse.json({
      ...health,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}