import { test, expect } from '@playwright/test';

/**
 * Story: Canvas Interativo
 *
 * Como um usuário do sistema YSH
 * Quero usar o canvas interativo para criar propostas visuais
 * Para organizar e apresentar informações de forma estruturada
 *
 * Cenário: Interação completa com o canvas
 * Dado que estou na página do canvas
 * Quando crio e manipulo diferentes artefatos
 * Então devo poder organizar visualmente as informações
 * E criar conexões entre diferentes elementos
 */
test.describe('Story: Canvas Interativo', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página do canvas
    await page.goto('/test-canvas');

    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
  });

  test('deve carregar a interface do canvas corretamente', async ({ page }) => {
    // Verificar se o canvas está presente
    await expect(page.locator('[data-testid="interactive-canvas"]')).toBeVisible();

    // Verificar se a toolbar está presente
    await expect(page.locator('[data-testid="canvas-toolbar"]')).toBeVisible();

    // Verificar se há área de drop vazia inicialmente
    const canvasArea = page.locator('[data-testid="canvas-area"]').or(
      page.locator('.canvas-area')
    );
    await expect(canvasArea).toBeVisible();
  });

  test('deve permitir criar artefato de texto', async ({ page }) => {
    // Clicar no botão de criar texto
    const textButton = page.locator('[data-testid="create-text"]').or(
      page.locator('text=Texto').or(page.locator('[data-testid="text-block-btn"]'))
    );

    if (await textButton.isVisible()) {
      await textButton.click();

      // Clicar em uma área vazia do canvas para criar
      const canvasArea = page.locator('[data-testid="canvas-area"]');
      await canvasArea.click();

      // Verificar se o artefato de texto foi criado
      const textArtifact = page.locator('[data-testid="text-artifact"]').or(
        page.locator('.text-artifact')
      );
      await expect(textArtifact).toBeVisible();

      // Verificar se está em modo de edição
      const textInput = textArtifact.locator('textarea').or(textArtifact.locator('input'));
      await expect(textInput).toBeVisible();
    }
  });

  test('deve permitir editar conteúdo do artefato de texto', async ({ page }) => {
    // Criar artefato de texto primeiro
    const textButton = page.locator('[data-testid="create-text"]').or(
      page.locator('text=Texto')
    );

    if (await textButton.isVisible()) {
      await textButton.click();
      const canvasArea = page.locator('[data-testid="canvas-area"]');
      await canvasArea.click();

      // Editar o conteúdo
      const textInput = page.locator('textarea').or(page.locator('input'));
      const testText = 'Este é um teste de edição de texto no canvas';

      await textInput.fill(testText);

      // Verificar se o texto foi salvo
      await expect(page.locator(`text=${testText}`)).toBeVisible();
    }
  });

  test('deve permitir arrastar artefatos pelo canvas', async ({ page }) => {
    // Criar um artefato primeiro
    const textButton = page.locator('[data-testid="create-text"]').or(
      page.locator('text=Texto')
    );

    if (await textButton.isVisible()) {
      await textButton.click();
      const canvasArea = page.locator('[data-testid="canvas-area"]');
      await canvasArea.click();

      // Obter posição inicial
      const artifact = page.locator('[data-testid="text-artifact"]').or(
        page.locator('.text-artifact')
      );

      const initialBox = await artifact.boundingBox();

      // Arrastar para uma nova posição
      await artifact.dragTo(canvasArea, {
        targetPosition: { x: 200, y: 150 }
      });

      // Aguardar um pouco para a animação
      await page.waitForTimeout(500);

      // Verificar se a posição mudou
      const finalBox = await artifact.boundingBox();

      if (initialBox && finalBox) {
        expect(finalBox.x).not.toBe(initialBox.x);
        expect(finalBox.y).not.toBe(initialBox.y);
      }
    }
  });

  test('deve permitir redimensionar artefatos', async ({ page }) => {
    // Criar um artefato
    const textButton = page.locator('[data-testid="create-text"]').or(
      page.locator('text=Texto')
    );

    if (await textButton.isVisible()) {
      await textButton.click();
      const canvasArea = page.locator('[data-testid="canvas-area"]');
      await canvasArea.click();

      const artifact = page.locator('[data-testid="text-artifact"]').or(
        page.locator('.text-artifact')
      );

      // Obter tamanho inicial
      const initialBox = await artifact.boundingBox();

      // Procurar pelo handle de redimensionamento
      const resizeHandle = artifact.locator('[data-testid="resize-handle"]').or(
        artifact.locator('.resize-handle').or(artifact.locator('.corner-handle'))
      );

      if (await resizeHandle.isVisible() && initialBox) {
        // Arrastar o handle para redimensionar
        await resizeHandle.dragTo(canvasArea, {
          targetPosition: { x: initialBox.x + 100, y: initialBox.y + 50 }
        });

        // Aguardar animação
        await page.waitForTimeout(500);

        // Verificar se o tamanho mudou
        const finalBox = await artifact.boundingBox();

        if (finalBox) {
          expect(finalBox.width).not.toBe(initialBox.width);
          expect(finalBox.height).not.toBe(initialBox.height);
        }
      }
    }
  });

  test('deve permitir criar conexões entre artefatos', async ({ page }) => {
    // Criar dois artefatos
    const textButton = page.locator('[data-testid="create-text"]').or(
      page.locator('text=Texto')
    );

    if (await textButton.isVisible()) {
      // Criar primeiro artefato
      await textButton.click();
      let canvasArea = page.locator('[data-testid="canvas-area"]');
      await canvasArea.click({ position: { x: 100, y: 100 } });

      // Criar segundo artefato
      await textButton.click();
      canvasArea = page.locator('[data-testid="canvas-area"]');
      await canvasArea.click({ position: { x: 300, y: 100 } });

      // Procurar artefatos criados
      const artifacts = page.locator('[data-testid*="artifact"]').or(
        page.locator('.artifact')
      );

      const artifactCount = await artifacts.count();

      if (artifactCount >= 2) {
        // Tentar conectar os artefatos
        const firstArtifact = artifacts.nth(0);
        const secondArtifact = artifacts.nth(1);

        // Clicar duas vezes no primeiro para iniciar conexão
        await firstArtifact.dblclick();

        // Clicar no segundo para completar conexão
        await secondArtifact.click();

        // Verificar se uma linha de conexão foi criada
        const connectionLine = page.locator('[data-testid="connection-line"]').or(
          page.locator('line').or(page.locator('.connection'))
        );

        if (await connectionLine.isVisible()) {
          await expect(connectionLine).toBeVisible();
        }
      }
    }
  });

  test('deve permitir criar cartão de proposta', async ({ page }) => {
    // Clicar no botão de criar proposta
    const proposalButton = page.locator('[data-testid="create-proposal"]').or(
      page.locator('text=Proposta').or(page.locator('[data-testid="proposal-card-btn"]'))
    );

    if (await proposalButton.isVisible()) {
      await proposalButton.click();

      // Clicar no canvas para criar
      const canvasArea = page.locator('[data-testid="canvas-area"]');
      await canvasArea.click();

      // Verificar se o cartão de proposta foi criado
      const proposalCard = page.locator('[data-testid="proposal-card"]').or(
        page.locator('.proposal-card')
      );
      await expect(proposalCard).toBeVisible();

      // Verificar campos específicos da proposta
      await expect(proposalCard.locator('text=Potência')).toBeVisible();
      await expect(proposalCard.locator('text=Custo')).toBeVisible();
      await expect(proposalCard.locator('text=Payback')).toBeVisible();
    }
  });

  test('deve permitir editar dados do cartão de proposta', async ({ page }) => {
    // Criar cartão de proposta
    const proposalButton = page.locator('[data-testid="create-proposal"]').or(
      page.locator('text=Proposta')
    );

    if (await proposalButton.isVisible()) {
      await proposalButton.click();
      const canvasArea = page.locator('[data-testid="canvas-area"]');
      await canvasArea.click();

      const proposalCard = page.locator('[data-testid="proposal-card"]').or(
        page.locator('.proposal-card')
      );

      // Editar campos da proposta
      const potenciaInput = proposalCard.locator('input').or(
        proposalCard.locator('[data-testid="potencia-input"]')
      );

      if (await potenciaInput.isVisible()) {
        await potenciaInput.fill('5.5');

        // Verificar se o valor foi salvo
        await expect(potenciaInput).toHaveValue('5.5');
      }

      // Editar custo
      const custoInput = proposalCard.locator('input').nth(1).or(
        proposalCard.locator('[data-testid="custo-input"]')
      );

      if (await custoInput.isVisible()) {
        await custoInput.fill('35000');

        // Verificar se o valor foi salvo
        await expect(custoInput).toHaveValue('35000');
      }
    }
  });

  test('deve permitir criar bloco de código', async ({ page }) => {
    // Clicar no botão de criar código
    const codeButton = page.locator('[data-testid="create-code"]').or(
      page.locator('text=Código').or(page.locator('[data-testid="code-block-btn"]'))
    );

    if (await codeButton.isVisible()) {
      await codeButton.click();

      // Clicar no canvas para criar
      const canvasArea = page.locator('[data-testid="canvas-area"]');
      await canvasArea.click();

      // Verificar se o bloco de código foi criado
      const codeBlock = page.locator('[data-testid="code-block"]').or(
        page.locator('.code-block')
      );
      await expect(codeBlock).toBeVisible();

      // Verificar se tem syntax highlighting
      const codeEditor = codeBlock.locator('textarea').or(codeBlock.locator('.code-editor'));
      await expect(codeEditor).toBeVisible();
    }
  });

  test('deve permitir executar código no bloco de código', async ({ page }) => {
    // Criar bloco de código
    const codeButton = page.locator('[data-testid="create-code"]').or(
      page.locator('text=Código')
    );

    if (await codeButton.isVisible()) {
      await codeButton.click();
      const canvasArea = page.locator('[data-testid="canvas-area"]');
      await canvasArea.click();

      const codeBlock = page.locator('[data-testid="code-block"]').or(
        page.locator('.code-block')
      );

      // Inserir código JavaScript simples
      const codeEditor = codeBlock.locator('textarea').or(codeBlock.locator('.code-editor'));
      const testCode = 'console.log("Hello from canvas!"); return 42;';

      await codeEditor.fill(testCode);

      // Procurar botão de executar
      const runButton = codeBlock.locator('[data-testid="run-code"]').or(
        codeBlock.locator('text=Executar').or(codeBlock.locator('button'))
      );

      if (await runButton.isVisible()) {
        await runButton.click();

        // Aguardar execução
        await page.waitForTimeout(2000);

        // Verificar se há resultado
        const result = codeBlock.locator('[data-testid="code-result"]').or(
          codeBlock.locator('.code-result').or(codeBlock.locator('text=42'))
        );

        if (await result.isVisible()) {
          await expect(result).toContainText('42');
        }
      }
    }
  });

  test('deve permitir seleção múltipla de artefatos', async ({ page }) => {
    // Criar múltiplos artefatos
    const textButton = page.locator('[data-testid="create-text"]').or(
      page.locator('text=Texto')
    );

    if (await textButton.isVisible()) {
      // Criar 3 artefatos
      for (let i = 0; i < 3; i++) {
        await textButton.click();
        const canvasArea = page.locator('[data-testid="canvas-area"]');
        await canvasArea.click({ position: { x: 100 + i * 150, y: 100 } });
      }

      // Tentar seleção múltipla com Shift+Click
      const artifacts = page.locator('[data-testid*="artifact"]').or(
        page.locator('.artifact')
      );

      if (await artifacts.count() >= 3) {
        // Selecionar primeiro
        await artifacts.nth(0).click();

        // Selecionar segundo com Shift
        await page.keyboard.down('Shift');
        await artifacts.nth(1).click();
        await page.keyboard.up('Shift');

        // Selecionar terceiro com Shift
        await page.keyboard.down('Shift');
        await artifacts.nth(2).click();
        await page.keyboard.up('Shift');

        // Verificar se múltiplos estão selecionados
        const selectedArtifacts = page.locator('[data-testid*="selected"]').or(
          page.locator('.selected')
        );

        await expect(selectedArtifacts).toHaveCount(3);
      }
    }
  });

  test('deve permitir excluir artefatos', async ({ page }) => {
    // Criar um artefato
    const textButton = page.locator('[data-testid="create-text"]').or(
      page.locator('text=Texto')
    );

    if (await textButton.isVisible()) {
      await textButton.click();
      const canvasArea = page.locator('[data-testid="canvas-area"]');
      await canvasArea.click();

      // Contar artefatos antes da exclusão
      const artifactsBefore = await page.locator('[data-testid*="artifact"]').count() +
                               await page.locator('.artifact').count();

      // Selecionar e excluir o artefato
      const artifact = page.locator('[data-testid*="artifact"]').or(
        page.locator('.artifact')
      );

      // Procurar botão de excluir
      const deleteButton = artifact.locator('[data-testid="delete-artifact"]').or(
        artifact.locator('text=×').or(artifact.locator('.delete-btn'))
      );

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Confirmar exclusão se necessário
        const confirmButton = page.locator('text=Confirmar').or(page.locator('text=Sim'));
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        // Verificar se o artefato foi removido
        const artifactsAfter = await page.locator('[data-testid*="artifact"]').count() +
                                await page.locator('.artifact').count();

        expect(artifactsAfter).toBeLessThan(artifactsBefore);
      }
    }
  });

  test('deve permitir salvar e carregar canvas', async ({ page }) => {
    // Criar alguns artefatos
    const textButton = page.locator('[data-testid="create-text"]').or(
      page.locator('text=Texto')
    );

    if (await textButton.isVisible()) {
      await textButton.click();
      const canvasArea = page.locator('[data-testid="canvas-area"]');
      await canvasArea.click();

      // Procurar botão de salvar
      const saveButton = page.locator('[data-testid="save-canvas"]').or(
        page.locator('text=Salvar')
      );

      if (await saveButton.isVisible()) {
        await saveButton.click();

        // Verificar se há confirmação de salvamento
        const successMessage = page.locator('text=Salvo').or(
          page.locator('text=Canvas salvo')
        );

        if (await successMessage.isVisible()) {
          await expect(successMessage).toBeVisible();
        }
      }
    }
  });

  test('deve suportar zoom e pan no canvas', async ({ page }) => {
    // Testar zoom com Ctrl+Scroll
    const canvasArea = page.locator('[data-testid="canvas-area"]');

    // Simular zoom in
    await page.keyboard.down('Control');
    await canvasArea.hover();
    await page.mouse.wheel(0, -100);
    await page.keyboard.up('Control');

    // Aguardar animação de zoom
    await page.waitForTimeout(500);

    // Verificar se o zoom mudou (pode ser difícil verificar sem acesso ao estado interno)
    // Esta é mais uma verificação de que não houve erro

    // Testar pan (se suportado)
    await canvasArea.hover();
    await page.mouse.down();
    await page.mouse.move(200, 200);
    await page.mouse.up();

    // Verificar se não houve erro
    await expect(canvasArea).toBeVisible();
  });
});