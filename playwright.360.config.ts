import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['360-coverage.test.ts', '360-basic.test.ts', '360-advanced.test.ts'],
  fullyParallel: false, // Desabilitar parallel para testes 360 graus
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Apenas 1 worker para testes 360 graus
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  timeout: 120 * 1000, // 2 minutos por teste
  expect: {
    timeout: 30 * 1000, // 30 segundos para expect
  },
  projects: [
    {
      name: '360-coverage-chrome',
      testMatch: /360.*\.test\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    }
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000/ping',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});