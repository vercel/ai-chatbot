import { auth } from '@/app/(auth)/auth';
import { NextResponse } from 'next/server';

const CLAUDE_SDK_API_URL = process.env.CLAUDE_SDK_API_URL || 'http://localhost:8001';

export async function POST(request: Request) {
  const session = await auth();
  
  // Em desenvolvimento, permite acesso sem autenticação
  const userId = session?.user?.id || 'dev-user';
  const userEmail = session?.user?.email || 'dev@test.com';
  
  try {
    const body = await request.json();
    const { id: chatId, message } = body;
    
    // Extrai o conteúdo da mensagem
    let messageContent = '';
    if (message?.content) {
      messageContent = message.content;
    } else if (message?.parts) {
      const textPart = message.parts.find((p: any) => p.type === 'text');
      messageContent = textPart?.text || '';
    }
    
    if (!messageContent) {
      throw new Error('No message content');
    }
    
    console.log('Sending to Claude SDK:', { messageContent, chatId });
    
    // Envia para o backend Python
    const response = await fetch(`${CLAUDE_SDK_API_URL}/api/claude/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(session as any)?.accessToken || 'dev-token'}`
      },
      body: JSON.stringify({
        message: messageContent,
        session_id: chatId || `chat-${Date.now()}`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      throw new Error(`Backend error: ${response.status}`);
    }

    // Converte SSE do backend para formato AI SDK
    const reader = response.body?.getReader();
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        if (!reader) return;
        
        const decoder = new TextDecoder();
        let buffer = '';
        let assistantMessage = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'assistant_text' && data.content) {
                    assistantMessage += data.content;
                    
                    // Formato AI SDK para texto
                    const chunk = `0:"${JSON.stringify({type: 'text-delta', textDelta: data.content}).replace(/"/g, '\\"')}"\n`;
                    controller.enqueue(encoder.encode(chunk));
                  } else if (data.type === 'done') {
                    // Finaliza o stream
                    controller.enqueue(encoder.encode('d:{"finishReason":"stop"}\n'));
                  }
                } catch (e) {
                  console.error('Parse error:', e);
                }
              }
            }
          }
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
      },
    });
  } catch (error) {
    console.error('Claude SDK route error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Claude SDK' },
      { status: 500 }
    );
  }
}