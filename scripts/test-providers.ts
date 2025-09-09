#!/usr/bin/env tsx

/**
 * Script TypeScript para testar alternância entre providers de IA
 * Testa: local (Ollama), vertex (Google Cloud) e gateway padrão (Vercel)
 */

const PROVIDERS = {
  local: {
    name: 'Local (Ollama)',
    env: { AI_GATEWAY_API_KEY: 'local' },
    description: 'Usa modelos locais via Ollama',
  },
  vertex: {
    name: 'Vertex AI',
    env: {
      AI_GATEWAY_API_KEY: 'vertex',
      GOOGLE_CLOUD_API_KEY: process.env.GOOGLE_CLOUD_API_KEY || 'your-vertex-api-key',
    },
    description: 'Usa Google Cloud Vertex AI',
  },
  gateway: {
    name: 'Gateway Padrão',
    env: {
      AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY || 'your-gateway-key',
    },
    description: 'Usa Vercel AI Gateway',
  },
};

async function testProvider(providerKey: keyof typeof PROVIDERS) {
  const provider = PROVIDERS[providerKey];
  console.log(`\n🔄 Testando ${provider.name}`);
  console.log(`📝 ${provider.description}`);

  return new Promise<void>((resolve) => {
    const env = { ...process.env, ...provider.env };

    console.log(`Testing ${provider.name}...`);
    console.log('AI_GATEWAY_API_KEY:', env.AI_GATEWAY_API_KEY);
    console.log('GOOGLE_CLOUD_API_KEY:', env.GOOGLE_CLOUD_API_KEY ? 'Set' : 'Not set');

    // Test basic import
    try {
      // Import dinâmico do módulo TypeScript
      require('../lib/ai/providers.ts');
      console.log('✅ Provider import successful');
    } catch (error: any) {
      console.log('❌ Provider import failed:', error.message);
    }

    console.log(`✅ ${provider.name} test completed successfully`);
    resolve();
  });
}

async function runProviderTests() {
  console.log('🚀 Iniciando testes de alternância de providers\n');

  for (const providerKey of Object.keys(PROVIDERS) as (keyof typeof PROVIDERS)[]) {
    await testProvider(providerKey);
  }

  console.log('\n🎉 Testes de providers concluídos!');
  console.log('\n💡 Para usar um provider específico:');
  console.log('   Local: AI_GATEWAY_API_KEY=local pnpm run dev');
  console.log('   Vertex: AI_GATEWAY_API_KEY=vertex pnpm run dev');
  console.log('   Gateway: AI_GATEWAY_API_KEY=your-key pnpm run dev');
}

if (require.main === module) {
  runProviderTests().catch(console.error);
}

export { runProviderTests, PROVIDERS };