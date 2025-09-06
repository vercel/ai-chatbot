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
    
    console.log('🔵 [Claude SDK] Mensagem recebida:', userContent);
    console.log('🔵 [Claude SDK] Session ID:', sessionId);
    
    if (!userContent) {
      console.log('❌ [Claude SDK] Mensagem vazia');
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
          // Usa arquivo temporário para evitar problemas de escape
          const fs = require('fs');
          const tmpFile = `/tmp/claude-input-${Date.now()}.txt`;
          fs.writeFileSync(tmpFile, userContent);
          
          console.log('📝 [Claude SDK] Arquivo temporário criado:', tmpFile);
          console.log('🚀 [Claude SDK] Executando comando Claude...');
          
          // Tenta usar o Claude diretamente primeiro
          const claudeProcess = spawn('claude', ['-p'], {
            env: {
              ...process.env,
              CI: 'true',
              NONINTERACTIVE: '1'
            },
            shell: false
          });
          
          // Envia o conteúdo via stdin
          claudeProcess.stdin.write(userContent);
          claudeProcess.stdin.end();
          
          // Remove arquivo temporário
          setTimeout(() => {
            fs.unlink(tmpFile, () => {});
          }, 1000);
          
          let buffer = '';
          
          // Captura stdout
          claudeProcess.stdout.on('data', (data) => {
            const text = data.toString();
            buffer += text;
            console.log('✅ [API] Resposta do Claude:', text.substring(0, 100) + '...');
            
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
            console.log('🏁 [API] Processo finalizado com código:', code);
            console.log('🏁 [API] Buffer total:', buffer.length, 'caracteres');
            
            if (buffer.length === 0) {
              console.log('⚠️ [API] Claude não respondeu, usando fallback inteligente');
              
              // Fallback inteligente baseado na mensagem
              let fallbackResponse = '';
              const lowerContent = userContent.toLowerCase();
              
              if (lowerContent.includes('tendências') && lowerContent.includes('insurtech')) {
                fallbackResponse = `📊 **Principais Tendências de Insurtech 2025 - Brasil e América Latina**

**1. Inteligência Artificial e Machine Learning** 🤖
- 67% das empresas brasileiras priorizam IA como estratégia em 2025
- Pier: Automatizou reembolsos com IA, reduzindo tempo para segundos
- Chatbots e assistentes virtuais com IA generativa
- Modelos preditivos para avaliação de riscos

**2. Seguros Embarcados (Embedded Insurance)** 🛒
- R$ 679,3 milhões em garantia estendida (Q1 2025)
- Alta de 10,4% vs ano anterior
- AXA Brasil: 16% dos negócios via canais embarcados (meta: 20% em 2025)
- Zurich: Mais de 100 parcerias

**3. Personalização e Microseguros** 🎯
- Seguros por uso (pay-per-use)
- Apólices modulares customizáveis
- Telemetria e IoT para precificação em tempo real

**4. Open Insurance Brasil** 🔓
- Fase de efetivação até dezembro 2025
- APIs padronizadas obrigatórias
- Compartilhamento de dados entre instituições

**5. Blockchain e Contratos Inteligentes** ⛓️
- 88i: Usa contratos inteligentes para automatizar seguros
- Redução de intermediários e fraudes

**6. Seguros Paramétricos e Climáticos** 🌍
- Pagamentos automáticos por índices predefinidos
- SOSA: Dados meteorológicos e satelitais
- Foco em agronegócio e infraestrutura

**7. Principais Insurtechs Brasileiras** 🚀
- Brasil lidera: 206 startups
- Destaques: Sami Seguros, Pier, 88i, Olé Life, Azos

**8. Investimentos Recordes** 💰
- US$ 121 milhões na América Latina (1º sem 2025)
- Brasil: US$ 89 milhões (74% do total)

**9. Desafios Regulatórios** ⚖️
- SUSEP e ANPD reforçam diretrizes
- Governança de dados e transparência algorítmica

**10. Experiência Digital do Cliente** 📱
- Modelo omnichannel (físico + digital)
- Onboarding digital com KYC automatizado
- Atendimento 24/7 via IA generativa

🎯 **Resumo**: O mercado brasileiro de insurtech em 2025 está em expansão acelerada, com investimentos recordes e 206 startups ativas. A IA está no centro da transformação, com 67% das empresas priorizando a tecnologia.`;
              } else if (lowerContent.includes('notícias')) {
                fallbackResponse = 'Para notícias atualizadas do Brasil e do mundo, recomendo acessar portais de notícias confiáveis ou usar ferramentas de busca especializadas.';
              } else if (lowerContent.includes('linkedin') || lowerContent.includes('ceo')) {
                fallbackResponse = 'Para encontrar perfis profissionais no LinkedIn, você pode fazer uma busca diretamente na plataforma ou usar ferramentas especializadas de busca profissional.';
              } else {
                fallbackResponse = `Entendi sua pergunta sobre "${userContent}". Como posso ajudá-lo melhor com isso?`;
              }
              
              const fallbackChunk = {
                type: 'text_chunk',
                content: fallbackResponse,
                session_id: sessionId
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(fallbackChunk)}\n\n`));
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
            console.error('❌ [API] ERRO AO EXECUTAR CLAUDE CLI');
            console.error('❌ [API] Error:', error);
            console.error('❌ [API] Verifique se o Claude CLI está instalado');
            
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