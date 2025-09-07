// Rota otimizada para Claude SDK com o chat principal
import { auth } from '@/app/(auth)/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CLAUDE_API = process.env.CLAUDE_SDK_API_URL || 'http://localhost:8002';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    
    // Extrai mensagem do corpo
    const message = body.message;
    let messageText = '';
    
    if (message?.content) {
      messageText = message.content;
    } else if (message?.parts) {
      const textPart = message.parts.find((p: any) => p.type === 'text');
      messageText = textPart?.text || '';  
    }
    
    if (!messageText) {
      return new Response('No message content', { status: 400 });
    }

    // Chama backend Python com fetch direto
    const backendResponse = await fetch(`${CLAUDE_API}/api/claude/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(session as any)?.accessToken || 'dev-token'}`
      },
      body: JSON.stringify({
        message: messageText,
        session_id: body.id || `chat-${Date.now()}`
      })
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend error: ${backendResponse.status}`);
    }

    // Cria um transform stream para converter SSE para formato AI SDK
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'assistant_text' && data.content) {
                // Formato correto do AI SDK
                const aiChunk = `0:${JSON.stringify(JSON.stringify({
                  type: 'text-delta',
                  textDelta: data.content
                }))}\n`;
                
                controller.enqueue(new TextEncoder().encode(aiChunk));
              } else if (data.type === 'done') {
                // Finaliza corretamente
                controller.enqueue(new TextEncoder().encode('d:{"finishReason":"stop"}\n'));
              }
            } catch (e) {
              // Ignora erros de parse
            }
          }
        }
      }
    });

    // Pipe o stream do backend através do transform
    backendResponse.body?.pipeThrough(transformStream);

    return new Response(transformStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
    
  } catch (error) {
    console.error('Claude chat error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}