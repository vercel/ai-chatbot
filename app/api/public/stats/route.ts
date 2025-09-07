/**
 * API de estatísticas públicas com cache ISR
 */

import { NextRequest, NextResponse } from 'next/server';
import { getArtifactRepository } from '@/lib/repositories/artifact-repository';

// Revalidar a cada 5 minutos
export const revalidate = 300;

// Edge runtime para melhor performance
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const artifactRepo = getArtifactRepository();
    
    // Estatísticas públicas (não sensíveis)
    const stats = {
      artifacts: {
        total: await artifactRepo.count(),
        byType: {
          text: await artifactRepo.count({ type: 'text' } as any),
          code: await artifactRepo.count({ type: 'code' } as any),
          markdown: await artifactRepo.count({ type: 'markdown' } as any),
        },
      },
      cache: {
        status: 'cached',
        revalidateIn: `${revalidate} seconds`,
        cachedAt: new Date().toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };
    
    const response = NextResponse.json(stats);
    
    // Cache headers
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    response.headers.set('CDN-Cache-Control', 'max-age=300');
    response.headers.set('Vercel-CDN-Cache-Control', 'max-age=300');
    
    // CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    
    return response;
    
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}