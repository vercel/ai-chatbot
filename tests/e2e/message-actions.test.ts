import { expect, test } from "@playwright/test";
import { ChatPage } from "../pages/chat";

test.describe("Message Actions", () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.createNewChat();
    await chatPage.sendUserMessage("Hello");
    await chatPage.isGenerationComplete();
  });

  test("can upvote a message", async ({ page }) => {
    const upvoteButton = page.getByTestId("message-upvote").first();
    await upvoteButton.click();
    await expect(upvoteButton).toHaveAttribute("data-state", "active");
  });

  test("can downvote a message", async ({ page }) => {
    const downvoteButton = page.getByTestId("message-downvote").first();
    await downvoteButton.click();
    await expect(downvoteButton).toHaveAttribute("data-state", "active");
  });

  test("can copy message content", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const copyButton = page.getByTestId("message-copy").first();
    await copyButton.click();

    const clipboardContent = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardContent.length).toBeGreaterThan(0);
  });

  test("can edit user message", async ({ page }) => {
    const editButton = page.getByTestId("message-edit-button").first();
    await editButton.click();

    const editor = page.getByTestId("message-editor");
    await expect(editor).toBeVisible();
    await editor.fill("Updated message");

    const sendButton = page.getByTestId("message-editor-send-button");
    await sendButton.click();

    await chatPage.isGenerationComplete();
    const userContent = await chatPage.getLastUserMessageContent();
    expect(userContent).toBe("Updated message");
  });
});

