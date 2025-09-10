import { defineConfig, devices } from "@playwright/test";

/**
 * Configuração Playwright Otimizada para Testes 360° End-to-End
 *
 * Esta configuração foi projetada para máxima performance e eficácia na execução
 * de testes abrangentes de 360 graus, incluindo performance, acessibilidade,
 * stress, integração, regressão, cross-browser, recuperação, visual regression,
 * mobile, carga distribuída, serviços externos e memory profiling.
 */
export default defineConfig({
	// === DIRETÓRIOS E PADRÕES ===
	testDir: "c:/Users/fjuni/ai-ysh/tests/e2e",
	testMatch: ["360-*.test.ts", "360-*.spec.ts", "*.360.spec.ts"],

	// === ESTRATÉGIA DE EXECUÇÃO ===
	fullyParallel: false, // Sequencial para testes 360° complexos
	workers: 1, // Single worker para evitar conflitos de estado
	shard: process.env.SHARD
		? {
				current: Number.parseInt(process.env.SHARD_CURRENT || "1"),
				total: Number.parseInt(process.env.SHARD_TOTAL || "1"),
			}
		: undefined,

	// === CONFIGURAÇÕES DE RETRY ===
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 3 : 1, // Mais retries em CI

	// === TIMEOUTS OTIMIZADOS ===
	timeout: 180 * 1000, // 3 minutos para testes complexos
	expect: {
		timeout: 45 * 1000, // 45s para expectativas
	},

	// === REPORTERS AVANÇADOS ===
	reporter: process.env.CI
		? [
				["html", { open: "never", outputFolder: "playwright-report-360" }],
				["json", { outputFile: "test-results-360.json" }],
				["junit", { outputFile: "test-results-360.xml" }],
				["github"],
			]
		: [
				["html", { open: "on-failure", outputFolder: "playwright-report-360" }],
				["json", { outputFile: "test-results-360.json" }],
				["junit", { outputFile: "test-results-360.xml" }],
			],

	// === CONFIGURAÇÕES GLOBAIS ===
	globalSetup: "c:/Users/fjuni/ai-ysh/tests/setup/global-setup.ts",
	globalTeardown: "c:/Users/fjuni/ai-ysh/tests/setup/global-teardown.ts",

	// === CONFIGURAÇÕES DE BROWSER ===
	use: {
		// Base URL
		baseURL: "http://localhost:3000",

		// Tracing e debugging
		trace: process.env.CI ? "retain-on-failure" : "on",
		screenshot: process.env.CI ? "only-on-failure" : "on",
		video: process.env.CI ? "retain-on-failure" : "on",

		// Performance e recursos
		launchOptions: {
			args: [
				"--disable-web-security",
				"--disable-features=VizDisplayCompositor",
				"--disable-dev-shm-usage",
				"--no-sandbox",
				"--disable-setuid-sandbox",
				"--disable-accelerated-2d-canvas",
				"--no-first-run",
				"--no-zygote",
				"--disable-gpu",
				"--memory-pressure-off",
			],
			slowMo: process.env.SLOW_MO ? Number.parseInt(process.env.SLOW_MO) : 0,
		},

		// Context options
		viewport: { width: 1280, height: 720 },
		permissions: ["geolocation", "notifications"],
		geolocation: { latitude: -23.5505, longitude: -46.6333 }, // São Paulo
		locale: "pt-BR",
		timezoneId: "America/Sao_Paulo",

		// Storage state
		storageState: "c:/Users/fjuni/ai-ysh/tests/setup/storage-state.json",
	},

	// === PROJETOS DE BROWSER ===
	projects: [
		{
			name: "chromium-360",
			use: {
				...devices["Desktop Chrome"],
				launchOptions: {
					args: [
						"--disable-web-security",
						"--disable-dev-shm-usage",
						"--no-sandbox",
						"--memory-pressure-off",
						"--max_old_space_size=4096",
					],
				},
			},
		},
		{
			name: "firefox-360",
			use: {
				...devices["Desktop Firefox"],
				launchOptions: {
					args: ["--memory-pressure-off"],
				},
			},
		},
		{
			name: "webkit-360",
			use: {
				...devices["Desktop Safari"],
			},
		},
		{
			name: "mobile-chrome-360",
			use: {
				...devices["Pixel 5"],
				launchOptions: {
					args: ["--disable-web-security", "--memory-pressure-off"],
				},
			},
		},
		{
			name: "mobile-safari-360",
			use: {
				...devices["iPhone 12"],
			},
		},
	],

	// === WEBSERVER AVANÇADO ===
	webServer: {
		command: "pnpm dev",
		url: "http://localhost:3000",
		timeout: 180 * 1000,
		reuseExistingServer: !process.env.CI,
		stdout: "pipe",
		stderr: "pipe",
		ignoreHTTPSErrors: true,
	},

	// === CONFIGURAÇÕES DE METADATA ===
	metadata: {
		"test-suite": "360-degree-e2e",
		environment: process.env.NODE_ENV || "development",
		branch:
			process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || "main",
		commit: process.env.GITHUB_SHA || "local",
		timestamp: new Date().toISOString(),
		ci: !!process.env.CI,
		shard: process.env.SHARD
			? `${process.env.SHARD_CURRENT}/${process.env.SHARD_TOTAL}`
			: "1/1",
	},

	// === CONFIGURAÇÕES DE OUTPUT ===
	outputDir: "./test-results-360",
	snapshotDir: "./snapshots-360",

	// === CONFIGURAÇÕES DE GREP ===
	grep: process.env.GREP ? new RegExp(process.env.GREP) : undefined,
	grepInvert: process.env.GREP_INVERT
		? new RegExp(process.env.GREP_INVERT)
		: undefined,

	// === CONFIGURAÇÕES DE TESTE ===
	testIgnore: [
		"**/node_modules/**",
		"**/.next/**",
		"**/dist/**",
		"**/build/**",
	],
});