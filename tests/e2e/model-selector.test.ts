import { expect, test } from "@playwright/test";
import { ChatPage } from "../pages/chat";

test.describe("Model Selector", () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.createNewChat();
  });

  test("displays default model on load", async ({ page }) => {
    const modelButton = page.locator("button").filter({ hasText: /Gemini|Claude|GPT/i }).first();
    await expect(modelButton).toBeVisible();
  });

  test("opens model selector on click", async ({ page }) => {
    const modelButton = page.locator("button").filter({ hasText: /Gemini|Claude|GPT/i }).first();
    await modelButton.click();
    await expect(page.getByPlaceholder("Search models...")).toBeVisible();
  });

  test("can search for models", async ({ page }) => {
    const modelButton = page.locator("button").filter({ hasText: /Gemini|Claude|GPT/i }).first();
    await modelButton.click();
    await page.getByPlaceholder("Search models...").fill("Claude");
    await expect(page.getByText("Claude", { exact: false })).toBeVisible();
  });

  test("can select a different model", async ({ page }) => {
    const modelButton = page.locator("button").filter({ hasText: /Gemini|Claude|GPT/i }).first();
    await modelButton.click();

    const modelOption = page.getByRole("option").first();
    const modelName = await modelOption.innerText();
    await modelOption.click();

    await expect(page.locator("button").filter({ hasText: modelName.split("\n")[0] })).toBeVisible();
  });
});

