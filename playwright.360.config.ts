import { defineConfig, devices } from "@playwright/test";

/**
 * Configuração Playwright 360° - Testes E2E Avançados
 *
 * Configuração otimizada para máxima performance e eficácia
 * na ativação de testes end-to-end 360° abrangentes.
 */

export default defineConfig({
	// Configurações globais
	testDir: "./tests",
	outputDir: "./test-results",
	snapshotDir: "./test-results/snapshots",

	// Configuração do servidor web
	webServer: {
		command: "pnpm dev",
		url: "http://localhost:3000",
		timeout: 120 * 1000,
		reuseExistingServer: !process.env.CI,
	},

	// Configurações globais de teste
	globalSetup: "./tests/setup/global-setup.ts",
	globalTeardown: "./tests/setup/global-teardown.ts",

	// Configurações de timeout
	timeout: 30 * 1000,
	expect: {
		timeout: 5000,
	},
	use: {
		actionTimeout: 0,
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
	},

	// Estratégia de retry
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,

	// Relatórios abrangentes
	reporter: [
		["html", { outputFolder: "./playwright-report", open: "never" }],
		["json", { outputFile: "./test-results/results.json" }],
		["junit", { outputFile: "./test-results/junit.xml" }],
		["github"],
	],

	// Metadados da suíte de testes
	metadata: {
		environment: process.env.NODE_ENV || "development",
		testSuite: "360-degree-e2e",
		version: "1.0.0",
		browsers: [
			"chromium",
			"firefox",
			"webkit",
			"mobile-chrome",
			"mobile-safari",
		],
		features: [
			"authentication",
			"journey-flow",
			"artifact-management",
			"multi-agent-chat",
			"performance-monitoring",
		],
	},

	// Projetos de browser otimizados
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				launchOptions: {
					args: [
						"--no-sandbox",
						"--disable-setuid-sandbox",
						"--disable-dev-shm-usage",
						"--disable-accelerated-2d-canvas",
						"--no-first-run",
						"--no-zygote",
						"--disable-gpu",
						"--disable-web-security",
						"--disable-features=VizDisplayCompositor",
					],
				},
			},
		},

		{
			name: "firefox",
			use: {
				...devices["Desktop Firefox"],
				launchOptions: {
					args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
				},
			},
		},

		{
			name: "webkit",
			use: {
				...devices["Desktop Safari"],
				launchOptions: {
					args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
				},
			},
		},

		{
			name: "mobile-chrome",
			use: {
				...devices["Pixel 5"],
				launchOptions: {
					args: [
						"--no-sandbox",
						"--disable-setuid-sandbox",
						"--disable-dev-shm-usage",
						"--disable-accelerated-2d-canvas",
						"--no-first-run",
						"--no-zygote",
						"--disable-gpu",
					],
				},
			},
		},

		{
			name: "mobile-safari",
			use: {
				...devices["iPhone 12"],
				launchOptions: {
					args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
				},
			},
		},
	],

	// Configurações específicas para CI/CD
	...(process.env.CI && {
		workers: 4,
		shard: {
			current: Number.parseInt(process.env.SHARD_INDEX || "1"),
			total: Number.parseInt(process.env.SHARD_TOTAL || "1"),
		},
		use: {
			headless: true,
			video: "off",
			screenshot: "off",
		},
	}),

	// Filtros de teste
	grep: /360|degree/i,
	testMatch: "**/*.360.spec.ts",
	testIgnore: "**/node_modules/**",

	// Configurações de cobertura
	...(process.env.COVERAGE && {
		use: {
			trace: "on",
			screenshot: "on",
			video: "on",
		},
	}),
});
