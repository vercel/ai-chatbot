// Teste direto da integração com Claude SDK
const fetch = require('node-fetch');

async function testClaudeIntegration() {
  console.log('🧪 Testando integração com Claude SDK...\n');
  
  const apiUrl = 'http://localhost:8001';
  const sessionId = `test-${Date.now()}`;
  
  try {
    // 1. Test health check
    console.log('1️⃣ Testando health check...');
    const healthResp = await fetch(`${apiUrl}/health`);
    const health = await healthResp.json();
    console.log('✅ Health:', health);
    
    // 2. Test chat endpoint sem auth (development mode)
    console.log('\n2️⃣ Enviando mensagem de teste...');
    const chatResp = await fetch(`${apiUrl}/api/claude/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Olá! Responda em uma linha apenas.',
        session_id: sessionId
      })
    });
    
    if (!chatResp.ok) {
      console.log('❌ Status:', chatResp.status);
      const error = await chatResp.text();
      console.log('❌ Erro:', error);
      return;
    }
    
    console.log('✅ Resposta recebida! Processando stream...\n');
    
    // 3. Process SSE stream
    const reader = chatResp.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'assistant_text') {
              process.stdout.write(data.content || '');
              fullResponse += data.content || '';
            } else if (data.type === 'result') {
              console.log('\n\n📊 Estatísticas:');
              console.log(`   Input tokens: ${data.input_tokens}`);
              console.log(`   Output tokens: ${data.output_tokens}`);
              if (data.cost_usd) {
                console.log(`   Custo: $${data.cost_usd}`);
              }
            } else if (data.type === 'error') {
              console.log('\n❌ Erro:', data.error);
            }
          } catch (e) {
            // Ignora erros de parse
          }
        }
      }
    }
    
    console.log('\n\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Run test
testClaudeIntegration();