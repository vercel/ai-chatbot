import { test, expect } from "@playwright/test";

/**
 * Teste 360° - Jornada do Usuário Owner
 *
 * Teste abrangente da jornada completa do usuário proprietário,
 * incluindo autenticação, configuração e interação com o sistema.
 */

test.describe("Jornada 360° - Usuário Owner", () => {
	test.beforeEach(async ({ page }) => {
		// Configuração inicial para cada teste
		await page.goto("/");
		await page.waitForLoadState("networkidle");
	});

	test("autenticação e onboarding 360°", async ({ page }) => {
		// Verificar carregamento da página inicial
		await expect(page).toHaveTitle(/YSH AI Chatbot/);

		// Verificar elementos de autenticação
		const loginButton = page.locator('[data-testid="login-button"]');
		await expect(loginButton).toBeVisible();

		// Verificar configuração de persona
		const personaSelector = page.locator('[data-testid="persona-selector"]');
		await expect(personaSelector).toBeVisible();

		// Testar seleção de persona owner
		await personaSelector.click();
		await page.locator('[data-testid="persona-owner"]').click();

		// Verificar se a persona foi aplicada
		await expect(page.locator('[data-testid="owner-dashboard"]')).toBeVisible();
	});

	test("navegação na jornada solar 360°", async ({ page }) => {
		// Configurar persona owner
		await page.evaluate(() => {
			localStorage.setItem("persona", "owner");
		});

		await page.reload();

		// Verificar navegação entre fases da jornada
		const phases = [
			"investigation",
			"detection",
			"analysis",
			"dimensioning",
			"recommendation",
			"lead-management",
		];

		for (const phase of phases) {
			const phaseButton = page.locator(`[data-testid="phase-${phase}"]`);
			await expect(phaseButton).toBeVisible();
			await phaseButton.click();

			// Verificar carregamento da fase
			await expect(
				page.locator(`[data-testid="phase-${phase}-content"]`),
			).toBeVisible();
		}
	});

	test("interação com chat AI 360°", async ({ page }) => {
		// Configurar ambiente de teste
		await page.evaluate(() => {
			localStorage.setItem("test-mode", "360-degree");
		});

		await page.reload();

		// Localizar campo de input do chat
		const chatInput = page.locator('[data-testid="chat-input"]');
		await expect(chatInput).toBeVisible();

		// Enviar mensagem de teste
		await chatInput.fill("Olá, quero informações sobre energia solar");
		await chatInput.press("Enter");

		// Verificar resposta do AI
		const chatMessages = page.locator('[data-testid="chat-messages"]');
		await expect(chatMessages).toContainText("energia solar");

		// Verificar se múltiplas mensagens são suportadas
		await chatInput.fill("Quais são os benefícios?");
		await chatInput.press("Enter");

		await expect(chatMessages).toContainText("benefícios");
	});

	test("gerenciamento de artefatos 360°", async ({ page }) => {
		// Simular criação de artefato
		await page.evaluate(() => {
			localStorage.setItem("test-mode", "360-degree");
		});

		await page.reload();

		// Verificar interface de artefatos
		const artifactPanel = page.locator('[data-testid="artifact-panel"]');
		await expect(artifactPanel).toBeVisible();

		// Testar criação de documento
		const createDocButton = page.locator('[data-testid="create-document"]');
		await createDocButton.click();

		const docTitle = page.locator('[data-testid="document-title"]');
		await docTitle.fill("Análise Solar 360° - Teste");

		const saveButton = page.locator('[data-testid="save-document"]');
		await saveButton.click();

		// Verificar se o documento foi criado
		await expect(page.locator('[data-testid="document-list"]')).toContainText(
			"Análise Solar 360° - Teste",
		);
	});

	test("performance e acessibilidade 360°", async ({ page }) => {
		// Medir tempo de carregamento
		const startTime = Date.now();
		await page.goto("/");
		await page.waitForLoadState("networkidle");
		const loadTime = Date.now() - startTime;

		// Verificar performance aceitável (< 3 segundos)
		expect(loadTime).toBeLessThan(3000);

		// Verificar acessibilidade básica
		const mainHeading = page.locator("h1");
		await expect(mainHeading).toHaveAttribute("id");

		// Verificar navegação por teclado
		await page.keyboard.press("Tab");
		const focusedElement = page.locator(":focus");
		await expect(focusedElement).toBeVisible();

		// Verificar contraste de cores (simulado)
		const primaryButton = page.locator('[data-testid="primary-button"]');
		const buttonColor = await primaryButton.evaluate((el) => {
			return window.getComputedStyle(el).backgroundColor;
		});

		// Verificar se o botão tem cor definida
		expect(buttonColor).not.toBe("rgba(0, 0, 0, 0)");
	});

	test("testes mobile 360°", async ({ page, isMobile }) => {
		if (isMobile) {
			// Testes específicos para mobile
			await page.setViewportSize({ width: 375, height: 667 });

			// Verificar responsividade
			const mobileMenu = page.locator('[data-testid="mobile-menu"]');
			await expect(mobileMenu).toBeVisible();

			// Testar toque em elementos
			await mobileMenu.click();

			// Verificar se o menu se expandiu
			const menuItems = page.locator('[data-testid="menu-items"]');
			await expect(menuItems).toBeVisible();
		}
	});
});
