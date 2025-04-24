import {
  expect as baseExpect,
  test as baseTest,
  type BrowserContext,
} from '@playwright/test';
import { createAuthenticatedContext, type UserContext } from './auth-helper';

interface Fixtures {
  adaContext: UserContext;
  babbageContext: UserContext;
  incognitoContext: BrowserContext;
}

export const test = baseTest.extend<any, Fixtures>({
  adaContext: [
    async ({ browser }, use) => {
      const ada = await createAuthenticatedContext({
        browser,
        name: 'ada',
      });
      await use(ada);
      await ada.context.close();
    },
    { scope: 'worker' },
  ],
  babbageContext: [
    async ({ browser }, use) => {
      const babbage = await createAuthenticatedContext({
        browser,
        name: 'babbage',
      });
      await use(babbage);
      await babbage.context.close();
    },
    { scope: 'worker' },
  ],
  incognitoContext: [
    async ({ browser }, use) => {
      const incognito = await browser.newContext();
      await use(incognito);
      await incognito.close();
    },
    { scope: 'worker' },
  ],
});

export const expect = baseExpect;
