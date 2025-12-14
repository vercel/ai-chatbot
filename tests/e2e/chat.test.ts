import { expect, test } from "@playwright/test";
import { ChatPage } from "../pages/chat";

test.describe("Chat", () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.createNewChat();
  });

  test("page loads with input ready", async () => {
    await chatPage.waitForInputToBeReady();
  });

  test("send button is disabled when input is empty", async () => {
    await expect(chatPage.sendButton).toBeDisabled();
  });

  test("send button is enabled when input has text", async () => {
    await chatPage.multimodalInput.fill("Hello");
    await expect(chatPage.sendButton).toBeEnabled();
  });

  test("can send a message and receive a response", async () => {
    await chatPage.sendUserMessage("Hello");
    await chatPage.isGenerationComplete();

    const userContent = await chatPage.getLastUserMessageContent();
    expect(userContent).toBe("Hello");

    const assistantContent = await chatPage.getLastAssistantMessageContent();
    expect(assistantContent).toBeTruthy();
  });

  test("redirects to /chat/:id after sending message", async () => {
    await chatPage.sendUserMessage("Hello");
    await chatPage.isGenerationComplete();
    await chatPage.hasChatIdInUrl();
  });

  test("shows stop button during generation", async () => {
    await chatPage.multimodalInput.fill("Hello");
    await chatPage.sendButton.click();
    await expect(chatPage.stopButton).toBeVisible({ timeout: 5000 });
  });

  test("can stop generation", async () => {
    await chatPage.multimodalInput.fill("Hello");
    await chatPage.sendButton.click();
    await expect(chatPage.stopButton).toBeVisible({ timeout: 5000 });
    await chatPage.stopButton.click();
    await expect(chatPage.sendButton).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Chat - Guest User", () => {
  test("can use chat as guest", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.createNewChat();
    await chatPage.waitForInputToBeReady();
    await chatPage.sendUserMessage("Hello");
    await chatPage.isGenerationComplete();

    const content = await chatPage.getLastAssistantMessageContent();
    expect(content).toBeTruthy();
  });
});
