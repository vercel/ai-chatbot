import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Extrai a última mensagem do usuário
    const messages = body.messages || [];
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
    const userContent = lastUserMessage?.content || body.message || 'Mensagem vazia';
    
    // Mock simples para testar a integração
    const mockResponse = {
      type: 'assistant_text',
      content: `Recebi sua mensagem: "${userContent}". Esta é uma resposta de teste da integração com o Claude Chat.`,
      session_id: body.sessionId || body.session_id || '00000000-0000-0000-0000-000000000001',
      timestamp: new Date().toISOString()
    };

    // Simula stream SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Envia chunks da resposta
        const words = mockResponse.content.split(' ');
        for (const word of words) {
          const chunk = {
            type: 'text_chunk',
            content: word + ' ',
            session_id: mockResponse.session_id
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          await new Promise(resolve => setTimeout(resolve, 100)); // Delay entre palavras
        }
        
        // Envia resultado final
        const result = {
          type: 'result',
          session_id: mockResponse.session_id,
          input_tokens: 10,
          output_tokens: 15,
          cost_usd: 0.0001
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
        
        // Sinaliza fim
        const done = {
          type: 'done',
          session_id: mockResponse.session_id
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(done)}\n\n`));
        
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in test API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}