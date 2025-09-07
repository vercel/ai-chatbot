import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

// Schema de validação para artifact
const artifactSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(255),
  content: z.string(),
  type: z.enum(['text', 'code', 'markdown']),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  metadata: z.object({
    language: z.string().optional(),
    tags: z.array(z.string()).optional()
  }).optional()
});

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação (opcional - pode salvar para guests também)
    const session = await getServerSession();
    
    // Parse e validar o body
    const body = await req.json();
    const validatedData = artifactSchema.parse(body);
    
    // Aqui você salvaria no banco de dados
    // Por enquanto, vamos simular salvamento com sucesso
    
    // Se tivéssemos um banco configurado:
    // await db.artifacts.upsert({
    //   where: { id: validatedData.id },
    //   update: {
    //     title: validatedData.title,
    //     content: validatedData.content,
    //     type: validatedData.type,
    //     updatedAt: new Date()
    //   },
    //   create: {
    //     ...validatedData,
    //     userId: session?.user?.id || 'guest',
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   }
    // });

    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: 'Artifact salvo com sucesso',
      artifactId: validatedData.id
    });

  } catch (error) {
    console.error('Erro ao salvar artifact:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dados inválidos', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao salvar artifact' 
      },
      { status: 500 }
    );
  }
}