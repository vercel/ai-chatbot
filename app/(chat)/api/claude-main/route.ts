// Rota simplificada para Claude SDK no chat principal
import { auth } from '@/app/(auth)/auth';

const CLAUDE_API = process.env.CLAUDE_SDK_API_URL || 'http://127.0.0.1:8002';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Claude Main Route - Request:', body);
    
    // Extrai texto da mensagem
    let messageText = '';
    const message = body.message;
    
    if (typeof message === 'string') {
      messageText = message;
    } else if (message?.content) {
      messageText = message.content;
    } else if (message?.parts) {
      const textPart = message.parts.find((p: any) => p.type === 'text');
      messageText = textPart?.text || '';
    }
    
    if (!messageText) {
      console.error('No message text found in:', body);
      return new Response('No message', { status: 400 });
    }

    console.log('Sending to backend:', messageText);

    // Chama o backend Python
    const response = await fetch(`${CLAUDE_API}/api/claude/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-token'
      },
      body: JSON.stringify({
        message: messageText,
        session_id: body.id || `session-${Date.now()}`
      })
    });

    if (!response.ok) {
      console.error('Backend error:', response.status);
      throw new Error(`Backend error: ${response.status}`);
    }

    // Cria um stream transformado para o formato do AI SDK
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) return;
        
        let buffer = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // Envia evento de finalização
              controller.enqueue(encoder.encode('d:{"finishReason":"stop"}\n'));
              break;
            }
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'assistant_text' && data.content) {
                    // Formato do AI SDK
                    const event = {
                      type: 'text-delta',
                      textDelta: data.content
                    };
                    
                    // Formato específico do streaming protocol
                    const chunk = `0:${JSON.stringify(JSON.stringify(event))}\n`;
                    controller.enqueue(encoder.encode(chunk));
                  }
                } catch (e) {
                  console.error('Parse error:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
    
  } catch (error) {
    console.error('Claude main route error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}