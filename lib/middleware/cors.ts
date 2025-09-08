/**
 * Configuração de CORS para Next.js
 * Resolve problemas de segurança e permite acesso controlado
 */

import { NextRequest, NextResponse } from 'next/server';
import { appConfig } from '@/lib/config/app-config';

/**
 * Configura headers CORS na resposta
 */
export function setCORSHeaders(
  response: NextResponse,
  request: NextRequest,
  options?: {
    origins?: string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
    maxAge?: number;
  }
): NextResponse {
  const corsConfig = appConfig.get('security').cors;
  const origin = request.headers.get('origin') || '';
  
  // Lista de origens permitidas
  const allowedOrigins = options?.origins || corsConfig.origins || ['http://localhost:3000'];
  
  // Verificar se a origem é permitida
  const isAllowed = allowedOrigins.includes('*') || 
                    allowedOrigins.includes(origin) ||
                    (appConfig.isDevelopment() && origin.startsWith('http://localhost'));
  
  if (isAllowed && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  // Métodos permitidos
  const methods = options?.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
  response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
  
  // Headers permitidos
  const headers = options?.headers || [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Session-Id',
    'X-CSRF-Token',
  ];
  response.headers.set('Access-Control-Allow-Headers', headers.join(', '));
  
  // Credentials
  const credentials = options?.credentials ?? corsConfig.credentials;
  if (credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  // Max age para preflight
  const maxAge = options?.maxAge || 86400; // 24 horas
  response.headers.set('Access-Control-Max-Age', maxAge.toString());
  
  // Headers expostos
  response.headers.set('Access-Control-Expose-Headers', [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Session-Id',
  ].join(', '));
  
  return response;
}

/**
 * Middleware CORS para aplicar em rotas
 */
export async function corsMiddleware(
  request: NextRequest,
  options?: Parameters<typeof setCORSHeaders>[2]
): Promise<NextResponse> {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    return setCORSHeaders(response, request, options);
  }
  
  // Para outras requisições, continuar normalmente
  const response = NextResponse.next();
  return setCORSHeaders(response, request, options);
}

/**
 * Factory para criar CORS middleware específico
 */
export function createCORSMiddleware(
  options: Parameters<typeof setCORSHeaders>[2]
) {
  return (request: NextRequest) => corsMiddleware(request, options);
}

/**
 * CORS configs pré-definidas
 */
export const corsPresets = {
  // API pública - mais permissiva
  public: createCORSMiddleware({
    origins: ['*'],
    methods: ['GET', 'POST'],
    credentials: false,
  }),
  
  // API privada - mais restritiva
  private: createCORSMiddleware({
    origins: appConfig.get('security').cors.origins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }),
  
  // Webhook - sem credentials
  webhook: createCORSMiddleware({
    origins: ['*'],
    methods: ['POST'],
    credentials: false,
    headers: ['Content-Type', 'X-Webhook-Signature'],
  }),
  
  // Upload - headers específicos
  upload: createCORSMiddleware({
    origins: appConfig.get('security').cors.origins,
    methods: ['POST', 'PUT'],
    credentials: true,
    headers: [
      'Content-Type',
      'Content-Length',
      'X-File-Name',
      'X-File-Size',
      'Authorization',
    ],
  }),
};

/**
 * Aplica CORS baseado no path
 */
export async function applyCORS(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname;
  
  // APIs públicas
  if (path.startsWith('/api/public')) {
    return corsPresets.public(request);
  }
  
  // Webhooks
  if (path.startsWith('/api/webhook')) {
    return corsPresets.webhook(request);
  }
  
  // Upload
  if (path.includes('/upload') || path.includes('/artifacts/save')) {
    return corsPresets.upload(request);
  }
  
  // APIs privadas (padrão)
  if (path.startsWith('/api')) {
    return corsPresets.private(request);
  }
  
  // Sem CORS para rotas não-API
  return NextResponse.next();
}

/**
 * Headers de segurança adicionais
 */
export function setSecurityHeaders(response: NextResponse): NextResponse {
  // Prevenir XSS
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Prevenir MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Frame options
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  response.headers.set('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  // CSP básico (ajustar conforme necessário)
  if (appConfig.isProduction()) {
    response.headers.set('Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https: blob:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https: wss:; " +
      "frame-ancestors 'none';"
    );
  }
  
  return response;
}