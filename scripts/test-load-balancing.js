#!/usr/bin/env node

/**
 * Script para testar o sistema completo de load balancing
 * Testa: seleção de provider, métricas de performance e balanceamento
 */

const { spawn } = require('node:child_process');

async function testEndpoint(url, description) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.success) {
      console.log(`✅ ${description}: OK`);
      return data;
    }
      console.log(`❌ ${description}: ${data.error}`);
      return null;
  } catch (error) {
    console.log(`❌ ${description}: ${error.message}`);
    return null;
  }
}

async function testLoadBalancing() {
  console.log('🚀 Iniciando testes do sistema de load balancing\n');

  // Teste 1: Seleção de provider
  console.log('📊 Teste 1: Seleção de provider otimizada');
  const selectionData = await testEndpoint(
    'http://localhost:3000/api/load-balancing?modelType=chat',
    'Seleção de provider'
  );

  if (selectionData) {
    console.log(`   Escolhido: ${selectionData.data.provider} (${selectionData.data.model})`);
    console.log(`   Pontuação: ${(selectionData.data.score * 100).toFixed(1)}%`);
  }

  // Teste 2: Métricas de performance
  console.log('\n� Teste 2: Métricas de performance');
  const metricsData = await testEndpoint(
    'http://localhost:3000/api/monitoring/performance?hours=24',
    'Métricas de performance'
  );

  if (metricsData) {
    const providerStats = metricsData.data.providerStats;
    console.log(`   Providers monitorados: ${Object.keys(providerStats).length}`);
  }

  // Teste 3: Balanceamento com preferências
  console.log('\n⚖️  Teste 3: Balanceamento com preferências');
  await testEndpoint(
    'http://localhost:3000/api/load-balancing?modelType=vision&preferredProvider=ollama&maxLatency=3000',
    'Balanceamento com preferências'
  );

  console.log('\n🎉 Testes do load balancing concluídos!');
}

async function checkServerRunning() {
  try {
    const response = await fetch('http://localhost:3000/api/load-balancing?modelType=chat');
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔍 Verificando se o servidor está rodando...');

  if (!(await checkServerRunning())) {
    console.log('❌ Servidor não está rodando em http://localhost:3000');
    console.log('💡 Execute: pnpm run dev');
    process.exit(1);
  }

  await testLoadBalancing();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testLoadBalancing };