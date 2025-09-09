#!/usr/bin/env node

/**
 * Script para testar configuração do Ollama
 * Verifica se os modelos necessários estão disponíveis e funcionais
 */

const { spawn } = require('node:child_process');

const REQUIRED_MODELS = [
  'qwen3:30b',
  'falcon3:latest',
  'llama3.2-vision:latest',
  'mistral:latest',
  'llava:latest'
];

async function checkOllamaService() {
  console.log('🔍 Verificando serviço Ollama...');

  return new Promise((resolve) => {
    const checkProcess = spawn('ollama', ['list'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    checkProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    checkProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Ollama está funcionando');
        resolve(output);
      } else {
        console.log('❌ Ollama não está respondendo');
        resolve(null);
      }
    });

    checkProcess.on('error', () => {
      console.log('❌ Ollama não está instalado ou não está no PATH');
      resolve(null);
    });
  });
}

async function testModel(modelName) {
  console.log(`🧪 Testando modelo: ${modelName}`);

  return new Promise((resolve) => {
    const testProcess = spawn('ollama', ['run', modelName, 'Hello, test message'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000 // 10 segundos timeout
    });

    let output = '';
    let errorOutput = '';

    testProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    testProcess.on('close', (code) => {
      if (code === 0 && output.trim()) {
        console.log(`✅ ${modelName} está funcional`);
        resolve(true);
      } else {
        console.log(`❌ ${modelName} falhou: ${errorOutput || 'Sem resposta'}`);
        resolve(false);
      }
    });

    testProcess.on('error', (error) => {
      console.log(`❌ Erro ao testar ${modelName}: ${error.message}`);
      resolve(false);
    });

    // Timeout após 10 segundos
    setTimeout(() => {
      testProcess.kill();
      console.log(`⏰ Timeout ao testar ${modelName}`);
      resolve(false);
    }, 10000);
  });
}

async function runOllamaTests() {
  console.log('🚀 Iniciando testes de configuração Ollama\n');

  // Verificar serviço
  const listOutput = await checkOllamaService();
  if (!listOutput) {
    console.log('\n❌ Configuração do Ollama falhou');
    return;
  }

  // Extrair modelos disponíveis
  const availableModels = listOutput
    .split('\n')
    .slice(1) // Pular header
    .map(line => line.split(/\s+/)[0])
    .filter(name => name && name !== 'NAME');

  console.log('\n📦 Modelos disponíveis:', availableModels);

  // Verificar modelos necessários
  const missingModels = REQUIRED_MODELS.filter(model => !availableModels.includes(model));

  if (missingModels.length > 0) {
    console.log('\n⚠️  Modelos faltando:', missingModels);
    console.log('💡 Para instalar: ollama pull <model-name>');
  } else {
    console.log('\n✅ Todos os modelos necessários estão instalados');
  }

  // Testar modelos funcionais
  console.log('\n🧪 Testando funcionalidade dos modelos...');
  const testResults = {};

  for (const model of REQUIRED_MODELS) {
    if (availableModels.includes(model)) {
      testResults[model] = await testModel(model);
    } else {
      testResults[model] = false;
      console.log(`⏭️  Pulando teste de ${model} (não instalado)`);
    }
  }

  // Resumo
  console.log('\n📊 Resumo dos testes:');
  const workingModels = Object.entries(testResults).filter(([_, working]) => working);
  const brokenModels = Object.entries(testResults).filter(([_, working]) => !working);

  console.log(`✅ Modelos funcionais: ${workingModels.length}/${REQUIRED_MODELS.length}`);
  workingModels.forEach(([model]) => console.log(`   - ${model}`));

  if (brokenModels.length > 0) {
    console.log(`❌ Modelos com problemas: ${brokenModels.length}`);
    brokenModels.forEach(([model]) => console.log(`   - ${model}`));
  }

  console.log('\n🎉 Testes do Ollama concluídos!');
  console.log('\n💡 Para usar Ollama no projeto:');
  console.log('   AI_GATEWAY_API_KEY=local pnpm run dev');
}

if (require.main === module) {
  runOllamaTests().catch(console.error);
}

module.exports = { runOllamaTests, REQUIRED_MODELS };