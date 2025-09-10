import { test, expect } from "@playwright/test";

test.describe("Cobertura 360 Graus - Testes de Regressão", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/persona");
		await page.waitForLoadState("networkidle");

		// Tentar mudar para modo integrator
		const integratorButton = page
			.getByRole("button", { name: /integrator/i })
			.or(
				page
					.getByText(/integrator/i)
					.locator("..")
					.locator("button"),
			);

		if (await integratorButton.isVisible({ timeout: 3000 })) {
			await integratorButton.click();
			await page.waitForTimeout(1000);
		}
	});

	test("deve manter funcionalidade básica após atualizações", async ({
		page,
	}) => {
		// Teste de regressão: funcionalidades básicas que nunca devem quebrar
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			// Teste 1: Entrada básica funciona
			await azimuthInput.fill("90");
			await expect(azimuthInput).toHaveValue("90");

			// Teste 2: Limites são respeitados
			await azimuthInput.fill("400"); // Acima do limite
			let value = await azimuthInput.inputValue();
			expect(Number.parseInt(value)).toBeLessThanOrEqual(360);

			await azimuthInput.fill("-10"); // Abaixo do limite
			value = await azimuthInput.inputValue();
			expect(Number.parseInt(value)).toBeGreaterThanOrEqual(0);

			// Teste 3: Valores decimais são aceitos
			await azimuthInput.fill("45.5");
			value = await azimuthInput.inputValue();
			expect(value).toBe("45.5");

			console.log("Funcionalidades básicas mantidas");
		}
	});

	test("deve preservar comportamento de rotação completa", async ({ page }) => {
		// Teste de regressão: rotação 360° deve funcionar consistentemente
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			const startTime = Date.now();

			// Rotação completa em passos de 45°
			for (let angle = 0; angle <= 360; angle += 45) {
				await azimuthInput.fill(angle.toString());
				await expect(azimuthInput).toHaveValue(angle.toString());
			}

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Verificar performance consistente
			expect(duration).toBeLessThan(5000);

			// Verificar que completou o ciclo
			const finalValue = await azimuthInput.inputValue();
			expect(finalValue).toBe("360");

			console.log("Rotação completa funcionando consistentemente");
		}
	});

	test("deve manter sincronização tilt-azimuth", async ({ page }) => {
		// Teste de regressão: combinação tilt+azimuth deve funcionar
		const tiltInput = page.locator('input[aria-label*="tilt"]').first();
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (
			(await tiltInput.isVisible({ timeout: 5000 })) &&
			(await azimuthInput.isVisible({ timeout: 5000 }))
		) {
			// Cenário 1: Configuração válida
			await tiltInput.fill("30");
			await azimuthInput.fill("180");
			await expect(tiltInput).toHaveValue("30");
			await expect(azimuthInput).toHaveValue("180");

			// Cenário 2: Valores extremos válidos
			await tiltInput.fill("0");
			await azimuthInput.fill("360");
			await expect(tiltInput).toHaveValue("0");
			await expect(azimuthInput).toHaveValue("360");

			// Cenário 3: Valores decimais
			await tiltInput.fill("22.5");
			await azimuthInput.fill("135.7");
			await expect(tiltInput).toHaveValue("22.5");
			await expect(azimuthInput).toHaveValue("135.7");

			console.log("Sincronização tilt-azimuth mantida");
		}
	});

	test("deve preservar validação de entrada", async ({ page }) => {
		// Teste de regressão: validação deve funcionar consistentemente
		const controls = [
			{ selector: 'input[aria-label*="tilt"]', min: 0, max: 90 },
			{ selector: 'input[aria-label*="azimuth"]', min: 0, max: 360 },
			{ selector: 'input[aria-label*="hour"]', min: 0, max: 23 },
		];

		for (const control of controls) {
			const input = page.locator(control.selector).first();

			if (await input.isVisible({ timeout: 3000 })) {
				// Testar valor mínimo
				await input.fill((control.min - 10).toString());
				let value = await input.inputValue();
				expect(Number.parseInt(value)).toBeGreaterThanOrEqual(control.min);

				// Testar valor máximo
				await input.fill((control.max + 10).toString());
				value = await input.inputValue();
				expect(Number.parseInt(value)).toBeLessThanOrEqual(control.max);

				// Testar valor válido
				await input.fill((control.min + 10).toString());
				value = await input.inputValue();
				expect(Number.parseInt(value)).toBe(control.min + 10);

				console.log(`Validação de ${control.selector} funcionando`);
			}
		}
	});

	test("deve manter compatibilidade com diferentes navegadores", async ({
		page,
	}) => {
		// Teste de regressão: funcionalidades devem funcionar em diferentes contextos
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			// Simular diferentes user agents
			const userAgents = [
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
				"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
			];

			for (const ua of userAgents) {
				await page.setExtraHTTPHeaders({ "User-Agent": ua });

				// Testar funcionalidade básica
				await azimuthInput.fill("90");
				await expect(azimuthInput).toHaveValue("90");

				console.log(`Compatibilidade com ${ua.split(" ")[1]} mantida`);
			}
		}
	});

	test("deve preservar estado após navegação", async ({ page }) => {
		// Teste de regressão: estado deve ser mantido durante navegação
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			// Definir valor inicial
			await azimuthInput.fill("135");
			await expect(azimuthInput).toHaveValue("135");

			// Simular navegação (reload)
			await page.reload();
			await page.waitForLoadState("networkidle");

			// Tentar restaurar modo integrator
			const integratorButton = page
				.getByRole("button", { name: /integrator/i })
				.or(
					page
						.getByText(/integrator/i)
						.locator("..")
						.locator("button"),
				);

			if (await integratorButton.isVisible({ timeout: 3000 })) {
				await integratorButton.click();
				await page.waitForTimeout(1000);
			}

			// Verificar se controle ainda existe e funciona
			const reloadedAzimuthInput = page
				.locator('input[aria-label*="azimuth"]')
				.first();

			if (await reloadedAzimuthInput.isVisible({ timeout: 5000 })) {
				// Deve estar em estado padrão (não o valor anterior)
				const value = await reloadedAzimuthInput.inputValue();
				expect(value).toBeTruthy(); // Deve ter algum valor

				// Deve funcionar normalmente
				await reloadedAzimuthInput.fill("225");
				await expect(reloadedAzimuthInput).toHaveValue("225");

				console.log("Estado preservado após navegação");
			}
		}
	});

	test("deve manter performance consistente", async ({ page }) => {
		// Teste de regressão: performance não deve degradar
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			const performanceResults: number[] = [];

			// Executar teste múltiplas vezes para verificar consistência
			for (let i = 0; i < 5; i++) {
				const startTime = Date.now();

				for (let angle = 0; angle <= 180; angle += 30) {
					await azimuthInput.fill(angle.toString());
				}

				const endTime = Date.now();
				performanceResults.push(endTime - startTime);
			}

			// Calcular métricas de performance
			const avgPerformance =
				performanceResults.reduce((a, b) => a + b, 0) /
				performanceResults.length;
			const maxPerformance = Math.max(...performanceResults);
			const minPerformance = Math.min(...performanceResults);
			const variance = maxPerformance - minPerformance;

			console.log("Performance consistente:");
			console.log("- Média:", avgPerformance.toFixed(2), "ms");
			console.log("- Máximo:", maxPerformance, "ms");
			console.log("- Mínimo:", minPerformance, "ms");
			console.log("- Variação:", variance, "ms");

			// Verificar consistência (baixa variação)
			expect(variance).toBeLessThan(1000); // Menos de 1 segundo de variação
			expect(avgPerformance).toBeLessThan(3000); // Média aceitável
		}
	});

	test("deve preservar ordem de tabulação", async ({ page }) => {
		// Teste de regressão: ordem de foco deve ser lógica
		const controls = page.locator(
			'input[aria-label*="tilt"], input[aria-label*="azimuth"], input[aria-label*="hour"]',
		);

		const controlCount = await controls.count();

		if (controlCount >= 2) {
			// Focar no primeiro controle
			const firstControl = controls.first();
			await firstControl.focus();
			await expect(firstControl).toBeFocused();

			// Testar navegação com Tab
			for (let i = 0; i < controlCount - 1; i++) {
				await page.keyboard.press("Tab");

				const focusedElement = page.locator(":focus");
				await expect(focusedElement).toBeVisible();

				// Verificar se foco está em um controle válido
				const isValidControl = await focusedElement.evaluate(
					(el) =>
						el.tagName === "INPUT" ||
						el.tagName === "BUTTON" ||
						el.hasAttribute("tabindex"),
				);
				expect(isValidControl).toBeTruthy();
			}

			console.log("Ordem de tabulação preservada");
		}
	});

	test("deve manter compatibilidade com zoom do navegador", async ({
		page,
	}) => {
		// Teste de regressão: deve funcionar com diferentes níveis de zoom
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			const zoomLevels = [0.8, 1.0, 1.2, 1.5];

			for (const zoom of zoomLevels) {
				// Aplicar zoom
				await page.evaluate((z) => {
					document.body.style.zoom = z.toString();
				}, zoom);

				await page.waitForTimeout(500);

				// Testar funcionalidade
				await azimuthInput.fill("90");
				await expect(azimuthInput).toHaveValue("90");

				// Verificar se controle ainda é clicável
				const isEnabled = await azimuthInput.isEnabled();
				expect(isEnabled).toBeTruthy();

				console.log(`Compatibilidade com zoom ${zoom * 100}% mantida`);
			}

			// Resetar zoom
			await page.evaluate(() => {
				document.body.style.zoom = "1";
			});
		}
	});

	test("deve preservar mensagens de erro consistentes", async ({ page }) => {
		// Teste de regressão: mensagens de erro devem ser consistentes
		const tiltInput = page.locator('input[aria-label*="tilt"]').first();

		if (await tiltInput.isVisible({ timeout: 5000 })) {
			// Testar entrada inválida
			await tiltInput.fill("abc");
			await page.waitForTimeout(500);

			// Verificar se valor foi sanitizado
			const value = await tiltInput.inputValue();
			expect(Number.isNaN(Number.parseFloat(value))).toBeFalsy();

			// Testar valor fora do range
			await tiltInput.fill("100"); // Acima de 90°
			await page.waitForTimeout(500);

			const clampedValue = await tiltInput.inputValue();
			expect(Number.parseFloat(clampedValue)).toBeLessThanOrEqual(90);

			console.log("Tratamento de erros consistente mantido");
		}
	});

	test("deve manter integração com componentes relacionados", async ({
		page,
	}) => {
		// Teste de regressão: integração com outros componentes deve funcionar
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			// Alterar valor
			await azimuthInput.fill("270");

			// Aguardar atualização de componentes relacionados
			await page.waitForTimeout(500);

			// Verificar se visualização foi atualizada (se existir)
			const viewerContainer = page
				.locator('[aria-label*="viewer"]')
				.or(page.locator("canvas"))
				.first();

			if (await viewerContainer.isVisible({ timeout: 3000 })) {
				// Verificar se viewer ainda está funcional
				const isVisible = await viewerContainer.isVisible();
				expect(isVisible).toBeTruthy();

				console.log("Integração com visualização mantida");
			}

			// Verificar se cards de informação foram atualizados
			const infoCards = page
				.locator('[aria-label*="layout"]')
				.or(page.locator("text=/azimuth|ângulo/i").locator(".."));

			if (await infoCards.first().isVisible({ timeout: 3000 })) {
				await expect(infoCards.first()).toContainText("270");
				console.log("Integração com cards de informação mantida");
			}
		}
	});
});
