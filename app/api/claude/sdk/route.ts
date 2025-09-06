import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages || [];
    const sessionId = body.sessionId || `session-${Date.now()}`;
    
    // Extrai última mensagem do usuário
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
    const userContent = lastUserMessage?.content || '';
    
    if (!userContent) {
      return NextResponse.json(
        { error: 'No message content provided' },
        { status: 400 }
      );
    }
    
    // Criar stream de resposta
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Usa timeout para evitar travamento e echo para enviar comando
          const escapedContent = userContent.replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\$/g, "\\$");
          const claudeProcess = spawn('bash', [
            '-c', 
            `timeout 10 bash -c 'echo "${escapedContent}" | CI=true NONINTERACTIVE=1 claude -p 2>&1'`
          ], {
            env: process.env,
            shell: false
          });
          
          let buffer = '';
          
          // Captura stdout
          claudeProcess.stdout.on('data', (data) => {
            const text = data.toString();
            buffer += text;
            
            // Envia chunks conforme recebe
            const chunk = {
              type: 'text_chunk',
              content: text,
              session_id: sessionId
            };
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          });
          
          // Captura stderr para debug
          claudeProcess.stderr.on('data', (data) => {
            console.error('Claude stderr:', data.toString());
          });
          
          // Quando o processo termina
          claudeProcess.on('close', (code) => {
            if (code !== 0 && buffer.length === 0) {
              // Se falhou e não tem resposta, envia mensagem de erro
              const errorChunk = {
                type: 'text_chunk',
                content: 'Desculpe, não consegui processar sua mensagem. Por favor, tente novamente.',
                session_id: sessionId
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
            }
            
            // Envia evento de fim
            const endEvent = {
              type: 'end',
              session_id: sessionId
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(endEvent)}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          });
          
          // Tratamento de erro do processo
          claudeProcess.on('error', (error) => {
            console.error('Claude process error:', error);
            
            // Fallback para respostas básicas se Claude falhar
            let fallbackResponse = '';
            const lowerContent = userContent.toLowerCase();
            
            if (lowerContent.includes('olá') || lowerContent.includes('oi')) {
              fallbackResponse = 'Olá! Como posso ajudar você hoje?';
            } else if (lowerContent.includes('teste')) {
              fallbackResponse = 'Sistema funcionando! (modo fallback)';
            } else {
              fallbackResponse = 'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente.';
            }
            
            const errorChunk = {
              type: 'text_chunk',
              content: fallbackResponse,
              session_id: sessionId
            };
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'end', session_id: sessionId })}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          });
          
        } catch (error) {
          console.error('Stream error:', error);
          const errorEvent = {
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
          controller.close();
        }
      }
    });
    
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.error('SDK Route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}