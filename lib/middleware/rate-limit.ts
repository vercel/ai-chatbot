/**
 * Rate Limiting Middleware para Next.js
 * Proteção contra abuso de API
 */

import { NextRequest, NextResponse } from 'next/server';
import { appConfig } from '@/lib/config/app-config';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store em memória (em produção, usar Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpar entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Limpar a cada minuto

/**
 * Obtém identificador único do cliente
 */
function getClientIdentifier(request: NextRequest): string {
  // Tentar obter IP real
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // Adicionar user agent para mais granularidade
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Criar hash simples
  return `${ip}-${userAgent.substring(0, 50)}`;
}

/**
 * Middleware de rate limiting
 */
export async function rateLimit(
  request: NextRequest,
  options?: {
    windowMs?: number;
    maxRequests?: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: NextRequest) => string;
  }
) {
  // Verificar se rate limiting está habilitado
  if (!appConfig.isFeatureEnabled('enableRateLimiting')) {
    return NextResponse.next();
  }
  
  const config = appConfig.get('security').rateLimit;
  const windowMs = options?.windowMs || config.windowMs;
  const maxRequests = options?.maxRequests || config.maxRequests;
  
  // Gerar chave única para o cliente
  const key = options?.keyGenerator 
    ? options.keyGenerator(request)
    : getClientIdentifier(request);
  
  const now = Date.now();
  const resetTime = now + windowMs;
  
  // Obter ou criar entrada
  let entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime < now) {
    // Nova janela de tempo
    entry = {
      count: 1,
      resetTime,
    };
    rateLimitStore.set(key, entry);
  } else {
    // Incrementar contador
    entry.count++;
  }
  
  // Verificar limite
  if (entry.count > maxRequests) {
    // Calcular tempo de retry
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
        },
      }
    );
  }
  
  // Adicionar headers informativos
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', (maxRequests - entry.count).toString());
  response.headers.set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());
  
  return response;
}

/**
 * Factory para criar rate limiters específicos
 */
export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  return async (request: NextRequest) => {
    return rateLimit(request, options);
  };
}

/**
 * Rate limiters pré-configurados
 */
export const rateLimiters = {
  // API geral - 100 requests por 15 minutos
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    message: 'Too many API requests',
  }),
  
  // Auth - 5 tentativas por 15 minutos
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many authentication attempts',
  }),
  
  // Claude AI - 30 requests por 5 minutos
  ai: createRateLimiter({
    windowMs: 5 * 60 * 1000,
    maxRequests: 30,
    message: 'Too many AI requests',
  }),
  
  // Upload - 10 uploads por hora
  upload: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    message: 'Too many uploads',
  }),
  
  // Strict - 1 request por minuto (para operações muito sensíveis)
  strict: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 1,
    message: 'Please wait before trying again',
  }),
};

/**
 * Middleware para aplicar rate limiting baseado no path
 */
export async function applyRateLimit(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Aplicar rate limiting específico baseado no path
  if (path.startsWith('/api/auth')) {
    return rateLimiters.auth(request);
  }
  
  if (path.startsWith('/api/claude') || path.startsWith('/api/ai')) {
    return rateLimiters.ai(request);
  }
  
  if (path.startsWith('/api/upload') || path.includes('/artifacts/save')) {
    return rateLimiters.upload(request);
  }
  
  if (path.startsWith('/api/admin')) {
    return rateLimiters.strict(request);
  }
  
  // Rate limiting geral para outras APIs
  if (path.startsWith('/api')) {
    return rateLimiters.api(request);
  }
  
  // Sem rate limiting para rotas não-API
  return NextResponse.next();
}

// Exportar tipos
export type RateLimiter = typeof rateLimiters[keyof typeof rateLimiters];
export type RateLimitOptions = Parameters<typeof rateLimit>[1];