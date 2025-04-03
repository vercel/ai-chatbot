import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import { config } from 'dotenv';

config({
  path: ['.env.local', '.env.test'],
});

/**
 * Set webServer.url and use.baseURL with the location
 * of the WebServer respecting the correct set port
 */
const baseURL = `http://localhost`;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure global timeout for each test */
  timeout: 15 * 1000, // 30 seconds
  expect: {
    timeout: 15 * 1000,
  },

  /* Configure projects */
  projects: [
    {
      name: 'setup:auth',
      testMatch: /auth.setup.ts/,
    },
    {
      name: 'setup:reasoning',
      testMatch: /reasoning.setup.ts/,
      dependencies: ['setup:auth'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `${baseURL}:3000`,
        storageState: 'playwright/.auth/session.json',
      },
    },
    {
      name: 'chat',
      testMatch: /chat.test.ts/,
      dependencies: ['setup:auth'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `${baseURL}:3000`,
        storageState: 'playwright/.auth/session.json',
      },
    },
    {
      name: 'chat (guest)',
      testMatch: /chat.guest.test.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `${baseURL}:3001`,
      },
    },
    {
      name: 'reasoning',
      testMatch: /reasoning.test.ts/,
      dependencies: ['setup:reasoning'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.reasoning/session.json',
        baseURL: `${baseURL}:3000`,
      },
    },
    {
      name: 'artifacts',
      testMatch: /artifacts.test.ts/,
      dependencies: ['setup:auth'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `${baseURL}:3000`,
        storageState: 'playwright/.auth/session.json',
      },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'pnpm dev --port=3000',
      url: `${baseURL}:3000`,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'export ALLOW_GUEST_USAGE=True && pnpm dev --port=3001',
      url: `${baseURL}:3001`,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
