#!/usr/bin/env tsx

/**
 * Script TypeScript para testar o sistema completo de load balancing
 * Testa: seleção de provider, métricas de performance e balanceamento
 */

async function testEndpoint(url: string, description: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Test-Script/1.0',
        'Accept': 'application/json'
      }
    });

    if (response.status === 426) {
      console.log(`✅ ${description}: API respondendo (Upgrade Required - ${response.status})`);
      return { success: true, data: { status: response.status, message: 'Upgrade Required' } };
    }

    if (!response.ok) {
      console.log(`⚠️  ${description}: HTTP ${response.status} - ${response.statusText}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.log(`⚠️  ${description}: Resposta não-JSON (${contentType})`);
      return { success: false, error: 'Non-JSON response' };
    }

    const data = await response.json();

    if (data.success) {
      console.log(`✅ ${description}: OK`);
      return data;
    }
      console.log(`❌ ${description}: ${data.error}`);
      return null;
  } catch (error: any) {
    console.log(`❌ ${description}: ${error.message}`);
    return null;
  }
}

async function testLoadBalancing() {
  console.log('🚀 Iniciando testes do sistema de load balancing\n');

  // Teste 1: Seleção de provider
  console.log('📊 Teste 1: Seleção de provider otimizada');
  const selectionData = await testEndpoint(
    'http://localhost:3001/api/load-balancing?modelType=chat',
    'Seleção de provider'
  );

  if (selectionData?.data) {
    console.log(`   Escolhido: ${selectionData.data.provider} (${selectionData.data.model})`);
    console.log(`   Pontuação: ${(selectionData.data.score * 100).toFixed(1)}%`);
  }

  // Teste 2: Métricas de performance
  console.log('\n📈 Teste 2: Métricas de performance');
  const metricsData = await testEndpoint(
    'http://localhost:3001/api/monitoring/performance?hours=24',
    'Métricas de performance'
  );

  if (metricsData?.data?.providerStats) {
    const providerStats = metricsData.data.providerStats;
    console.log(`   Providers monitorados: ${Object.keys(providerStats).length}`);
  }

  // Teste 3: Balanceamento com preferências
  console.log('\n⚖️  Teste 3: Balanceamento com preferências');
  await testEndpoint(
    'http://localhost:3001/api/load-balancing?modelType=vision&preferredProvider=ollama&maxLatency=3000',
    'Balanceamento com preferências'
  );

  console.log('\n🎉 Testes do load balancing concluídos!');
}

async function checkServerRunning(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch('http://localhost:3001/api/load-balancing?modelType=chat', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Test-Script/1.0'
      }
    });

    clearTimeout(timeoutId);
    // Consider any response as success (even 426 Upgrade Required)
    return response.status >= 200 && response.status < 500;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('⏱️  Timeout ao verificar servidor');
      return false;
    }
    return false;
  }
}

async function main() {
  console.log('🔍 Verificando se o servidor está rodando...');

  if (!(await checkServerRunning())) {
    console.log('❌ Servidor não está rodando em http://localhost:3001');
    console.log('💡 Execute: PORT=3001 pnpm run dev');
    process.exit(1);
  }

  await testLoadBalancing();
}

if (require.main === module) {
  main().catch(console.error);
}

export { testLoadBalancing };