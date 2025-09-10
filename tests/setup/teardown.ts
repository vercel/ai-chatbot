import { test as teardown } from "@playwright/test";

/**
 * Configuração de Teardown por Teste para Testes 360°
 *
 * Este arquivo é executado após cada teste individual,
 * realizando limpeza específica do teste executado.
 */

teardown.describe("Teardown por Teste - 360° Tests", () => {
	teardown("limpar estado do navegador", async ({ page, context }) => {
		try {
			// Limpar localStorage e sessionStorage
			await page.evaluate(() => {
				localStorage.clear();
				sessionStorage.clear();
			});

			// Limpar cookies relacionados aos testes
			const cookies = await context.cookies();
			const testCookies = cookies.filter(
				(cookie) =>
					cookie.name.includes("test") ||
					cookie.name.includes("360") ||
					cookie.domain?.includes("localhost"),
			);

			for (const cookie of testCookies) {
				await context.clearCookies({
					name: cookie.name,
					domain: cookie.domain,
				});
			}

			console.log("🧹 Estado do navegador limpo após teste");
		} catch (error) {
			console.warn(
				"⚠️ Erro ao limpar estado do navegador:",
				(error as Error).message,
			);
		}
	});

	teardown("limpar dados de teste temporários", async ({ page }) => {
		try {
			// Remover dados de teste do window object
			await page.evaluate(() => {
				if (window.testData) {
					window.testData = undefined;
				}
			});

			// Limpar qualquer modal ou overlay que possa ter ficado aberto
			await page.evaluate(() => {
				const modals = document.querySelectorAll(
					'[role="dialog"], .modal, .overlay',
				);
				for (const modal of modals) {
					const element = modal as HTMLElement;
					element.style.display = "none";
				}
			});

			console.log("🧹 Dados temporários de teste limpos");
		} catch (error) {
			console.warn(
				"⚠️ Erro ao limpar dados temporários:",
				(error as Error).message,
			);
		}
	});

	teardown("resetar configurações de geolocalização", async ({ context }) => {
		try {
			// Resetar permissões de geolocalização
			await context.clearPermissions();

			// Resetar geolocalização para padrão
			await context.setGeolocation({
				latitude: -23.5505, // São Paulo
				longitude: -46.6333,
			});

			console.log("🧹 Configurações de geolocalização resetadas");
		} catch (error) {
			console.warn(
				"⚠️ Erro ao resetar geolocalização:",
				(error as Error).message,
			);
		}
	});

	teardown(
		"capturar screenshot final se teste falhou",
		async ({ page }, testInfo) => {
			if (testInfo.status === "failed") {
				try {
					const screenshotPath = `test-results/screenshots/${testInfo.title.replace(/[^a-zA-Z0-9]/g, "_")}_final.png`;
					await page.screenshot({
						path: screenshotPath,
						fullPage: true,
						quality: 80,
					});
					console.log(`📸 Screenshot final capturado: ${screenshotPath}`);
				} catch (error) {
					console.warn(
						"⚠️ Erro ao capturar screenshot final:",
						(error as Error).message,
					);
				}
			}
		},
	);

	teardown("log de finalização do teste", async () => {
		console.log("🏁 Teste finalizado - ambiente preparado para próximo teste");
		console.log("🔄 Ambiente de teste 360° limpo e pronto");
	});
});
