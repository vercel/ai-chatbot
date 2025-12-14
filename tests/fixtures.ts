import { expect as baseExpect, test as baseTest } from "@playwright/test";
import { getUnixTime } from "date-fns";
import { createAuthenticatedContext, type UserContext } from "./helpers";

type Fixtures = {
  adaContext: UserContext;
  babbageContext: UserContext;
  curieContext: UserContext;
};

export const test = baseTest.extend<object, Fixtures>({
  adaContext: [
    async ({ browser }, use, workerInfo) => {
      const ada = await createAuthenticatedContext({
        browser,
        name: `ada-${workerInfo.workerIndex}-${getUnixTime(new Date())}`,
      });

      await use(ada);

      // Close all pages before closing the context to prevent hanging
      const pages = ada.context.pages();
      for (const page of pages) {
        if (!page.isClosed()) {
          try {
            await Promise.race([
              page.close(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Page close timeout")), 5_000)
              ),
            ]);
          } catch (error) {
            // If page close times out, force close without waiting for beforeunload
            console.warn(`Page close timeout, forcing close: ${error}`);
            try {
              await page.close({ runBeforeUnload: false });
            } catch {
              // Ignore errors on force close
            }
          }
        }
      }

      // Close the context with a timeout to prevent indefinite hanging
      try {
        await Promise.race([
          ada.context.close(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Context close timeout")), 10_000)
          ),
        ]);
      } catch (error) {
        console.warn(`Context close timeout or error: ${error}`);
        // Context will be garbage collected eventually
      }
    },
    { scope: "worker" },
  ],
  babbageContext: [
    async ({ browser }, use, workerInfo) => {
      const babbage = await createAuthenticatedContext({
        browser,
        name: `babbage-${workerInfo.workerIndex}-${getUnixTime(new Date())}`,
      });

      await use(babbage);

      // Close all pages before closing the context to prevent hanging
      const pages = babbage.context.pages();
      for (const page of pages) {
        if (!page.isClosed()) {
          try {
            await Promise.race([
              page.close(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Page close timeout")), 5_000)
              ),
            ]);
          } catch (error) {
            // If page close times out, force close without waiting for beforeunload
            console.warn(`Page close timeout, forcing close: ${error}`);
            try {
              await page.close({ runBeforeUnload: false });
            } catch {
              // Ignore errors on force close
            }
          }
        }
      }

      // Close the context with a timeout to prevent indefinite hanging
      try {
        await Promise.race([
          babbage.context.close(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Context close timeout")), 10_000)
          ),
        ]);
      } catch (error) {
        console.warn(`Context close timeout or error: ${error}`);
        // Context will be garbage collected eventually
      }
    },
    { scope: "worker" },
  ],
  curieContext: [
    async ({ browser }, use, workerInfo) => {
      const curie = await createAuthenticatedContext({
        browser,
        name: `curie-${workerInfo.workerIndex}-${getUnixTime(new Date())}`,
      });

      await use(curie);

      // Close all pages before closing the context to prevent hanging
      const pages = curie.context.pages();
      for (const page of pages) {
        if (!page.isClosed()) {
          try {
            await Promise.race([
              page.close(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Page close timeout")), 5_000)
              ),
            ]);
          } catch (error) {
            // If page close times out, force close without waiting for beforeunload
            console.warn(`Page close timeout, forcing close: ${error}`);
            try {
              await page.close({ runBeforeUnload: false });
            } catch {
              // Ignore errors on force close
            }
          }
        }
      }

      // Close the context with a timeout to prevent indefinite hanging
      try {
        await Promise.race([
          curie.context.close(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Context close timeout")), 10_000)
          ),
        ]);
      } catch (error) {
        console.warn(`Context close timeout or error: ${error}`);
        // Context will be garbage collected eventually
      }
    },
    { scope: "worker" },
  ],
});

export const expect = baseExpect;
