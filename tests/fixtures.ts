import fs from 'node:fs'; // Added
import path from 'node:path'; // Added
import { expect as baseExpect, test as baseTest } from '@playwright/test';
import { createAuthenticatedContext, type UserContext } from './helpers';
import { getUnixTime } from 'date-fns';

interface Fixtures {
  adaContext: UserContext;
  babbageContext: UserContext;
  curieContext: UserContext;
  adminUserContext: UserContext; // Added admin context
}

// Helper function for admin login (subset of createAuthenticatedContext)
async function loginAsUser({
  browser,
  email,
  password,
  storageStatePath,
}: {
  browser: Browser;
  email: string;
  password: string;
  storageStatePath: string;
}): Promise<UserContext> {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:3000/login');
  await page.getByPlaceholder('user@acme.com').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for successful login, e.g., by checking for a known element on the dashboard or a toast
  // For now, assuming login redirects or shows a clear success state.
  // A more robust check would be page.waitForURL('/') or similar if login redirects to home.
  await page.waitForTimeout(2000); // Simple wait, replace with more robust check

  await context.storageState({ path: storageStatePath });
  await page.close();

  const newContext = await browser.newContext({ storageState: storageStatePath });
  const newPage = await newContext.newPage();
  return {
    context: newContext,
    page: newPage,
    request: newContext.request,
  };
}


export const test = baseTest.extend<{}, Fixtures>({
  adaContext: [
    async ({ browser }, use, workerInfo) => {
      const ada = await createAuthenticatedContext({
        browser,
        name: `ada-${workerInfo.workerIndex}-${getUnixTime(new Date())}`,
      });

      await use(ada);
      await ada.context.close();
    },
    { scope: 'worker' },
  ],
  babbageContext: [
    async ({ browser }, use, workerInfo) => {
      const babbage = await createAuthenticatedContext({
        browser,
        name: `babbage-${workerInfo.workerIndex}-${getUnixTime(new Date())}`,
      });

      await use(babbage);
      await babbage.context.close();
    },
    { scope: 'worker' },
  ],
  curieContext: [
    async ({ browser }, use, workerInfo) => {
      const curie = await createAuthenticatedContext({
        browser,
        name: `curie-${workerInfo.workerIndex}-${getUnixTime(new Date())}`,
        chatModel: 'chat-model-reasoning',
      });

      await use(curie);
      await curie.context.close();
    },
    { scope: 'worker' },
  ],
  adminUserContext: [
    async ({ browser }, use, workerInfo) => {
      const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin-test@playwright.com';
      const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'password123'; // Store actual password securely

      const directory = path.join(__dirname, '../playwright/.sessions');
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      const storageFile = path.join(directory, `admin-${workerInfo.workerIndex}.json`);

      // Note: This admin user (adminEmail) MUST exist in the database and have isAdmin=true.
      // This fixture only attempts to log in, not create or grant admin rights.
      const admin = await loginAsUser({
        browser,
        email: adminEmail,
        password: adminPassword,
        storageStatePath: storageFile,
      });
      await use(admin);
      await admin.context.close();
    },
    { scope: 'worker' },
  ],
});

export const expect = baseExpect;
