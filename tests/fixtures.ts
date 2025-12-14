import { expect as baseExpect, test as baseTest } from "@playwright/test";
import { getUnixTime } from "date-fns";
import { createAuthenticatedContext, type UserContext } from "./helpers";

type Fixtures = {
  authenticatedContext: UserContext;
};

export const test = baseTest.extend<object, Fixtures>({
  authenticatedContext: [
    async ({ browser }, use, workerInfo) => {
      const userContext = await createAuthenticatedContext({
        browser,
        name: `user-${workerInfo.workerIndex}-${getUnixTime(new Date())}`,
      });

      await use(userContext);
      await userContext.context.close();
    },
    { scope: "worker" },
  ],
});

export const expect = baseExpect;
