import { Metadata } from 'next';
import { appConfig } from '@/lib/config/app-config';

// Revalidar a cada 1 hora (ISR)
export const revalidate = 3600;

// Metadata para SEO
export const metadata: Metadata = {
  title: 'Sobre - AI Chatbot',
  description: 'Conheça nosso sistema de IA com Claude integrado',
};

// Função para buscar dados (pode ser de API ou banco)
async function getStats() {
  try {
    // Em produção, isso seria uma chamada ao banco
    // Por enquanto, retorna dados mock
    return {
      users: 1000,
      conversations: 5000,
      artifacts: 250,
      satisfaction: 98,
    };
  } catch (error) {
    console.error('Erro ao buscar stats:', error);
    return null;
  }
}

export default async function AboutPage() {
  const stats = await getStats();
  const config = appConfig.getConfig();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {config.app.name}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Plataforma de IA conversacional com Claude integrado
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Versão {config.app.version}
          </p>
        </div>
        
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <StatCard
              title="Usuários Ativos"
              value={stats.users.toLocaleString('pt-BR')}
              icon="👥"
            />
            <StatCard
              title="Conversas"
              value={stats.conversations.toLocaleString('pt-BR')}
              icon="💬"
            />
            <StatCard
              title="Documentos"
              value={stats.artifacts.toLocaleString('pt-BR')}
              icon="📄"
            />
            <StatCard
              title="Satisfação"
              value={`${stats.satisfaction}%`}
              icon="⭐"
            />
          </div>
        )}
        
        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
            Recursos Principais
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              title="Sistema de Artifacts"
              description="Editor de documentos integrado com IA para criação e edição assistida"
              icon="📝"
              enabled={config.features.enableArtifacts}
            />
            <FeatureCard
              title="Múltiplos Provedores"
              description="Suporte para diferentes implementações de Claude com fallback automático"
              icon="🔄"
              enabled={true}
            />
            <FeatureCard
              title="MCP Integration"
              description="Model Context Protocol para funcionalidades avançadas"
              icon="🔌"
              enabled={config.features.enableMCP}
            />
            <FeatureCard
              title="Guest Users"
              description="Acesso sem cadastro para experimentar a plataforma"
              icon="👤"
              enabled={config.features.enableGuestUsers}
            />
            <FeatureCard
              title="Rate Limiting"
              description="Proteção contra abuso com limites configuráveis"
              icon="🛡️"
              enabled={config.features.enableRateLimiting}
            />
            <FeatureCard
              title="Cache Otimizado"
              description="ISR e edge caching para máxima performance"
              icon="⚡"
              enabled={config.features.enableCache}
            />
          </div>
        </div>
        
        {/* Tech Stack */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
            Stack Tecnológica
          </h2>
          
          <div className="flex flex-wrap justify-center gap-4">
            <TechBadge name="Next.js 15" />
            <TechBadge name="React 19 RC" />
            <TechBadge name="TypeScript" />
            <TechBadge name="Tailwind CSS" />
            <TechBadge name="Claude SDK" />
            <TechBadge name="Drizzle ORM" />
            <TechBadge name="PostgreSQL" />
            <TechBadge name="Docker" />
            <TechBadge name="Caddy" />
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="mb-2">
            Esta página usa ISR (Incremental Static Regeneration)
          </p>
          <p className="text-sm">
            Próxima revalidação em {revalidate} segundos
          </p>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares
function StatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{title}</div>
    </div>
  );
}

function FeatureCard({ 
  title, 
  description, 
  icon, 
  enabled 
}: { 
  title: string; 
  description: string; 
  icon: string;
  enabled: boolean;
}) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${!enabled ? 'opacity-60' : ''}`}>
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">
        {description}
      </p>
      <div className={`mt-3 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
        enabled 
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      }`}>
        {enabled ? 'Ativo' : 'Inativo'}
      </div>
    </div>
  );
}

function TechBadge({ name }: { name: string }) {
  return (
    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
      {name}
    </span>
  );
}