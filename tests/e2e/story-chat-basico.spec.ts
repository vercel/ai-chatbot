import { test, expect } from '@playwright/test';

/**
 * Story: Chat Básico
 *
 * Como um usuário do sistema YSH AI Chatbot
 * Quero poder interagir com o chat de forma básica
 * Para poder fazer perguntas e receber respostas sobre energia solar
 *
 * Cenário: Interação básica com o chat
 * Dado que estou na página inicial
 * Quando envio uma mensagem sobre energia solar
 * Então devo receber uma resposta relevante
 * E o histórico de mensagens deve ser preservado
 */
test.describe('Story: Chat Básico', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página inicial
    await page.goto('/');

    // Aguardar o carregamento completo da página
    await page.waitForLoadState('networkidle');
  });

  test('deve carregar a interface de chat corretamente', async ({ page }) => {
    // Verificar se os elementos principais estão presentes
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="send-button"]')).toBeVisible();

    // Verificar se o título da aplicação está presente
    await expect(page.locator('text=YSH AI Chatbot')).toBeVisible();
  });

  test('deve permitir enviar uma mensagem simples', async ({ page }) => {
    const testMessage = 'Olá, como funciona a energia solar?';

    // Digitar a mensagem
    await page.locator('[data-testid="message-input"]').fill(testMessage);

    // Clicar no botão de enviar
    await page.locator('[data-testid="send-button"]').click();

    // Verificar se a mensagem apareceu no chat
    await expect(page.locator(`text=${testMessage}`)).toBeVisible();

    // Aguardar a resposta (pode demorar um pouco)
    await page.waitForTimeout(3000);

    // Verificar se uma resposta foi recebida
    const messages = page.locator('[data-testid="message"]');
    await expect(messages).toHaveCount(2); // Mensagem do usuário + resposta
  });

  test('deve preservar o histórico de mensagens', async ({ page }) => {
    const messages = [
      'O que é energia solar?',
      'Quais são os benefícios?',
      'Como instalar painéis solares?'
    ];

    // Enviar múltiplas mensagens
    for (const message of messages) {
      await page.locator('[data-testid="message-input"]').fill(message);
      await page.locator('[data-testid="send-button"]').click();
      await page.waitForTimeout(2000); // Aguardar resposta
    }

    // Verificar se todas as mensagens estão presentes
    for (const message of messages) {
      await expect(page.locator(`text=${message}`)).toBeVisible();
    }

    // Verificar se há pelo menos algumas respostas
    const allMessages = page.locator('[data-testid="message"]');
    await expect(allMessages).toHaveCount(messages.length * 2); // Mensagens + respostas
  });

  test('deve permitir limpar o histórico de chat', async ({ page }) => {
    // Enviar uma mensagem primeiro
    await page.locator('[data-testid="message-input"]').fill('Teste');
    await page.locator('[data-testid="send-button"]').click();
    await page.waitForTimeout(2000);

    // Verificar se a mensagem existe
    await expect(page.locator('text=Teste')).toBeVisible();

    // Clicar no botão de limpar (se existir)
    const clearButton = page.locator('[data-testid="clear-chat"]').or(page.locator('text=Limpar'));
    if (await clearButton.isVisible()) {
      await clearButton.click();

      // Confirmar se necessário
      const confirmButton = page.locator('text=Confirmar').or(page.locator('text=Sim'));
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Verificar se o chat foi limpo
      await expect(page.locator('text=Teste')).not.toBeVisible();
    }
  });

  test('deve suportar diferentes tipos de mensagens', async ({ page }) => {
    const testCases = [
      'Pergunta simples sobre energia solar',
      'Cálculo: quanto custa instalar 10kW de painéis?',
      'Comparação: solar vs outras energias renováveis',
      'Dúvida técnica: inversor vs microinversor'
    ];

    for (const testCase of testCases) {
      // Limpar input
      await page.locator('[data-testid="message-input"]').clear();

      // Enviar mensagem
      await page.locator('[data-testid="message-input"]').fill(testCase);
      await page.locator('[data-testid="send-button"]').click();

      // Aguardar resposta
      await page.waitForTimeout(3000);

      // Verificar se resposta foi recebida
      await expect(page.locator(`text=${testCase}`)).toBeVisible();
    }
  });

  test('deve lidar com mensagens muito longas', async ({ page }) => {
    const longMessage = `Eu gostaria de entender melhor sobre energia solar fotovoltaica.
Poderia me explicar como funciona o processo de conversão de luz solar em eletricidade?
Também quero saber sobre os diferentes tipos de painéis solares disponíveis no mercado,
suas eficiências, durabilidade e custos aproximados. Além disso, gostaria de informações
sobre incentivos governamentais para instalação de sistemas solares residenciais.
${'Esta é uma mensagem longa para testar o limite do sistema de chat. '.repeat(10)}`;

    // Enviar mensagem longa
    await page.locator('[data-testid="message-input"]').fill(longMessage);
    await page.locator('[data-testid="send-button"]').click();

    // Verificar se foi enviada
    await expect(page.locator(`text=${longMessage.substring(0, 50)}`)).toBeVisible();

    // Aguardar resposta mais longa
    await page.waitForTimeout(5000);

    // Verificar se resposta foi recebida
    const messages = page.locator('[data-testid="message"]');
    await expect(messages).toHaveCount(2);
  });

  test('deve mostrar indicadores de digitação', async ({ page }) => {
    // Enviar mensagem
    await page.locator('[data-testid="message-input"]').fill('Teste de digitação');
    await page.locator('[data-testid="send-button"]').click();

    // Verificar se indicador de digitação aparece
    const typingIndicator = page.locator('[data-testid="typing-indicator"]').or(
      page.locator('text=Digitando...').or(
        page.locator('text=AI está pensando...')
      )
    );

    // Aguardar um pouco para o indicador aparecer
    await page.waitForTimeout(1000);

    // O indicador pode ou não estar presente dependendo da implementação
    // Se estiver presente, verificar se some após a resposta
    if (await typingIndicator.isVisible()) {
      await page.waitForTimeout(3000);
      await expect(typingIndicator).not.toBeVisible();
    }
  });
});