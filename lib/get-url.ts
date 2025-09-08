import { NextRequest } from 'next/server';

/**
 * Configuração de URLs com detecção automática para múltiplos subdomínios
 * Otimizado para funcionar com Caddy como proxy reverso
 */

// Domínios permitidos (segurança contra host header injection)
const ALLOWED_HOSTS = [
  'suthub.agentesintegrados.com',
  'melhorias-suthub.agentesintegrados.com',
  'localhost:3033',
  'localhost:3000'
];

/**
 * Obtém a URL base da aplicação com detecção inteligente
 * Funciona perfeitamente com Caddy passando headers X-Forwarded-*
 * @param request - Request object (opcional)
 * @returns URL base absoluta
 */
export function getBaseUrl(request?: Request | NextRequest | null): string {
  // Se temos um request, detectar automaticamente
  if (request) {
    // Caddy passa esses headers corretamente
    const headers = request.headers;
    const host = headers.get('x-forwarded-host') || 
                 headers.get('host');
    const proto = headers.get('x-forwarded-proto') || 'https';
    
    // Validação de segurança - só aceita domínios permitidos
    if (host && ALLOWED_HOSTS.some(allowed => host.includes(allowed))) {
      // Para localhost, sempre http
      if (host.includes('localhost')) {
        return `http://${host}`;
      }
      // Para produção, sempre https (Caddy força SSL)
      return `${proto}://${host}`;
    }
  }
  
  // Fallback baseado no ambiente
  if (typeof window !== 'undefined') {
    // Client-side: usa a URL atual do browser
    return window.location.origin;
  }
  
  // Server-side: usa variável de ambiente ou default para branch melhorias
  return process.env.DEFAULT_URL || 
         process.env.NEXT_PUBLIC_APP_URL || 
         'https://melhorias-suthub.agentesintegrados.com';
}

/**
 * Helper específico para NextAuth
 * NextAuth precisa de URL absoluta para callbacks
 * @param request - Request object (opcional)
 * @returns URL absoluta para NextAuth
 */
export function getAuthUrl(request?: Request | NextRequest | null): string {
  // Prioriza variáveis de ambiente específicas do NextAuth se definidas
  return process.env.NEXTAUTH_URL || 
         process.env.AUTH_URL || 
         getBaseUrl(request);
}

/**
 * Verifica se um host é permitido
 * @param host - Host para validar
 * @returns true se o host é permitido
 */
export function isAllowedHost(host: string): boolean {
  return ALLOWED_HOSTS.some(allowed => host.includes(allowed));
}

/**
 * Obtém o ambiente baseado no host
 * @param host - Host atual
 * @returns 'production' | 'development'
 */
export function getEnvironment(host?: string): 'production' | 'development' {
  if (!host) {
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
  }
  
  if (host.includes('localhost')) {
    return 'development';
  }
  
  return 'production';
}

/**
 * Cria uma URL absoluta a partir de um caminho relativo
 * @param path - Caminho relativo (ex: '/login')
 * @param request - Request object (opcional)
 * @returns URL absoluta completa
 */
export function createAbsoluteUrl(path: string, request?: Request | NextRequest | null): string {
  const baseUrl = getBaseUrl(request);
  // Remove barra dupla se path já começa com /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}