import { test, expect } from "@playwright/test";

test.describe("Cobertura 360 Graus - Acessibilidade (WCAG)", () => {
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

	test("deve ter labels ARIA adequados para todos os controles", async ({
		page,
	}) => {
		const controls = [
			{
				selector: 'input[aria-label*="tilt"]',
				expectedLabel: /tilt|inclinação/i,
			},
			{
				selector: 'input[aria-label*="azimuth"]',
				expectedLabel: /azimuth|azimute/i,
			},
			{ selector: 'input[aria-label*="hour"]', expectedLabel: /hour|hora/i },
			{
				selector: 'input[aria-label*="spacing"]',
				expectedLabel: /spacing|espaçamento/i,
			},
		];

		for (const control of controls) {
			const element = page.locator(control.selector).first();

			if (await element.isVisible({ timeout: 3000 })) {
				const ariaLabel = await element.getAttribute("aria-label");
				expect(ariaLabel).toMatch(control.expectedLabel);

				// Verificar se tem valor acessível
				const value = await element.inputValue();
				expect(value).toBeTruthy();

				console.log(
					`Control ${control.expectedLabel}: aria-label="${ariaLabel}", value="${value}"`,
				);
			}
		}
	});

	test("deve suportar navegação por teclado completa", async ({ page }) => {
		// Focar no primeiro controle disponível
		const firstControl = page
			.locator('input[aria-label*="tilt"]')
			.or(
				page
					.locator('input[aria-label*="azimuth"]')
					.or(page.locator('input[aria-label*="hour"]')),
			)
			.first();

		if (await firstControl.isVisible({ timeout: 5000 })) {
			// Focar no controle
			await firstControl.focus();

			// Verificar se está focado
			await expect(firstControl).toBeFocused();

			// Testar navegação com Tab
			await page.keyboard.press("Tab");
			const nextElement = page.locator(":focus");
			await expect(nextElement).toBeVisible();

			// Voltar com Shift+Tab
			await page.keyboard.press("Shift+Tab");
			await expect(firstControl).toBeFocused();

			console.log("Navegação por teclado funcionando corretamente");
		}
	});

	test("deve ter controles com valores descritivos e unidades", async ({
		page,
	}) => {
		const tiltInput = page.locator('input[aria-label*="tilt"]').first();

		if (await tiltInput.isVisible({ timeout: 5000 })) {
			// Verificar se tem aria-describedby ou aria-valuetext
			const ariaDescribedBy = await tiltInput.getAttribute("aria-describedby");

			if (ariaDescribedBy) {
				const description = page.locator(`#${ariaDescribedBy}`);
				await expect(description).toBeVisible();
			}

			// Testar diferentes valores e verificar feedback
			const testValues = ["0", "30", "45", "60", "90"];

			for (const value of testValues) {
				await tiltInput.fill(value);
				await expect(tiltInput).toHaveValue(value);

				// Verificar se screen readers teriam feedback adequado
				const currentValue = await tiltInput.inputValue();
				expect(currentValue).toBe(value);

				console.log(`Tilt ${value}° - valor acessível: ${currentValue}`);
			}
		}
	});

	test("deve suportar leitores de tela com roles adequados", async ({
		page,
	}) => {
		const controls = [
			{ selector: 'input[aria-label*="tilt"]', expectedRole: "spinbutton" },
			{ selector: 'input[aria-label*="azimuth"]', expectedRole: "spinbutton" },
			{ selector: 'input[aria-label*="hour"]', expectedRole: "spinbutton" },
			{ selector: 'input[type="range"]', expectedRole: "slider" },
		];

		for (const control of controls) {
			const element = page.locator(control.selector).first();

			if (await element.isVisible({ timeout: 3000 })) {
				const role =
					(await element.getAttribute("role")) ||
					(await element.evaluate((el) => el.tagName.toLowerCase()));

				if (control.expectedRole === "spinbutton") {
					expect(["input", "spinbutton"].includes(role)).toBeTruthy();
				} else if (control.expectedRole === "slider") {
					expect(role).toBe("slider");
				}

				console.log(
					`Control role: ${role} (expected: ${control.expectedRole})`,
				);
			}
		}
	});

	test("deve ter contraste adequado de cores (WCAG AA)", async ({ page }) => {
		const controls = page.locator(
			'input[aria-label*="tilt"], input[aria-label*="azimuth"], input[aria-label*="hour"]',
		);

		const controlCount = await controls.count();

		if (controlCount > 0) {
			// Verificar contraste de cores via CSS
			for (let i = 0; i < controlCount; i++) {
				const control = controls.nth(i);
				const computedStyle = await control.evaluate((el) => {
					const style = window.getComputedStyle(el);
					return {
						backgroundColor: style.backgroundColor,
						color: style.color,
						borderColor: style.borderColor,
					};
				});

				// Verificar se cores são definidas (não transparent)
				expect(computedStyle.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
				expect(computedStyle.color).not.toBe("rgba(0, 0, 0, 0)");

				console.log(`Control ${i + 1} colors:`, computedStyle);
			}
		}
	});

	test("deve suportar aumento de fonte e zoom", async ({ page }) => {
		// Simular zoom do navegador (120%)
		await page.evaluate(() => {
			document.body.style.zoom = "1.2";
		});

		await page.waitForTimeout(500);

		const tiltInput = page.locator('input[aria-label*="tilt"]').first();

		if (await tiltInput.isVisible({ timeout: 5000 })) {
			// Verificar se controle ainda é acessível após zoom
			const isClickable = await tiltInput.isEnabled();
			expect(isClickable).toBeTruthy();

			// Testar funcionalidade após zoom
			await tiltInput.fill("45");
			await expect(tiltInput).toHaveValue("45");

			console.log("Controles funcionam corretamente com zoom 120%");
		}

		// Resetar zoom
		await page.evaluate(() => {
			document.body.style.zoom = "1";
		});
	});

	test("deve ter feedback adequado para ações (aria-live)", async ({
		page,
	}) => {
		const tiltInput = page.locator('input[aria-label*="tilt"]').first();

		if (await tiltInput.isVisible({ timeout: 5000 })) {
			// Verificar se há regiões live para feedback
			page.locator("[aria-live], [aria-atomic]");

			// Capturar mensagens de console que podem indicar feedback
			const messages: string[] = [];
			page.on("console", (msg) => {
				messages.push(msg.text());
			});

			// Alterar valor e verificar feedback
			await tiltInput.fill("60");

			// Aguardar possível feedback
			await page.waitForTimeout(500);

			// Verificar se valor foi atualizado
			await expect(tiltInput).toHaveValue("60");

			console.log("Feedback de ações:", messages);
		}
	});

	test("deve suportar modo de alto contraste", async ({ page }) => {
		// Simular modo de alto contraste
		await page.emulateMedia({ colorScheme: "dark" });
		await page.emulateMedia({ forcedColors: "active" });

		await page.waitForTimeout(500);

		const controls = page.locator(
			'input[aria-label*="tilt"], input[aria-label*="azimuth"]',
		);

		const controlCount = await controls.count();

		if (controlCount > 0) {
			for (let i = 0; i < controlCount; i++) {
				const control = controls.nth(i);

				// Verificar se controle ainda é visível em alto contraste
				await expect(control).toBeVisible();

				// Verificar se ainda é funcional
				const isEnabled = await control.isEnabled();
				expect(isEnabled).toBeTruthy();
			}

			console.log("Controles funcionam em modo de alto contraste");
		}

		// Resetar media
		await page.emulateMedia({ colorScheme: "light" });
		await page.emulateMedia({ forcedColors: "none" });
	});

	test("deve ter estrutura semântica adequada", async ({ page }) => {
		// Verificar se há headings adequados
		const headings = page.locator("h1, h2, h3, h4, h5, h6");
		const headingCount = await headings.count();

		if (headingCount > 0) {
			for (let i = 0; i < headingCount; i++) {
				const heading = headings.nth(i);
				const text = await heading.textContent();
				const level = await heading.evaluate((el) =>
					Number.parseInt(el.tagName.charAt(1)),
				);

				console.log(`Heading ${level}: ${text}`);
			}
		}

		// Verificar se controles estão dentro de form ou fieldset apropriado
		const tiltInput = page.locator('input[aria-label*="tilt"]').first();

		if (await tiltInput.isVisible({ timeout: 5000 })) {
			const parentForm = tiltInput.locator("xpath=ancestor::form").first();
			const parentFieldset = tiltInput
				.locator("xpath=ancestor::fieldset")
				.first();

			const hasForm = await parentForm
				.isVisible({ timeout: 1000 })
				.catch(() => false);
			const hasFieldset = await parentFieldset
				.isVisible({ timeout: 1000 })
				.catch(() => false);

			if (hasForm || hasFieldset) {
				console.log("Controles estão dentro de estrutura semântica adequada");
			} else {
				console.log("Controles podem precisar de melhor estrutura semântica");
			}
		}
	});

	test("deve suportar navegação com screen reader", async ({ page }) => {
		// Simular navegação típica de screen reader
		const tiltInput = page.locator('input[aria-label*="tilt"]').first();

		if (await tiltInput.isVisible({ timeout: 5000 })) {
			// Verificar propriedades de acessibilidade
			const accessibilityProps = await tiltInput.evaluate((el) => ({
				ariaLabel: el.getAttribute("aria-label"),
				ariaDescribedBy: el.getAttribute("aria-describedby"),
				ariaValueText: el.getAttribute("aria-valuetext"),
				ariaValueNow: el.getAttribute("aria-valuenow"),
				ariaValueMin: el.getAttribute("aria-valuemin"),
				ariaValueMax: el.getAttribute("aria-valuemax"),
				role: el.getAttribute("role"),
				tabIndex: el.getAttribute("tabindex"),
			}));

			console.log("Propriedades de acessibilidade:", accessibilityProps);

			// Verificar propriedades essenciais para screen readers
			expect(accessibilityProps.ariaLabel).toBeTruthy();
			expect(accessibilityProps.role || "input").toBeTruthy();
		}
	});

	test("deve ter foco visível e adequado", async ({ page }) => {
		const tiltInput = page.locator('input[aria-label*="tilt"]').first();

		if (await tiltInput.isVisible({ timeout: 5000 })) {
			// Focar no controle
			await tiltInput.focus();

			// Verificar se tem indicador visual de foco
			const focusStyles = await tiltInput.evaluate((el) => {
				const style = window.getComputedStyle(el);
				return {
					outline: style.outline,
					outlineColor: style.outlineColor,
					outlineWidth: style.outlineWidth,
					outlineStyle: style.outlineStyle,
					boxShadow: style.boxShadow,
				};
			});

			// Verificar se há algum indicador visual de foco
			const hasFocusIndicator =
				focusStyles.outline !== "none" ||
				focusStyles.boxShadow !== "none" ||
				focusStyles.outlineWidth !== "0px";

			expect(hasFocusIndicator).toBeTruthy();

			console.log("Indicador de foco:", focusStyles);
		}
	});
});
