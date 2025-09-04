import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages || [];
    const sessionId = body.sessionId || body.session_id;
    
    // Extrai última mensagem do usuário
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
    const userContent = lastUserMessage?.content || '';
    
    if (!userContent) {
      return NextResponse.json(
        { error: 'No message content provided' },
        { status: 400 }
      );
    }
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Argumentos para o Claude CLI
          const args = [
            '--output-format', 'stream-json'
          ];
          
          // Se temos um sessionId, tentamos resumir a sessão
          if (sessionId && sessionId !== '00000000-0000-0000-0000-000000000001') {
            args.push('--resume', sessionId);
          }
          
          // Spawn do processo Claude
          const claude = spawn('/usr/local/bin/claude', args, {
            env: {
              ...process.env,
              CLAUDE_CODE_ENTRYPOINT: 'sdk-web'
            }
          });
          
          let buffer = '';
          let inputTokens = 0;
          let outputTokens = 0;
          
          // Envia a mensagem para o stdin
          claude.stdin.write(JSON.stringify({
            type: 'user',
            message: {
              role: 'user',
              content: userContent
            }
          }) + '\n');
          
          // Processa stdout
          claude.stdout.on('data', (data: Buffer) => {
            buffer += data.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (!line.trim()) continue;
              
              try {
                const parsed = JSON.parse(line);
                
                // Converte formato do CLI para formato esperado pelo frontend
                if (parsed.type === 'assistant_text') {
                  const chunk = {
                    type: 'text_chunk',
                    content: parsed.text || parsed.content || '',
                    session_id: sessionId || parsed.session_id
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                } else if (parsed.type === 'usage') {
                  inputTokens = parsed.input_tokens || 0;
                  outputTokens = parsed.output_tokens || 0;
                } else if (parsed.type === 'done' || parsed.type === 'assistant_end') {
                  // Envia métricas
                  const result = {
                    type: 'result',
                    session_id: sessionId,
                    input_tokens: inputTokens,
                    output_tokens: outputTokens,
                    cost_usd: calculateCost(inputTokens, outputTokens)
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
                  
                  // Sinaliza fim
                  const done = {
                    type: 'done',
                    session_id: sessionId
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(done)}\n\n`));
                }
              } catch (e) {
                // Ignora linhas que não são JSON válido
                console.log('Non-JSON output:', line);
              }
            }
          });
          
          // Processa stderr para debug
          claude.stderr.on('data', (data: Buffer) => {
            console.error('Claude stderr:', data.toString());
          });
          
          // Quando o processo termina
          claude.on('close', (code: number) => {
            if (code !== 0) {
              console.error('Claude process exited with code', code);
              const error = {
                type: 'error',
                message: `Process exited with code ${code}`,
                session_id: sessionId
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(error)}\n\n`));
            }
            controller.close();
          });
          
          // Trata erros
          claude.on('error', (err: Error) => {
            console.error('Claude process error:', err);
            const error = {
              type: 'error',
              message: err.message,
              session_id: sessionId
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(error)}\n\n`));
            controller.close();
          });
          
        } catch (error: any) {
          console.error('Stream error:', error);
          const errorData = {
            type: 'error',
            message: error.message || 'Failed to start Claude process',
            session_id: sessionId
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
          controller.close();
        }
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
    console.error('Error in stream API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateCost(inputTokens: number, outputTokens: number): number {
  // Preços do Claude 3.5 Sonnet
  const inputCost = (inputTokens / 1000000) * 3; // $3 por milhão
  const outputCost = (outputTokens / 1000000) * 15; // $15 por milhão
  return inputCost + outputCost;
}