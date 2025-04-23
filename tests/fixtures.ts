import { expect as baseExpect, test as baseTest } from '@playwright/test';
import { createAuthenticatedContext, type UserContext } from './auth-helper';

interface Fixtures {
  adaContext: UserContext;
  babbageContext: UserContext;
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
});

export const expect = baseExpect;
