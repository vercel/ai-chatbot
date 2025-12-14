import { expect, test } from "@playwright/test";
import { ChatPage } from "../pages/chat";

test.describe("Sidebar", () => {
  test("can toggle sidebar open and closed", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.createNewChat();

    const toggleButton = page.getByTestId("sidebar-toggle-button");
    const sidebar = page.getByTestId("sidebar");

    await toggleButton.click();
    await expect(sidebar).toBeVisible();

    await toggleButton.click();
    await expect(sidebar).not.toBeVisible();
  });

  test("shows chat in history after sending message", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.createNewChat();
    await chatPage.sendUserMessage("Test message for history");
    await chatPage.isGenerationComplete();

    const toggleButton = page.getByTestId("sidebar-toggle-button");
    await toggleButton.click();

    const historyItem = page.getByTestId("sidebar-chat-item").first();
    await expect(historyItem).toBeVisible();
  });

  test("can navigate to chat from history", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.createNewChat();
    await chatPage.sendUserMessage("First chat message");
    await chatPage.isGenerationComplete();

    const firstChatUrl = page.url();

    await page.goto("/");

    const toggleButton = page.getByTestId("sidebar-toggle-button");
    await toggleButton.click();

    const historyItem = page.getByTestId("sidebar-chat-item").first();
    await historyItem.click();

    await expect(page).toHaveURL(firstChatUrl);
  });

  test("can delete chat from history", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.createNewChat();
    await chatPage.sendUserMessage("Chat to delete");
    await chatPage.isGenerationComplete();

    const toggleButton = page.getByTestId("sidebar-toggle-button");
    await toggleButton.click();

    const historyItem = page.getByTestId("sidebar-chat-item").first();
    await historyItem.hover();

    const deleteButton = page.getByTestId("sidebar-chat-delete").first();
    await deleteButton.click();

    const confirmButton = page.getByRole("button", { name: "Delete" });
    await confirmButton.click();

    await expect(page.getByTestId("toast")).toContainText("deleted");
  });

  test("can create new chat from sidebar", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.createNewChat();
    await chatPage.sendUserMessage("Initial message");
    await chatPage.isGenerationComplete();

    const newChatButton = page.getByTestId("sidebar-new-chat");
    await newChatButton.click();

    await expect(page).toHaveURL("/");
    await expect(page.getByTestId("multimodal-input")).toBeEmpty();
  });
});

