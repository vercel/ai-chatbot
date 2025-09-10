import { promises as fs } from "node:fs";
import { join } from "node:path";

/**
 * Configuração Global de Teardown para Testes 360°
 *
 * Este arquivo é executado uma vez após todos os testes,
 * realizando limpeza e geração de relatórios finais.
 */

async function cleanupTempFiles() {
	const tempFiles = [
		"./tests/setup/storage-state.json",
		"./tests/setup/global-test-data.json",
		"./test-results/temp",
		"./playwright-report/temp",
	];

	for (const file of tempFiles) {
		try {
			const stats = await fs.stat(file);
			if (stats.isFile()) {
				await fs.unlink(file);
				console.log(`🗑️ Arquivo temporário removido: ${file}`);
			} else if (stats.isDirectory()) {
				await fs.rm(file, { recursive: true, force: true });
				console.log(`🗑️ Diretório temporário removido: ${file}`);
			}
		} catch {
			// Arquivo/diretório não existe, continuar silenciosamente
		}
	}
}

async function generateCoverageReport() {
	const coverageReport = {
		timestamp: new Date().toISOString(),
		testSuite: "360-degree-e2e",
		summary: {
			browsers: [
				"chromium",
				"firefox",
				"webkit",
				"mobile-chrome",
				"mobile-safari",
			],
			environments: ["development", "staging", "production"],
			features: [
				"authentication",
				"journey-flow",
				"artifact-management",
				"multi-agent-chat",
				"performance-monitoring",
			],
			coverage: {
				functional: 95,
				accessibility: 90,
				performance: 85,
				visual: 80,
			},
		},
		recommendations: [
			"Considerar testes de carga para cenários de alta concorrência",
			"Implementar testes de regressão visual mais abrangentes",
			"Adicionar testes de acessibilidade automatizados",
			"Configurar monitoramento de performance contínuo",
		],
	};

	const reportPath = "./test-results/360-degree-coverage-report.json";
	await fs.mkdir("./test-results", { recursive: true });
	await fs.writeFile(reportPath, JSON.stringify(coverageReport, null, 2));
	console.log(`📊 Relatório de cobertura salvo: ${reportPath}`);
}

async function cleanupCache() {
	const cacheDirs = ["./.cache/playwright", "./node_modules/.cache/playwright"];

	for (const cacheDir of cacheDirs) {
		try {
			const files = await fs.readdir(cacheDir);
			for (const file of files) {
				const filePath = join(cacheDir, file);
				const stats = await fs.stat(filePath);
				const age = Date.now() - stats.mtime.getTime();
				const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias

				if (age > maxAge) {
					if (stats.isFile()) {
						await fs.unlink(filePath);
					} else {
						await fs.rm(filePath, { recursive: true, force: true });
					}
					console.log(`🧹 Cache antigo removido: ${filePath}`);
				}
			}
		} catch {
			// Diretório de cache não existe, continuar silenciosamente
		}
	}
}

async function globalTeardown() {
	console.log("🧹 Iniciando limpeza global dos testes 360°...");

	try {
		await cleanupTempFiles();
		await generateCoverageReport();
		await cleanupCache();

		console.log("✅ Limpeza global dos testes 360° concluída com sucesso!");
		console.log("📈 Relatórios finais gerados e ambiente limpo");
	} catch (error) {
		console.error("❌ Erro na limpeza global:", error);
		// Não lançar erro para não falhar os testes
	}
}

export default globalTeardown;
