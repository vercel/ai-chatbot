import fs from "node:fs";
import path from "node:path";
import {
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  expect,
  type Page,
} from "@playwright/test";
import { generateId } from "ai";
import { getUnixTime } from "date-fns";
import { ChatPage } from "./pages/chat";

export type UserContext = {
  context: BrowserContext;
  page: Page;
  request: APIRequestContext;
};

export async function createAuthenticatedContext({
  browser,
  name,
}: {
  browser: Browser;
  name: string;
}): Promise<UserContext> {
  const directory = path.join(__dirname, "../playwright/.sessions");

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const storageFile = path.join(directory, `${name}.json`);

  const context = await browser.newContext();
  const page = await context.newPage();

  const email = `test-${name}@playwright.com`;
  const password = `${generateId()}!234`;
  const port = process.env.PORT || 3001;

  // Navigate to register page with timeout and wait for DOM to be ready
  await page.goto(`http://localhost:${port}/register`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000, // 30 second timeout
  });

  // Wait for the form to be visible before proceeding
  await page.waitForSelector('input[placeholder="user@acme.com"]', {
    timeout: 10_000,
  });
  await page.getByPlaceholder("user@acme.com").click();
  await page.getByPlaceholder("user@acme.com").fill(email);
  await page.getByLabel("Password").click();
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign Up" }).click();

  await expect(page.getByTestId("toast")).toContainText(
    "Account created successfully!"
  );

  const chatPage = new ChatPage(page);
  await chatPage.createNewChat();
  await chatPage.chooseModelFromSelector("chat-model-reasoning");
  await expect(chatPage.getSelectedModel()).resolves.toEqual(
    "GPT-5-mini (with reasoning)"
  );

  await page.waitForTimeout(1000);
  await context.storageState({ path: storageFile });

  // Close the page before closing the context
  await page.close();

  // Close all pages in the context to ensure clean teardown
  const pages = context.pages();
  for (const p of pages) {
    if (!p.isClosed()) {
      await p.close();
    }
  }

  const newContext = await browser.newContext({ storageState: storageFile });
  const newPage = await newContext.newPage();

  return {
    context: newContext,
    page: newPage,
    request: newContext.request,
  };
}

export function generateRandomTestUser() {
  const email = `test-${getUnixTime(new Date())}@playwright.com`;
  const password = `${generateId()}!234`;

  return {
    email,
    password,
  };
}
