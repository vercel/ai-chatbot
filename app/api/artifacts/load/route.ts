import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession();
    
    // Aqui você carregaria do banco de dados
    // Por enquanto, vamos retornar dados mock
    
    // Se tivéssemos um banco configurado:
    // const artifacts = await db.artifacts.findMany({
    //   where: { 
    //     userId: session?.user?.id || 'guest' 
    //   },
    //   orderBy: { updatedAt: 'desc' }
    // });

    // Dados mock para demonstração
    const mockArtifacts = [
      {
        id: 'artifact-demo-1',
        title: 'Documento de Exemplo',
        content: '# Bem-vindo ao Sistema de Artifacts!\n\nEste é um documento de exemplo para demonstrar as funcionalidades.',
        type: 'markdown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          tags: ['exemplo', 'demo']
        }
      }
    ];

    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json({
      success: true,
      artifacts: session ? mockArtifacts : [],
      count: session ? mockArtifacts.length : 0
    });

  } catch (error) {
    console.error('Erro ao carregar artifacts:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao carregar artifacts',
        artifacts: []
      },
      { status: 500 }
    );
  }
}