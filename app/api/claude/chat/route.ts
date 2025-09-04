import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Extrai mensagens e sessionId
    const messages = body.messages || [];
    const sessionId = body.sessionId || body.session_id || '00000000-0000-0000-0000-000000000001';
    
    // Se API key não está configurada, tenta backend Python
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('ANTHROPIC_API_KEY não configurada, tentando backend Python...');
      
      try {
        const response = await fetch('http://localhost:8002/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          // Backend Python disponível, usa ele
          const stream = new ReadableStream({
            async start(controller) {
              const reader = response.body?.getReader();
              const decoder = new TextDecoder();

              if (!reader) {
                controller.close();
                return;
              }

              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  
                  const chunk = decoder.decode(value, { stream: true });
                  controller.enqueue(new TextEncoder().encode(chunk));
                }
              } finally {
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
        }
      } catch (backendError) {
        console.log('Backend Python não disponível, usando mock response');
      }
      
      // Se backend Python falhar, retorna mock
      return mockResponse(messages, sessionId);
    }
    
    // Usa API Anthropic via chamada HTTP direta
    const anthropicMessages = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Faz chamada direta para API Anthropic
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY || '',
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 4096,
              messages: anthropicMessages,
              stream: true,
            }),
          });
          
          if (!response.ok) {
            throw new Error(`API Anthropic retornou erro: ${response.status}`);
          }
          
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let inputTokens = 0;
          let outputTokens = 0;
          
          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    
                    if (data.type === 'content_block_delta') {
                      const text = data.delta?.text || '';
                      
                      const chunkData = {
                        type: 'text_chunk',
                        content: text,
                        session_id: sessionId
                      };
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunkData)}\n\n`));
                    } else if (data.type === 'message_start') {
                      if (data.message?.usage) {
                        inputTokens = data.message.usage.input_tokens || 0;
                      }
                    } else if (data.type === 'message_delta') {
                      if (data.usage?.output_tokens) {
                        outputTokens = data.usage.output_tokens;
                      }
                    }
                  } catch (e) {
                    // Ignora linhas que não são JSON válido
                  }
                }
              }
            }
          }
          
          // Calcula custo
          const inputCost = (inputTokens / 1000000) * 3;
          const outputCost = (outputTokens / 1000000) * 15;
          const totalCost = inputCost + outputCost;
          
          const result = {
            type: 'result',
            session_id: sessionId,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            cost_usd: totalCost
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
          
          const done = {
            type: 'done',
            session_id: sessionId
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(done)}\n\n`));
          
        } catch (error: any) {
          console.error('Erro ao chamar API Anthropic:', error);
          const errorData = {
            type: 'error',
            message: error.message || 'Erro ao processar mensagem',
            session_id: sessionId
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
        } finally {
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
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Resposta quando não há backend disponível
function mockResponse(messages: any[], sessionId: string) {
  const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
  const userContent = lastUserMessage?.content || '';
  
  // Respostas mais naturais baseadas no contexto
  let responseContent = '';
  
  const lowerContent = userContent.toLowerCase();
  
  if (lowerContent.includes('olá') || lowerContent.includes('oi')) {
    responseContent = 'Olá! Como posso ajudar você hoje?';
  } else if (lowerContent.includes('tudo bem') || lowerContent.includes('como vai')) {
    responseContent = 'Estou bem, obrigado por perguntar! Em que posso ajudar?';
  } else if (lowerContent.includes('quem é você') || lowerContent.includes('qual seu nome')) {
    responseContent = 'Sou Claude, um assistente de IA criado pela Anthropic. Estou aqui para ajudar com suas perguntas e tarefas.';
  } else if (lowerContent.includes('ajuda') || lowerContent.includes('help')) {
    responseContent = 'Claro! Posso ajudar com programação, análise de texto, resolução de problemas e muito mais. Sobre o que você gostaria de conversar?';
  } else {
    // Resposta genérica para outras mensagens
    responseContent = `Entendi sua mensagem: "${userContent}". Como posso ajudá-lo com isso?`;
  }
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Simula digitando palavra por palavra
      const words = responseContent.split(' ');
      for (const word of words) {
        const chunk = {
          type: 'text_chunk',
          content: word + ' ',
          session_id: sessionId
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 40));
      }
      
      // Simula métricas
      const inputTokens = userContent.split(' ').length * 1.3;
      const outputTokens = responseContent.split(' ').length * 1.3;
      
      const result = {
        type: 'result',
        session_id: sessionId,
        input_tokens: Math.floor(inputTokens),
        output_tokens: Math.floor(outputTokens),
        cost_usd: 0.00001
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
      
      const done = {
        type: 'done',
        session_id: sessionId
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
}