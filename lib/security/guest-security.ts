/**
 * Sistema de segurança para guest users
 * Resolve o problema de DUMMY_PASSWORD e adiciona validações extras
 */

import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';
import { appConfig } from '@/lib/config/app-config';

// Schema para validar dados de guest
const guestUserSchema = z.object({
  email: z.string().email().refine(
    (email) => email.includes('guest-') && email.endsWith('@localhost'),
    'Email de guest inválido'
  ),
  name: z.string().min(1).max(100),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  sessionId: z.string().optional(),
});

export type GuestUser = z.infer<typeof guestUserSchema>;

/**
 * Gera um token seguro para guest users
 * Melhor que usar DUMMY_PASSWORD
 */
export function generateGuestToken(identifier: string): string {
  const salt = process.env.AUTH_SECRET || 'default-salt';
  const timestamp = Date.now().toString();
  const random = randomBytes(16).toString('hex');
  
  const hash = createHash('sha256')
    .update(`${identifier}-${salt}-${timestamp}-${random}`)
    .digest('hex');
    
  return hash.substring(0, 32);
}

/**
 * Valida se um token de guest é válido
 */
export function validateGuestToken(token: string): boolean {
  // Token deve ter 32 caracteres hexadecimais
  return /^[a-f0-9]{32}$/.test(token);
}

/**
 * Gera um email único para guest
 */
export function generateGuestEmail(): string {
  const timestamp = Date.now();
  const random = randomBytes(4).toString('hex');
  return `guest-${timestamp}-${random}@localhost`;
}

/**
 * Valida se um email é de guest
 */
export function isGuestEmail(email: string): boolean {
  return /^guest-\d+-[a-f0-9]+@localhost$/.test(email);
}

/**
 * Cria dados seguros para um guest user
 */
export function createSecureGuestUser(
  request: Request
): GuestUser & { token: string } {
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const sessionId = randomBytes(16).toString('hex');
  
  const email = generateGuestEmail();
  const name = `Guest User ${Date.now().toString(36).toUpperCase()}`;
  const token = generateGuestToken(`${email}-${ipAddress}-${userAgent}`);
  
  const guestData = {
    email,
    name,
    ipAddress,
    userAgent,
    sessionId,
    token,
  };
  
  // Validar dados antes de retornar
  const validated = guestUserSchema.parse(guestData);
  
  return { ...validated, token };
}

/**
 * Limitações para guest users
 */
export const guestLimitations = {
  maxSessionDuration: 24 * 60 * 60 * 1000, // 24 horas
  maxArtifacts: 5,
  maxAiRequests: 50,
  maxStorageSize: 10 * 1024 * 1024, // 10MB
  maxFileUploads: 10,
  allowedFeatures: [
    'chat',
    'artifacts',
    'basic-ai',
  ],
  disallowedFeatures: [
    'premium-models',
    'export',
    'api-access',
    'collaboration',
    'cloud-sync',
  ],
};

/**
 * Verifica se guest pode usar uma feature
 */
export function canGuestUseFeature(feature: string): boolean {
  if (!appConfig.isFeatureEnabled('enableGuestUsers')) {
    return false;
  }
  
  if (guestLimitations.disallowedFeatures.includes(feature)) {
    return false;
  }
  
  return guestLimitations.allowedFeatures.includes(feature) || 
         guestLimitations.allowedFeatures.includes('*');
}

/**
 * Verifica limites de guest
 */
export async function checkGuestLimits(
  guestId: string,
  limitType: keyof typeof guestLimitations
): Promise<{ allowed: boolean; reason?: string }> {
  // Aqui você verificaria no banco de dados ou cache
  // Por enquanto, retorna sempre permitido
  
  switch (limitType) {
    case 'maxArtifacts':
      // Verificar quantidade de artifacts do guest
      return { allowed: true };
      
    case 'maxAiRequests':
      // Verificar quantidade de requests AI nas últimas 24h
      return { allowed: true };
      
    case 'maxStorageSize':
      // Verificar tamanho total dos arquivos do guest
      return { allowed: true };
      
    default:
      return { allowed: true };
  }
}

/**
 * Sanitiza dados de guest antes de salvar
 */
export function sanitizeGuestData(data: any): any {
  // Remove campos sensíveis
  const { password, token, ipAddress, ...safe } = data;
  
  // Adiciona flag de guest
  return {
    ...safe,
    isGuest: true,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + guestLimitations.maxSessionDuration).toISOString(),
  };
}

/**
 * Middleware para validar guest requests
 */
export async function validateGuestRequest(
  request: Request,
  guestId: string
): Promise<{ valid: boolean; error?: string }> {
  // Verificar se guest users estão habilitados
  if (!appConfig.isFeatureEnabled('enableGuestUsers')) {
    return { 
      valid: false, 
      error: 'Guest access is currently disabled' 
    };
  }
  
  // Verificar rate limiting específico para guests
  const path = new URL(request.url).pathname;
  
  if (path.startsWith('/api/ai') || path.startsWith('/api/claude')) {
    const limit = await checkGuestLimits(guestId, 'maxAiRequests');
    if (!limit.allowed) {
      return { 
        valid: false, 
        error: limit.reason || 'AI request limit exceeded for guest users' 
      };
    }
  }
  
  if (path.includes('/artifacts')) {
    const limit = await checkGuestLimits(guestId, 'maxArtifacts');
    if (!limit.allowed) {
      return { 
        valid: false, 
        error: limit.reason || 'Artifact limit exceeded for guest users' 
      };
    }
  }
  
  return { valid: true };
}

/**
 * Limpa sessões de guest expiradas
 */
export async function cleanupExpiredGuestSessions(): Promise<number> {
  // Aqui você limparia do banco de dados
  // Por enquanto, retorna 0
  
  console.log('Limpando sessões de guest expiradas...');
  
  // Em produção:
  // const deleted = await db.guestSessions.deleteMany({
  //   where: {
  //     expiresAt: { lt: new Date() }
  //   }
  // });
  
  return 0;
}

// Agendar limpeza periódica (a cada hora)
if (typeof window === 'undefined') {
  setInterval(() => {
    cleanupExpiredGuestSessions().catch(console.error);
  }, 60 * 60 * 1000);
}