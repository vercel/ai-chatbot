import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Mock endpoint para interrupção - retorna sucesso imediatamente
    // Quando o backend estiver disponível, descomente o código abaixo:
    /*
    const body = await req.json();
    
    const response = await fetch('http://localhost:8002/api/interrupt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to interrupt' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    */
    
    // Mock response
    return NextResponse.json({
      success: true,
      message: 'Stream interrompido com sucesso (mock)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in interrupt API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}