'use client';

import { useState } from 'react';

export default function TestClaude() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const testClaude = async () => {
    setLoading(true);
    setResponse('');
    
    try {
      const res = await fetch('/api/claude-sdk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: `test-${Date.now()}`,
          message: {
            content: message || 'Olá, teste do Claude SDK!'
          }
        })
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('0:"')) {
              try {
                const jsonStr = line.slice(3, -1).replace(/\\"/g, '"');
                const data = JSON.parse(jsonStr);
                if (data.type === 'text-delta') {
                  fullResponse += data.textDelta;
                  setResponse(fullResponse);
                }
              } catch (e) {
                console.log('Parse error:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Test error:', error);
      setResponse(`Erro: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Teste do Claude Code SDK</h1>
      
      <div className="max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Mensagem de teste:
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        
        <button
          onClick={testClaude}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Testar Claude SDK'}
        </button>
        
        {response && (
          <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="font-semibold mb-2">Resposta:</h2>
            <p className="whitespace-pre-wrap">{response}</p>
          </div>
        )}
        
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800">Info:</h3>
          <p className="text-sm text-yellow-700">
            Backend: http://localhost:8002<br/>
            Rota: /api/claude-sdk<br/>
            Status: {loading ? '🔄 Enviando...' : '✅ Pronto'}
          </p>
        </div>
      </div>
    </div>
  );
}