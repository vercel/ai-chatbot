import { expect as baseExpect, test as baseTest } from "@playwright/test";
import { ChatPage } from "./pages/chat";

type Fixtures = {
  chatPage: ChatPage;
};

export const test = baseTest.extend<Fixtures>({
  chatPage: async ({ page }, use) => {
    const chatPage = new ChatPage(page);
    await use(chatPage);
  },
});

export const expect = baseExpect;
