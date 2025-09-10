import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/e2e",
	testMatch: ["360-memory-profiling.test.ts"],
	use: {
		baseURL: "http://localhost:3000",
	},
	webServer: {
		command: "pnpm dev",
		url: "http://localhost:3000",
	},
});
