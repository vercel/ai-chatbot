/**
 * Configuração centralizada da aplicação
 * Resolve o problema de URLs hardcoded e configurações espalhadas
 */

import { z } from 'zod';

// Schema de validação para as configurações
const appConfigSchema = z.object({
  app: z.object({
    name: z.string().default('AI Chatbot'),
    version: z.string().default('3.1.0'),
    environment: z.enum(['development', 'production', 'test']).default('development'),
  }),
  
  urls: z.object({
    base: z.string().url().optional(),
    api: z.string().url().optional(),
    websocket: z.string().url().optional(),
  }),
  
  ports: z.object({
    frontend: z.number().default(3000),
    backend: z.number().default(8001),
    websocket: z.number().default(8002),
  }),
  
  features: z.object({
    enableMCP: z.boolean().default(true),
    enableArtifacts: z.boolean().default(true),
    enableGuestUsers: z.boolean().default(true),
    enableRateLimiting: z.boolean().default(false),
    enableCache: z.boolean().default(true),
  }),
  
  security: z.object({
    rateLimit: z.object({
      windowMs: z.number().default(15 * 60 * 1000), // 15 minutos
      maxRequests: z.number().default(100),
    }),
    cors: z.object({
      origins: z.array(z.string()).default(['http://localhost:3000']),
      credentials: z.boolean().default(true),
    }),
  }),
  
  ai: z.object({
    defaultProvider: z.enum(['claude-sdk', 'claude-chat', 'claude-main']).default('claude-sdk'),
    timeout: z.number().default(30000), // 30 segundos
    maxTokens: z.number().default(4096),
  }),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

/**
 * Obtém a URL base da aplicação de forma inteligente
 */
function getBaseUrl(): string {
  // Se estiver no cliente
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Variáveis de ambiente em ordem de prioridade
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  
  // Detectar porta do Next.js
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
}

/**
 * Obtém a URL da API de forma inteligente
 */
function getApiUrl(): string {
  // Variáveis de ambiente específicas da API
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (process.env.API_URL) {
    return process.env.API_URL;
  }
  
  // Usar a URL base + /api
  return `${getBaseUrl()}/api`;
}

/**
 * Obtém a URL do WebSocket
 */
function getWebSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  
  // Converter HTTP para WS
  const baseUrl = getBaseUrl();
  return baseUrl.replace(/^http/, 'ws');
}

/**
 * Configuração singleton da aplicação
 */
class AppConfiguration {
  private static instance: AppConfiguration;
  private config: AppConfig;
  
  private constructor() {
    this.config = this.loadConfig();
  }
  
  public static getInstance(): AppConfiguration {
    if (!AppConfiguration.instance) {
      AppConfiguration.instance = new AppConfiguration();
    }
    return AppConfiguration.instance;
  }
  
  private loadConfig(): AppConfig {
    const isDev = process.env.NODE_ENV === 'development';
    const isProd = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';
    
    const rawConfig = {
      app: {
        name: process.env.NEXT_PUBLIC_APP_NAME || 'AI Chatbot',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '3.1.0',
        environment: isTest ? 'test' : isProd ? 'production' : 'development',
      },
      
      urls: {
        base: getBaseUrl(),
        api: getApiUrl(),
        websocket: getWebSocketUrl(),
      },
      
      ports: {
        frontend: parseInt(process.env.PORT || '3000'),
        backend: parseInt(process.env.BACKEND_PORT || '8001'),
        websocket: parseInt(process.env.WS_PORT || '8002'),
      },
      
      features: {
        enableMCP: process.env.NEXT_PUBLIC_ENABLE_MCP !== 'false',
        enableArtifacts: process.env.NEXT_PUBLIC_ENABLE_ARTIFACTS !== 'false',
        enableGuestUsers: process.env.NEXT_PUBLIC_ENABLE_GUESTS !== 'false',
        enableRateLimiting: process.env.NEXT_PUBLIC_ENABLE_RATE_LIMIT === 'true',
        enableCache: process.env.NEXT_PUBLIC_ENABLE_CACHE !== 'false',
      },
      
      security: {
        rateLimit: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100'),
        },
        cors: {
          origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
          credentials: process.env.CORS_CREDENTIALS !== 'false',
        },
      },
      
      ai: {
        defaultProvider: (process.env.NEXT_PUBLIC_AI_PROVIDER || 'claude-sdk') as any,
        timeout: parseInt(process.env.AI_TIMEOUT || '30000'),
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096'),
      },
    };
    
    // Validar configuração
    try {
      return appConfigSchema.parse(rawConfig);
    } catch (error) {
      console.error('Erro na validação da configuração:', error);
      // Retornar configuração padrão em caso de erro
      return appConfigSchema.parse({});
    }
  }
  
  public getConfig(): AppConfig {
    return this.config;
  }
  
  public get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }
  
  public getUrl(type: 'base' | 'api' | 'websocket' = 'base'): string {
    return this.config.urls[type] || this.config.urls.base || '';
  }
  
  public isProduction(): boolean {
    return this.config.app.environment === 'production';
  }
  
  public isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }
  
  public isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature] === true;
  }
}

// Exportar instância singleton
export const appConfig = AppConfiguration.getInstance();

// Exportar funções utilitárias
export const getConfig = () => appConfig.getConfig();
export const getUrl = (type?: 'base' | 'api' | 'websocket') => appConfig.getUrl(type);
export const isProduction = () => appConfig.isProduction();
export const isDevelopment = () => appConfig.isDevelopment();
export const isFeatureEnabled = (feature: keyof AppConfig['features']) => appConfig.isFeatureEnabled(feature);

// Exportar configuração para uso direto
export default appConfig;