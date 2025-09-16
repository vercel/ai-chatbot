import { ChatPage } from '../pages/chat';
import { test, expect } from '../fixtures';

test.describe('chat activity with reasoning', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ curieContext }) => {
    chatPage = new ChatPage(curieContext.page);
    await chatPage.createNewChat();
  });

  test('Curie can send message and generate response with reasoning', async () => {
    await chatPage.sendUserMessage('Why is the sky blue?');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toBe("It's just blue duh!");

    expect(assistantMessage.reasoning).toContain(
      'The sky is blue because of rayleigh scattering!',
    );
  });

  test('Curie can toggle reasoning visibility', async () => {
    await chatPage.sendUserMessage('Why is the sky blue?');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    const reasoningElement =
      assistantMessage.element.getByTestId('message-reasoning');
    await expect(reasoningElement).toBeVisible();

    await assistantMessage.element
      .getByTestId('message-reasoning-toggle')
      .waitFor({ state: 'visible' });
    await assistantMessage.toggleReasoningVisibility();
    await expect(reasoningElement).toHaveAttribute('data-state', 'closed');

    await assistantMessage.toggleReasoningVisibility();
    await expect(reasoningElement).toHaveAttribute('data-state', 'open');
  });

  test('Curie can edit message and resubmit', async () => {
    await chatPage.sendUserMessage('Why is the sky blue?');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    const reasoningElement =
      assistantMessage.element.getByTestId('message-reasoning');
    expect(reasoningElement).toBeVisible();

    const userMessage = await chatPage.getRecentUserMessage();

    await userMessage.edit('Why is grass green?');
    await chatPage.isGenerationComplete();

    const updatedAssistantMessage = await chatPage.getRecentAssistantMessage();

    expect(updatedAssistantMessage.content).toBe("It's just green duh!");

    expect(updatedAssistantMessage.reasoning).toContain(
      'Grass is green because of chlorophyll absorption!',
    );
  });
});
