import { useAssistant } from '@ai-sdk/react';
import { ChatPage } from './pages/chat';
import { test, expect } from '@playwright/test';

test.describe('chat activity with reasoning', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.createNewChat();
  });

  test('send user message and generate response with reasoning', async () => {
    await chatPage.sendUserMessage('why is the sky blue?');
    await chatPage.waitForMessageGeneration();

    const assistantMessage = await chatPage.getRecentAssistantMessage();

    expect(assistantMessage.content).toBe("it's just blue duh!");

    expect(assistantMessage.reasoning).toBe(
      'the sky is blue because of rayleigh scattering!',
    );
  });

  test('toggle reasoning visibility', async () => {
    await chatPage.sendUserMessage('why is the sky blue?');
    await chatPage.waitForMessageGeneration();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    const reasoningElement =
      assistantMessage.element.getByTestId('message-reasoning');
    expect(reasoningElement).toBeVisible();

    await assistantMessage.toggleReasoningVisibility();
    await expect(reasoningElement).not.toBeVisible();

    await assistantMessage.toggleReasoningVisibility();
    await expect(reasoningElement).toBeVisible();
  });

  test('edit message and resubmit', async () => {
    await chatPage.sendUserMessage('why is the sky blue?');
    await chatPage.waitForMessageGeneration();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    const reasoningElement =
      assistantMessage.element.getByTestId('message-reasoning');
    expect(reasoningElement).toBeVisible();

    const userMessage = await chatPage.getRecentUserMessage();

    await userMessage.edit('why is grass green?');
    await chatPage.waitForMessageGeneration();

    const updatedAssistantMessage = await chatPage.getRecentAssistantMessage();

    expect(updatedAssistantMessage.content).toBe("it's just green duh!");

    expect(updatedAssistantMessage.reasoning).toBe(
      'grass is green because of chlorophyll absorption!',
    );
  });
});
