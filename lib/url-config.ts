import { NextRequest } from 'next/server';

/**
 * Configuração híbrida de URLs para suportar múltiplos subdomínios
 * Combina detecção automática (Opção B) com fallback para variáveis de ambiente (Opção A)
 */

// Lista de hosts permitidos para prevenir host header injection
const ALLOWED_HOSTS = [
  'melhorias-suthub.agentesintegrados.com',
  'suthub.agentesintegrados.com',
  'localhost:3033',
  'localhost:3000'
];

/**
 * Obtém a URL base da aplicação com detecção inteligente
 * @param request - Request object do Next.js (opcional)
 * @returns URL base absoluta
 */
export function getBaseUrl(request?: Request | NextRequest): string {
  // 1. Em produção: usa detecção automática baseada no request
  if (request) {
    const headers = request.headers;
    const host = headers.get('host') || headers.get('x-forwarded-host');
    
    // Validação de segurança - só aceita domínios permitidos
    if (host && ALLOWED_HOSTS.some(allowed => host.includes(allowed))) {
      const protocol = headers.get('x-forwarded-proto') || 
                      (host.includes('localhost') ? 'http' : 'https');
      return `${protocol}://${host}`;
    }
  }
  
  // 2. Fallback: usa variável de ambiente
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // 3. Default para desenvolvimento
  return 'http://localhost:3033';
}

/**
 * Obtém a URL específica para NextAuth
 * NextAuth precisa de URL absoluta para callbacks
 * @param request - Request object (opcional)
 * @returns URL absoluta para NextAuth
 */
export function getAuthUrl(request?: Request | NextRequest): string {
  // Prioriza variáveis de ambiente específicas do NextAuth
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL;
  }
  
  // Fallback para detecção automática
  return getBaseUrl(request);
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