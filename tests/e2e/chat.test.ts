import { ChatPage } from '../pages/chat';
import { test, expect } from '@playwright/test';

test.describe('chat activity', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.createNewChat();
  });

  test('send a user message and receive response', async () => {
    await chatPage.sendUserMessage('Why is grass green?');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toContain("It's just green duh!");
  });

  test('redirect to /chat/:id after submitting message', async () => {
    await chatPage.sendUserMessage('Why is grass green?');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toContain("It's just green duh!");
    await chatPage.hasChatIdInUrl();
  });

  test('send a user message from suggestion', async () => {
    await chatPage.sendUserMessageFromSuggestion();
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toContain(
      'With Next.js, you can ship fast!',
    );
  });

  test('toggle between send/stop button based on activity', async () => {
    await expect(chatPage.sendButton).toBeVisible();
    await expect(chatPage.sendButton).toBeDisabled();

    await chatPage.sendUserMessage('Why is grass green?');

    await expect(chatPage.sendButton).not.toBeVisible();
    await expect(chatPage.stopButton).toBeVisible();

    await chatPage.isGenerationComplete();

    await expect(chatPage.stopButton).not.toBeVisible();
    await expect(chatPage.sendButton).toBeVisible();
  });

  test('stop generation during submission', async () => {
    await chatPage.sendUserMessage('Why is grass green?');
    await expect(chatPage.stopButton).toBeVisible();
    await chatPage.stopButton.click();
    await expect(chatPage.sendButton).toBeVisible();
  });

  test('edit user message and resubmit', async () => {
    await chatPage.sendUserMessage('Why is grass green?');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toContain("It's just green duh!");

    const userMessage = await chatPage.getRecentUserMessage();
    await userMessage.edit('Why is the sky blue?');

    await chatPage.isGenerationComplete();

    const updatedAssistantMessage = await chatPage.getRecentAssistantMessage();
    expect(updatedAssistantMessage.content).toContain("It's just blue duh!");
  });

  test('hide suggested actions after sending message', async () => {
    await chatPage.isElementVisible('suggested-actions');
    await chatPage.sendUserMessageFromSuggestion();
    await chatPage.isElementNotVisible('suggested-actions');
  });

  test('upload file and send image attachment with message', async () => {
    await chatPage.addImageAttachment();

    await chatPage.isElementVisible('attachments-preview');
    await chatPage.isElementVisible('input-attachment-loader');
    await chatPage.isElementNotVisible('input-attachment-loader');

    await chatPage.sendUserMessage('Who painted this?');

    const userMessage = await chatPage.getRecentUserMessage();
    expect(userMessage.attachments).toHaveLength(1);

    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toBe('This painting is by Monet!');
  });

  test('call weather tool', async () => {
    await chatPage.sendUserMessage("What's the weather in sf?");
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();

    expect(assistantMessage.content).toBe(
      'The current temperature in San Francisco is 17°C.',
    );
  });

  test('upvote message', async () => {
    await chatPage.sendUserMessage('Why is the sky blue?');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    await assistantMessage.upvote();
    await chatPage.isVoteComplete();
  });

  test('downvote message', async () => {
    await chatPage.sendUserMessage('Why is the sky blue?');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    await assistantMessage.downvote();
    await chatPage.isVoteComplete();
  });

  test('update vote', async () => {
    await chatPage.sendUserMessage('Why is the sky blue?');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    await assistantMessage.upvote();
    await chatPage.isVoteComplete();

    await assistantMessage.downvote();
    await chatPage.isVoteComplete();
  });
});
