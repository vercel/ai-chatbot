import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// Caminho para o SDK Python
const SDK_PATH = '/home/suthub/.claude/api-claude-code-app/claude-code-sdk-python';

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
          // Script Python inline para usar o SDK
          const escapedContent = userContent
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
            
          const pythonScript = `
import sys
import os
import asyncio
import json
sys.path.insert(0, '${SDK_PATH}/src')

from src import query, ClaudeCodeOptions

async def main():
    prompt = "${escapedContent}"
    
    # Só usa session_id se for um UUID válido
    import re
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.I)
    
    options = ClaudeCodeOptions(
        permission_mode='acceptEdits'
    )
    
    # Só adiciona session_id se for UUID válido
    if '${sessionId}' and uuid_pattern.match('${sessionId}'):
        options.session_id = '${sessionId}'
    
    try:
        async for message in query(prompt=prompt, options=options):
            if hasattr(message, 'content'):
                # Processa conteúdo da mensagem
                if isinstance(message.content, list):
                    for block in message.content:
                        if hasattr(block, 'text'):
                            output = {
                                'type': 'text_chunk',
                                'content': block.text,
                                'session_id': '${sessionId}'
                            }
                            print(f"data: {json.dumps(output)}")
                            sys.stdout.flush()
                elif isinstance(message.content, str):
                    output = {
                        'type': 'text_chunk',
                        'content': message.content,
                        'session_id': '${sessionId}'
                    }
                    print(f"data: {json.dumps(output)}")
                    sys.stdout.flush()
            
            # Se for mensagem de resultado
            if hasattr(message, 'result'):
                result = {
                    'type': 'result',
                    'session_id': '${sessionId}',
                    'input_tokens': getattr(message.result, 'input_tokens', 0),
                    'output_tokens': getattr(message.result, 'output_tokens', 0),
                    'cost_usd': getattr(message.result, 'cost_usd', 0)
                }
                print(f"data: {json.dumps(result)}")
                sys.stdout.flush()
        
        # Sinaliza fim
        done = {
            'type': 'done',
            'session_id': '${sessionId}'
        }
        print(f"data: {json.dumps(done)}")
        sys.stdout.flush()
        
    except Exception as e:
        error = {
            'type': 'error',
            'message': str(e),
            'session_id': '${sessionId}'
        }
        print(f"data: {json.dumps(error)}")
        sys.stdout.flush()

if __name__ == '__main__':
    asyncio.run(main())
`;

          // Executa script Python
          const python = spawn('python3', ['-c', pythonScript], {
            env: {
              ...process.env,
              PYTHONPATH: `${SDK_PATH}/src:${SDK_PATH}`,
              CLAUDE_CODE_ENTRYPOINT: 'sdk-web'
            },
            cwd: SDK_PATH
          });
          
          let buffer = '';
          let isClosed = false;
          
          // Processa stdout
          python.stdout.on('data', (data: Buffer) => {
            if (isClosed) return;
            
            buffer += data.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ') && !isClosed) {
                try {
                  controller.enqueue(encoder.encode(line + '\n\n'));
                } catch (e) {
                  console.error('Error enqueueing:', e);
                  isClosed = true;
                }
              }
            }
          });
          
          // Processa stderr para debug
          python.stderr.on('data', (data: Buffer) => {
            const error = data.toString();
            console.error('Python stderr:', error);
            
            // Se for erro crítico, envia ao cliente
            if (error.includes('Error') || error.includes('Exception')) {
              const errorData = {
                type: 'error',
                message: error.substring(0, 200),
                session_id: sessionId
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
            }
          });
          
          // Quando o processo termina
          python.on('close', (code: number) => {
            if (code !== 0) {
              console.error('Python process exited with code', code);
            }
            if (!isClosed) {
              controller.close();
              isClosed = true;
            }
          });
          
          // Trata erros
          python.on('error', (err: Error) => {
            console.error('Python process error:', err);
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
            message: error.message || 'Failed to start Python process',
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
    console.error('Error in SDK API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}