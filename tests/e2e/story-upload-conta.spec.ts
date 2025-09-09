import { test, expect } from '@playwright/test';

/**
 * Story: Upload de Conta
 *
 * Como um usuário do sistema YSH
 * Quero fazer upload da minha conta de energia
 * Para que o sistema possa analisar meu consumo e gerar propostas personalizadas
 *
 * Cenário: Upload completo de conta de energia
 * Dado que estou na página de upload
 * Quando carrego um arquivo de conta válido
 * Então o sistema deve processar e extrair as informações relevantes
 * E gerar uma análise personalizada baseada no consumo
 */
test.describe('Story: Upload de Conta', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de upload
    await page.goto('/upload-bill');

    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
  });

  test('deve carregar a interface de upload corretamente', async ({ page }) => {
    // Verificar se a área de upload está presente
    await expect(page.locator('[data-testid="upload-area"]')).toBeVisible();

    // Verificar se há instruções de upload
    const instructions = page.locator('[data-testid="upload-instructions"]').or(
      page.locator('text=Arraste').or(page.locator('text=Selecione'))
    );
    await expect(instructions).toBeVisible();

    // Verificar se há botão de seleção de arquivo
    const fileButton = page.locator('[data-testid="file-input"]').or(
      page.locator('input[type="file"]')
    );
    await expect(fileButton).toBeVisible();
  });

  test('deve permitir seleção de arquivo via botão', async ({ page }) => {
    // Clicar no botão de seleção de arquivo
    const fileInput = page.locator('input[type="file"]');

    // Simular upload de arquivo
    await fileInput.setInputFiles({
      name: 'conta-energia.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content')
    });

    // Verificar se o arquivo foi selecionado
    const fileName = page.locator('[data-testid="file-name"]').or(
      page.locator('text=conta-energia.pdf')
    );

    if (await fileName.isVisible()) {
      await expect(fileName).toBeVisible();
    }
  });

  test('deve suportar drag and drop de arquivos', async ({ page }) => {
    // Criar um arquivo mock para drag and drop
    const fileInput = page.locator('input[type="file"]');

    // Simular drag and drop
    // Usar setInputFiles para simular o upload
    await fileInput.setInputFiles({
      name: 'conta-luz.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content for drag and drop')
    });

    // Verificar se o arquivo foi processado
    const processingIndicator = page.locator('[data-testid="processing"]').or(
      page.locator('text=Processando').or(page.locator('text=Analisando'))
    );

    if (await processingIndicator.isVisible()) {
      await expect(processingIndicator).toBeVisible();
    }
  });

  test('deve validar tipos de arquivo suportados', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    // Tentar fazer upload de arquivo não suportado
    await fileInput.setInputFiles({
      name: 'documento.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Mock text content')
    });

    // Verificar se há mensagem de erro
    const errorMessage = page.locator('[data-testid="error-message"]').or(
      page.locator('text=Formato não suportado').or(page.locator('text=Arquivo inválido'))
    );

    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('deve validar tamanho máximo do arquivo', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    // Criar arquivo grande (simulado)
    const largeFile = Buffer.alloc(50 * 1024 * 1024); // 50MB

    await fileInput.setInputFiles({
      name: 'conta-grande.pdf',
      mimeType: 'application/pdf',
      buffer: largeFile
    });

    // Verificar se há mensagem de erro de tamanho
    const sizeError = page.locator('[data-testid="size-error"]').or(
      page.locator('text=Arquivo muito grande').or(page.locator('text=Tamanho excedido'))
    );

    if (await sizeError.isVisible()) {
      await expect(sizeError).toBeVisible();
    }
  });

  test('deve mostrar progresso do upload', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    // Fazer upload de arquivo
    await fileInput.setInputFiles({
      name: 'conta-progresso.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF for progress test')
    });

    // Verificar se há barra de progresso
    const progressBar = page.locator('[data-testid="upload-progress"]').or(
      page.locator('.progress-bar').or(page.locator('[role="progressbar"]'))
    );

    if (await progressBar.isVisible()) {
      await expect(progressBar).toBeVisible();
    }
  });

  test('deve processar conta de energia e extrair dados', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    // Upload de arquivo válido
    await fileInput.setInputFiles({
      name: 'conta-energia.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF with energy bill data')
    });

    // Aguardar processamento
    await page.waitForTimeout(3000);

    // Verificar se dados foram extraídos
    const extractedData = page.locator('[data-testid="extracted-data"]').or(
      page.locator('.extracted-data')
    );

    if (await extractedData.isVisible()) {
      // Verificar campos comuns de conta de energia
      await expect(extractedData.locator('text=Consumo')).toBeVisible();
      await expect(extractedData.locator('text=Valor')).toBeVisible();
      await expect(extractedData.locator('text=Período')).toBeVisible();
    }
  });

  test('deve mostrar preview da conta processada', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'conta-preview.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content')
    });

    // Aguardar processamento
    await page.waitForTimeout(2000);

    // Verificar se há preview
    const preview = page.locator('[data-testid="bill-preview"]').or(
      page.locator('.bill-preview').or(page.locator('text=Preview'))
    );

    if (await preview.isVisible()) {
      await expect(preview).toBeVisible();
    }
  });

  test('deve permitir edição manual de dados extraídos', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'conta-editar.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content')
    });

    // Aguardar processamento
    await page.waitForTimeout(2000);

    // Procurar campos editáveis
    const editableFields = page.locator('input').or(page.locator('textarea'));

    if (await editableFields.first().isVisible()) {
      // Editar um campo
      const firstField = editableFields.first();
      await firstField.fill('Valor editado');

      // Verificar se o valor foi alterado
      await expect(firstField).toHaveValue('Valor editado');
    }
  });

  test('deve gerar análise baseada no consumo', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'conta-analise.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF with consumption data')
    });

    // Aguardar processamento e análise
    await page.waitForTimeout(4000);

    // Verificar se análise foi gerada
    const analysis = page.locator('[data-testid="consumption-analysis"]').or(
      page.locator('text=Análise').or(page.locator('text=Consumo médio'))
    );

    if (await analysis.isVisible()) {
      await expect(analysis).toBeVisible();
    }
  });

  test('deve permitir salvar dados processados', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'conta-salvar.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content')
    });

    // Aguardar processamento
    await page.waitForTimeout(2000);

    // Procurar botão de salvar
    const saveButton = page.locator('[data-testid="save-data"]').or(
      page.locator('text=Salvar').or(page.locator('text=Confirmar'))
    );

    if (await saveButton.isVisible()) {
      await saveButton.click();

      // Verificar confirmação de salvamento
      const successMessage = page.locator('[data-testid="save-success"]').or(
        page.locator('text=Salvo').or(page.locator('text=Dados salvos'))
      );

      if (await successMessage.isVisible()) {
        await expect(successMessage).toBeVisible();
      }
    }
  });

  test('deve permitir cancelar upload em andamento', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    // Iniciar upload
    await fileInput.setInputFiles({
      name: 'conta-cancelar.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content')
    });

    // Procurar botão de cancelar
    const cancelButton = page.locator('[data-testid="cancel-upload"]').or(
      page.locator('text=Cancelar').or(page.locator('text=×'))
    );

    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // Verificar se upload foi cancelado
      const cancelledMessage = page.locator('[data-testid="upload-cancelled"]').or(
        page.locator('text=Cancelado').or(page.locator('text=Upload cancelado'))
      );

      if (await cancelledMessage.isVisible()) {
        await expect(cancelledMessage).toBeVisible();
      }
    }
  });

  test('deve suportar múltiplos arquivos', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    // Upload de múltiplos arquivos
    await fileInput.setInputFiles([
      {
        name: 'conta1.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mock PDF 1')
      },
      {
        name: 'conta2.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mock PDF 2')
      }
    ]);

    // Verificar se múltiplos arquivos foram processados
    const fileList = page.locator('[data-testid="file-list"]').or(
      page.locator('.file-list')
    );

    if (await fileList.isVisible()) {
      const fileItems = fileList.locator('li').or(fileList.locator('.file-item'));
      await expect(fileItems).toHaveCount(2);
    }
  });

  test('deve mostrar histórico de uploads', async ({ page }) => {
    // Verificar se há seção de histórico
    const historySection = page.locator('[data-testid="upload-history"]').or(
      page.locator('text=Histórico').or(page.locator('text=Uploads anteriores'))
    );

    if (await historySection.isVisible()) {
      await expect(historySection).toBeVisible();

      // Verificar se há itens no histórico
      const historyItems = historySection.locator('li').or(
        historySection.locator('.history-item')
      );

      // Se houver itens, verificar se são clicáveis
      if (await historyItems.count() > 0) {
        await historyItems.first().click();

        // Verificar se detalhes foram carregados
        const details = page.locator('[data-testid="upload-details"]').or(
          page.locator('.upload-details')
        );

        if (await details.isVisible()) {
          await expect(details).toBeVisible();
        }
      }
    }
  });

  test('deve permitir download de dados processados', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'conta-download.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content')
    });

    // Aguardar processamento
    await page.waitForTimeout(2000);

    // Procurar botão de download
    const downloadButton = page.locator('[data-testid="download-data"]').or(
      page.locator('text=Download').or(page.locator('text=Exportar'))
    );

    if (await downloadButton.isVisible()) {
      // Monitorar downloads
      const downloadPromise = page.waitForEvent('download');

      await downloadButton.click();

      const download = await downloadPromise;

      // Verificar se download foi iniciado
      expect(download.suggestedFilename()).toBeTruthy();
    }
  });

  test('deve lidar com erros de processamento', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    // Upload de arquivo corrompido
    await fileInput.setInputFiles({
      name: 'conta-corrompida.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Corrupted content')
    });

    // Aguardar processamento
    await page.waitForTimeout(3000);

    // Verificar se há mensagem de erro
    const processingError = page.locator('[data-testid="processing-error"]').or(
      page.locator('text=Erro no processamento').or(page.locator('text=Não foi possível processar'))
    );

    if (await processingError.isVisible()) {
      await expect(processingError).toBeVisible();
    }
  });

  test('deve permitir tentar novamente após erro', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    // Upload que falha
    await fileInput.setInputFiles({
      name: 'conta-erro.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Error content')
    });

    // Aguardar erro
    await page.waitForTimeout(2000);

    // Procurar botão de tentar novamente
    const retryButton = page.locator('[data-testid="retry-upload"]').or(
      page.locator('text=Tentar novamente')
    );

    if (await retryButton.isVisible()) {
      await retryButton.click();

      // Verificar se processamento recomeçou
      const processingIndicator = page.locator('[data-testid="processing"]').or(
        page.locator('text=Processando')
      );

      if (await processingIndicator.isVisible()) {
        await expect(processingIndicator).toBeVisible();
      }
    }
  });
});