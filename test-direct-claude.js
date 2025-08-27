// Teste direto do backend Claude SDK
const http = require('http');

async function testDirectBackend() {
  console.log('🔬 Testando comunicação direta com Claude SDK Backend...\n');
  
  const sessionId = `test-session-${Date.now()}`;
  
  const requestData = JSON.stringify({
    message: "Olá! Responda apenas: 'Oi, estou funcionando!'",
    session_id: sessionId
  });

  const options = {
    hostname: '127.0.0.1',
    port: 8002,
    path: '/api/claude/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': requestData.length
    }
  };

  return new Promise((resolve, reject) => {
    console.log('📤 Enviando requisição para:', `http://${options.hostname}:${options.port}${options.path}`);
    console.log('📋 Payload:', requestData);
    
    const req = http.request(options, (res) => {
      console.log(`📥 Status Code: ${res.statusCode}`);
      console.log(`📥 Headers:`, res.headers);
      
      let data = '';
      let eventBuffer = '';
      
      res.on('data', (chunk) => {
        data += chunk.toString();
        eventBuffer += chunk.toString();
        
        // Processa eventos SSE conforme chegam
        const events = eventBuffer.split('\n\n');
        eventBuffer = events.pop() || ''; // Mantém o último incompleto
        
        for (const event of events) {
          if (event.trim()) {
            const lines = event.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonData = JSON.parse(line.slice(6));
                  if (jsonData.type === 'assistant_text') {
                    process.stdout.write(jsonData.content || '');
                  } else if (jsonData.type === 'result') {
                    console.log('\n\n✅ Resultado final recebido!');
                    console.log('📊 Tokens:', { 
                      input: jsonData.input_tokens, 
                      output: jsonData.output_tokens 
                    });
                  } else if (jsonData.type === 'error') {
                    console.log('\n❌ Erro:', jsonData.error);
                  }
                } catch (e) {
                  // Ignora erros de parse
                }
              }
            }
          }
        }
      });
      
      res.on('end', () => {
        console.log('\n\n🏁 Stream finalizado');
        console.log('📦 Total de dados recebidos:', data.length, 'bytes');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error);
      reject(error);
    });

    req.write(requestData);
    req.end();
  });
}

// Executar teste
testDirectBackend()
  .then(() => console.log('\n✅ Teste concluído!'))
  .catch(err => console.error('\n❌ Teste falhou:', err));