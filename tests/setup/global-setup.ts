import { chromium, type FullConfig } from "@playwright/test";
import { promises as fs } from "node:fs";

/**
 * Configuração Global de Setup para Testes 360°
 *
 * Este arquivo é executado uma vez antes de todos os testes,
 * configurando o estado global necessário para os testes 360°.
 */

async function globalSetup(config: FullConfig) {
	console.log("🚀 Iniciando configuração global dos testes 360°...");

	// Criar contexto de navegador para configuração inicial
	const browser = await chromium.launch({
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-dev-shm-usage",
			"--disable-accelerated-2d-canvas",
			"--no-first-run",
			"--no-zygote",
			"--disable-gpu",
		],
	});

	const context = await browser.newContext({
		viewport: { width: 1280, height: 720 },
		locale: "pt-BR",
		timezoneId: "America/Sao_Paulo",
	});

	const page = await context.newPage();

	try {
		// Configurar geolocalização padrão
		await context.grantPermissions(["geolocation"]);
		await context.setGeolocation({
			latitude: -23.5505, // São Paulo
			longitude: -46.6333,
		});

		// Verificar conectividade básica
		console.log("📡 Verificando conectividade de rede...");
		await page.goto("https://www.google.com", {
			waitUntil: "domcontentloaded",
		});
		console.log("✅ Conectividade de rede verificada");

		// Criar estado de autenticação se necessário
		// Isso pode ser usado para cenários que requerem login prévio
		await context.storageState({ path: "./tests/setup/storage-state.json" });
		console.log("💾 Estado de autenticação salvo");

		// Configurar dados globais de teste
		const globalTestData = {
			environment: "360-degree-test",
			timestamp: new Date().toISOString(),
			version: "1.0.0",
			features: [
				"multi-browser-testing",
				"performance-monitoring",
				"accessibility-testing",
				"visual-regression",
			],
		};

		// Salvar dados globais em arquivo JSON
		await fs.writeFile(
			"./tests/setup/global-test-data.json",
			JSON.stringify(globalTestData, null, 2),
		);
		console.log("📝 Dados globais de teste salvos");

		console.log(
			"✅ Configuração global dos testes 360° concluída com sucesso!",
		);
		console.log("📊 Ambiente preparado para testes abrangentes");
	} catch (error) {
		console.error("❌ Erro na configuração global:", error);
		throw error;
	} finally {
		await browser.close();
	}
}

export default globalSetup;
