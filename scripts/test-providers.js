#!/usr/bin/env node

/**
 * Script para testar alternância entre providers de IA
 * Testa: local (Ollama), vertex (Google Cloud) e gateway padrão (Vercel)
 */

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

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
      GOOGLE_CLOUD_API_KEY:
        process.env.GOOGLE_CLOUD_API_KEY || 'your-vertex-api-key',
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

async function testProvider(providerKey) {
  const provider = PROVIDERS[providerKey];
  console.log(`\n🔄 Testando ${provider.name}`);
  console.log(`📝 ${provider.description}`);

  return new Promise((resolve, reject) => {
    const env = { ...process.env, ...provider.env };
    const testProcess = spawn(
      'node',
      [
        '-e',
        `
      console.log('Testing ${provider.name}...');
      process.env = ${JSON.stringify(env)};
      console.log('AI_GATEWAY_API_KEY:', process.env.AI_GATEWAY_API_KEY);
      console.log('GOOGLE_CLOUD_API_KEY:', process.env.GOOGLE_CLOUD_API_KEY ? 'Set' : 'Not set');

      // Test basic import
      try {
        const { myProvider } = require('./lib/ai/providers.ts');
        console.log('✅ Provider import successful');
      } catch (error) {
        console.log('❌ Provider import failed:', error.message);
      }
    `,
      ],
      {
        cwd: process.cwd(),
        env,
        stdio: 'inherit',
      },
    );

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${provider.name} test completed successfully`);
        resolve();
      } else {
        console.log(`❌ ${provider.name} test failed with code ${code}`);
        resolve(); // Don't reject, continue testing other providers
      }
    });

    testProcess.on('error', (error) => {
      console.log(`❌ ${provider.name} test error:`, error.message);
      resolve(); // Don't reject, continue testing other providers
    });
  });
}

async function runProviderTests() {
  console.log('🚀 Iniciando testes de alternância de providers\n');

  for (const providerKey of Object.keys(PROVIDERS)) {
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

module.exports = { runProviderTests, PROVIDERS };
