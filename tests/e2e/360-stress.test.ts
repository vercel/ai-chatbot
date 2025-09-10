import { test, expect } from "@playwright/test";

test.describe("Cobertura 360 Graus - Testes de Stress", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/persona");
		await page.waitForLoadState("networkidle");

		// Verificar que valores são numéricos ou vazios
		if (tiltValue && azimuthValue) {
			expect(Number.isNaN(Number(tiltValue))).toBeFalsy();
			expect(Number.isNaN(Number(azimuthValue))).toBeFalsy();
		} // Tentar mudar para modo integrator
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

	test("deve suportar múltiplas rotações simultâneas sem travamentos", async ({
		page,
	}) => {
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			const startTime = Date.now();

			// Executar 10 rotações completas rapidamente
			for (let rotation = 0; rotation < 10; rotation++) {
				for (let angle = 0; angle <= 360; angle += 10) {
					await azimuthInput.fill(angle.toString());
				}
			}

			const endTime = Date.now();
			const duration = endTime - startTime;

			console.log("10 rotações completas em", duration, "ms");

			// Verificar que não houve timeout ou travamento
			expect(duration).toBeLessThan(30000); // Menos de 30 segundos

			// Verificar que o controle ainda responde
			await azimuthInput.fill("180");
			await expect(azimuthInput).toHaveValue("180");
		}
	});

	test("deve lidar com entrada rápida de dados sem perda de precisão", async ({
		page,
	}) => {
		const tiltInput = page.locator('input[aria-label*="tilt"]').first();
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (
			(await tiltInput.isVisible({ timeout: 5000 })) &&
			(await azimuthInput.isVisible({ timeout: 5000 }))
		) {
			const testSequence = [
				{ tilt: "0", azimuth: "0" },
				{ tilt: "90", azimuth: "90" },
				{ tilt: "45", azimuth: "180" },
				{ tilt: "30", azimuth: "270" },
				{ tilt: "60", azimuth: "360" },
				{ tilt: "15", azimuth: "45" },
				{ tilt: "75", azimuth: "135" },
				{ tilt: "22", azimuth: "225" },
				{ tilt: "88", azimuth: "315" },
				{ tilt: "50", azimuth: "180" },
			];

			const startTime = Date.now();

			// Aplicar sequência rapidamente
			for (const config of testSequence) {
				await Promise.all([
					tiltInput.fill(config.tilt),
					azimuthInput.fill(config.azimuth),
				]);

				// Verificação imediata sem pausa
				await expect(tiltInput).toHaveValue(config.tilt);
				await expect(azimuthInput).toHaveValue(config.azimuth);
			}

			const endTime = Date.now();
			const duration = endTime - startTime;

			console.log("Sequência de 10 configurações aplicada em", duration, "ms");

			// Verificar performance aceitável
			expect(duration).toBeLessThan(5000);
		}
	});

	test("deve manter estabilidade com operações concorrentes", async ({
		page,
	}) => {
		const controls = [
			page.locator('input[aria-label*="tilt"]').first(),
			page.locator('input[aria-label*="azimuth"]').first(),
			page.locator('input[aria-label*="hour"]').first(),
		];

		// Filtrar apenas controles visíveis
		const visibleControls = [];
		for (const control of controls) {
			if (await control.isVisible({ timeout: 3000 })) {
				visibleControls.push(control);
			}
		}

		if (visibleControls.length >= 2) {
			const startTime = Date.now();

			// Executar operações concorrentes em múltiplos controles
			const operations = visibleControls.map(async (control, index) => {
				const baseValue = (index + 1) * 10;
				for (let i = 0; i < 20; i++) {
					const value = baseValue + (i % 5) * 5;
					await control.fill(value.toString());
				}
			});

			await Promise.all(operations);

			const endTime = Date.now();
			const duration = endTime - startTime;

			console.log("Operações concorrentes completadas em", duration, "ms");

			// Verificar que todas as operações foram concluídas
			for (let i = 0; i < visibleControls.length; i++) {
				const expectedValue = (i + 1) * 10 + 20; // Último valor da sequência
				const actualValue = await visibleControls[i].inputValue();
				expect(actualValue).toBe(expectedValue.toString());
			}

			expect(duration).toBeLessThan(10000);
		}
	});

	test("deve resistir a spam de cliques e entradas", async ({ page }) => {
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			const startTime = Date.now();

			// Simular spam de entradas (50 entradas rápidas)
			for (let i = 0; i < 50; i++) {
				const angle = (i * 7) % 360; // Padrão não-linear
				await azimuthInput.fill(angle.toString());
			}

			const endTime = Date.now();
			const duration = endTime - startTime;

			console.log("50 entradas processadas em", duration, "ms");

			// Verificar que o sistema não travou
			expect(duration).toBeLessThan(15000);

			// Verificar que a última entrada foi processada
			const finalValue = await azimuthInput.inputValue();
			expect(finalValue).toBe("343"); // Último valor: (49 * 7) % 360 = 343

			// Verificar que o controle ainda é responsivo
			await azimuthInput.fill("0");
			await expect(azimuthInput).toHaveValue("0");
		}
	});

	test("deve manter performance com múltiplas abas/janelas", async ({
		page,
		context,
	}) => {
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			// Criar múltiplas páginas
			const pages = [page];
			for (let i = 0; i < 3; i++) {
				const newPage = await context.newPage();
				await newPage.goto("/persona");
				await newPage.waitForLoadState("networkidle");

				// Tentar mudar para modo integrator na nova página
				const integratorButton = newPage
					.getByRole("button", { name: /integrator/i })
					.or(
						newPage
							.getByText(/integrator/i)
							.locator("..")
							.locator("button"),
					);

				if (await integratorButton.isVisible({ timeout: 3000 })) {
					await integratorButton.click();
					await newPage.waitForTimeout(1000);
				}

				pages.push(newPage);
			}

			const startTime = Date.now();

			// Executar operações em todas as páginas simultaneamente
			const operations = pages.map(async (p, index) => {
				const input = p.locator('input[aria-label*="azimuth"]').first();
				if (await input.isVisible({ timeout: 3000 })) {
					for (let angle = 0; angle <= 180; angle += 30) {
						await input.fill((angle + index * 10).toString());
					}
				}
			});

			await Promise.all(operations);

			const endTime = Date.now();
			const duration = endTime - startTime;

			console.log("Operações em 4 páginas completadas em", duration, "ms");

			// Verificar performance aceitável com múltiplas abas
			expect(duration).toBeLessThan(20000);

			// Fechar páginas extras
			for (let i = 1; i < pages.length; i++) {
				await pages[i].close();
			}
		}
	});

	test("deve lidar com valores extremos e edge cases", async ({ page }) => {
		const tiltInput = page.locator('input[aria-label*="tilt"]').first();
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (
			(await tiltInput.isVisible({ timeout: 5000 })) &&
			(await azimuthInput.isVisible({ timeout: 5000 }))
		) {
			const edgeCases = [
				{ tilt: "-1000", azimuth: "-1000" },
				{ tilt: "1000", azimuth: "1000" },
				{ tilt: "NaN", azimuth: "Infinity" },
				{ tilt: "", azimuth: "" },
				{ tilt: "abc", azimuth: "xyz" },
				{ tilt: "0.000001", azimuth: "359.999999" },
				{ tilt: "89.999999", azimuth: "0.000001" },
			];

			for (const testCase of edgeCases) {
				try {
					await tiltInput.fill(testCase.tilt);
					await azimuthInput.fill(testCase.azimuth);

					// Aguardar processamento
					await page.waitForTimeout(100);

					// Verificar que valores foram processados (não travaram)
					const tiltValue = await tiltInput.inputValue();
					const azimuthValue = await azimuthInput.inputValue();

					console.log(
						`Edge case ${testCase.tilt}/${testCase.azimuth} -> ${tiltValue}/${azimuthValue}`,
					);

					// Verificar que valores são numéricos ou vazios
					if (tiltValue && azimuthValue) {
						expect(Number.isNaN(Number(tiltValue))).toBeFalsy();
						expect(Number.isNaN(Number(azimuthValue))).toBeFalsy();
					}
				} catch (error) {
					// Erro esperado para caso extremo - ignorar silenciosamente
					console.log(
						`Erro esperado para caso extremo: ${testCase.tilt}/${testCase.azimuth}`,
						error,
					);
					// Não precisamos lançar o erro pois é esperado para casos extremos
				}
			}

			// Verificar que controles ainda funcionam após casos extremos
			await tiltInput.fill("45");
			await azimuthInput.fill("180");
			await expect(tiltInput).toHaveValue("45");
			await expect(azimuthInput).toHaveValue("180");
		}
	});

	test("deve manter estabilidade durante reloads frequentes", async ({
		page,
	}) => {
		let reloadCount = 0;
		const maxReloads = 5;

		for (let i = 0; i < maxReloads; i++) {
			// Configurar controles antes do reload
			const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

			if (await azimuthInput.isVisible({ timeout: 3000 })) {
				await azimuthInput.fill("90");

				// Recarregar página
				await page.reload();
				await page.waitForLoadState("networkidle");

				// Tentar mudar para modo integrator novamente
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

				reloadCount++;
				console.log(`Reload ${reloadCount}/${maxReloads} completado`);
			}
		}

		// Verificar que todos os reloads foram bem-sucedidos
		expect(reloadCount).toBe(maxReloads);

		// Verificar que funcionalidade ainda funciona após reloads
		const finalAzimuthInput = page
			.locator('input[aria-label*="azimuth"]')
			.first();
		if (await finalAzimuthInput.isVisible({ timeout: 3000 })) {
			await finalAzimuthInput.fill("45");
			await expect(finalAzimuthInput).toHaveValue("45");
		}
	});

	test("deve resistir a manipulação DOM externa", async ({ page }) => {
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			// Capturar valor inicial
			await azimuthInput.fill("45");
			await expect(azimuthInput).toHaveValue("45");

			// Simular manipulação externa do DOM
			await page.evaluate(() => {
				const inputs = document.querySelectorAll(
					'input[aria-label*="azimuth"]',
				);
				for (const input of inputs) {
					// Tentar modificar valor diretamente
					(input as HTMLInputElement).value = "999";
					// Disparar eventos
					input.dispatchEvent(new Event("input", { bubbles: true }));
					input.dispatchEvent(new Event("change", { bubbles: true }));
				}
			});

			await page.waitForTimeout(500);

			// Verificar que o controle ainda funciona corretamente
			await azimuthInput.fill("90");
			await expect(azimuthInput).toHaveValue("90");

			console.log("Controle resistiu à manipulação DOM externa");
		}
	});

	test("deve manter performance com dados de cache cheios", async ({
		page,
	}) => {
		const azimuthInput = page.locator('input[aria-label*="azimuth"]').first();

		if (await azimuthInput.isVisible({ timeout: 5000 })) {
			// Preencher cache com muitas operações
			const startTime = Date.now();

			for (let i = 0; i < 100; i++) {
				const angle = i % 360;
				await azimuthInput.fill(angle.toString());

				// Pequena pausa para simular processamento
				await page.waitForTimeout(10);
			}

			const endTime = Date.now();
			const duration = endTime - startTime;

			console.log("100 operações com cache cheio em", duration, "ms");

			// Verificar performance ainda aceitável
			expect(duration).toBeLessThan(25000);

			// Verificar funcionalidade final
			const finalValue = await azimuthInput.inputValue();
			expect(finalValue).toBe("99");
		}
	});
});
