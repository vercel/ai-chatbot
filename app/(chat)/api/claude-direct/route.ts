// Rota direta para Claude SDK - mais simples
export async function POST(request: Request) {
  const CLAUDE_API = process.env.CLAUDE_SDK_API_URL || 'http://localhost:8002';
  
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    // Extrai mensagem do formato do chat
    let messageText = '';
    if (body.message?.content) {
      messageText = body.message.content;
    } else if (body.message?.parts) {
      const textPart = body.message.parts.find((p: any) => p.type === 'text');
      messageText = textPart?.text || '';
    } else if (typeof body.message === 'string') {
      messageText = body.message;
    }
    
    if (!messageText) {
      return new Response('No message', { status: 400 });
    }
    
    // Chama o backend Python
    const response = await fetch(`${CLAUDE_API}/api/claude/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-token'
      },
      body: JSON.stringify({
        message: messageText,
        session_id: body.id || `session-${Date.now()}`
      })
    });
    
    // Passa o stream SSE direto
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response('Error', { status: 500 });
  }
}