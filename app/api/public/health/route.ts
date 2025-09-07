/**
 * API pública com cache ISR
 * Exemplo de endpoint otimizado com cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { claudeUnified } from '@/lib/ai/claude-unified';
import { appConfig } from '@/lib/config/app-config';

// Configurar cache para 1 minuto
export const revalidate = 60;

// Permitir requisições de qualquer origem
export const runtime = 'edge'; // Edge runtime para melhor performance

export async function GET(request: NextRequest) {
  try {
    // Verificar saúde do sistema
    const health = await claudeUnified.healthCheck();
    
    // Informações do sistema
    const systemInfo = {
      app: {
        name: appConfig.get('app').name,
        version: appConfig.get('app').version,
        environment: appConfig.get('app').environment,
      },
      status: health.status,
      providers: health.providers,
      features: {
        artifacts: appConfig.isFeatureEnabled('enableArtifacts'),
        mcp: appConfig.isFeatureEnabled('enableMCP'),
        guestUsers: appConfig.isFeatureEnabled('enableGuestUsers'),
        rateLimiting: appConfig.isFeatureEnabled('enableRateLimiting'),
        cache: appConfig.isFeatureEnabled('enableCache'),
      },
      timestamp: new Date().toISOString(),
      cache: {
        status: 'cached',
        revalidateIn: `${revalidate} seconds`,
      },
    };
    
    // Headers de cache
    const response = NextResponse.json(systemInfo);
    
    // Cache público por 1 minuto
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate');
    
    // CORS para API pública
    response.headers.set('Access-Control-Allow-Origin', '*');
    
    return response;
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to get system health',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}