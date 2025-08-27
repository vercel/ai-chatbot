#!/usr/bin/env node

// Teste rápido da integração Claude SDK

const API_URL = 'http://localhost:8001';

async function testChat() {
    console.log('🧪 Testando integração Claude Code SDK...\n');
    
    try {
        // 1. Testar health check
        console.log('1. Testando health check...');
        const healthRes = await fetch(`${API_URL}/health`);
        const health = await healthRes.json();
        console.log('✅ Health:', health);
        
        // 2. Testar envio de mensagem
        console.log('\n2. Enviando mensagem de teste...');
        const chatRes = await fetch(`${API_URL}/api/claude/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer dev-token'
            },
            body: JSON.stringify({
                message: 'Olá! Responda apenas: "Claude SDK funcionando!"',
                session_id: 'test-session-' + Date.now()
            })
        });
        
        console.log('✅ Response status:', chatRes.status);
        console.log('✅ Response headers:', Object.fromEntries(chatRes.headers.entries()));
        
        // 3. Ler stream SSE
        console.log('\n3. Lendo resposta SSE...');
        const reader = chatRes.body.getReader();
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
                            process.stdout.write(data.content);
                            fullResponse += data.content;
                        } else if (data.type === 'error') {
                            console.error('\n❌ Erro:', data.error);
                        }
                    } catch (e) {
                        // Ignorar linhas que não são JSON
                    }
                }
            }
        }
        
        console.log('\n\n✅ Teste concluído com sucesso!');
        console.log('📝 Resposta completa:', fullResponse);
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

testChat();