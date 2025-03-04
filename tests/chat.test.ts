import fs from 'fs';
import path from 'path';
import { test, expect, Page } from '@playwright/test';

class ChatPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  public getCurrentURL(): string {
    return this.page.url();
  }

  async sendUserMessage(message: string) {
    await this.page.getByTestId('multimodal-input').click();
    await this.page.getByTestId('multimodal-input').fill(message);
    await this.page.getByTestId('send-button').click();
    await this.page.getByTestId('message-user-0').isVisible();
    expect(await this.page.getByTestId('message-user-0').innerText()).toContain(
      message,
    );
  }

  async getAssistantResponse() {
    return this.page.getByTestId('message-assistant-1').innerText();
  }

  async isGenerationComplete() {
    await expect(this.page.getByTestId('send-button')).toBeVisible();
    await this.page.waitForTimeout(2000);
  }

  async hasChatIdInUrl() {
    await expect(this.page).toHaveURL(
      /^http:\/\/localhost:3000\/chat\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  }

  async sendUserMessageFromSuggestion() {
    await this.page
      .getByRole('button', { name: 'What are the advantages of' })
      .click();
  }

  async editAndResendUserMessage(message: string) {
    await this.page.getByTestId('edit-user-0').click();
    await this.page.getByTestId('message-editor').fill(message);
    await this.page.getByTestId('message-editor-send-button').click();
    await this.page.getByTestId('message-user-0').isVisible();
    await expect(
      this.page.getByTestId('message-editor-send-button'),
    ).not.toBeVisible();
    expect(await this.page.getByTestId('message-user-0').innerText()).toContain(
      message,
    );
  }

  async isElementVisible(elementId: string) {
    await expect(this.page.getByTestId(elementId)).toBeVisible();
  }

  async isElementNotVisible(elementId: string) {
    await expect(this.page.getByTestId(elementId)).not.toBeVisible();
  }

  async addImageAttachment() {
    this.page.on('filechooser', async (fileChooser) => {
      const filePath = path.join(
        process.cwd(),
        'public',
        'images',
        'mouth of the seine, monet.jpg',
      );
      const imageBuffer = fs.readFileSync(filePath);

      await fileChooser.setFiles({
        name: 'mouth of the seine, monet.jpg',
        mimeType: 'image/jpeg',
        buffer: imageBuffer,
      });
    });

    await this.page.getByTestId('attachments-button').click();
  }

  public get sendButton() {
    return this.page.getByTestId('send-button');
  }

  public get stopButton() {
    return this.page.getByTestId('stop-button');
  }

  public get multimodalInput() {
    return this.page.getByTestId('multimodal-input');
  }
}

test.describe('chat activity', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto();
  });

  test('send a user message and receive response', async () => {
    await chatPage.sendUserMessage('why is grass green?');
    await chatPage.isGenerationComplete();
    expect(await chatPage.getAssistantResponse()).toContain(
      "it's just green duh!",
    );
  });

  test('redirect to /chat/:id after submitting message', async () => {
    await chatPage.sendUserMessage('why is grass green?');
    await chatPage.isGenerationComplete();
    expect(await chatPage.getAssistantResponse()).toContain(
      "it's just green duh!",
    );
    await chatPage.hasChatIdInUrl();
  });

  test('send a user message from suggestion', async () => {
    await chatPage.sendUserMessageFromSuggestion();
    await chatPage.isGenerationComplete();
    expect(await chatPage.getAssistantResponse()).toContain(
      'with next.js you can ship fast!',
    );
  });

  test('toggle between send/stop button based on activity', async () => {
    await expect(chatPage.sendButton).toBeVisible();
    await expect(chatPage.sendButton).toBeDisabled();

    await chatPage.sendUserMessage('why is grass green?');

    await expect(chatPage.sendButton).not.toBeVisible();
    await expect(chatPage.stopButton).toBeVisible();

    await chatPage.isGenerationComplete();

    await expect(chatPage.stopButton).not.toBeVisible();
    await expect(chatPage.sendButton).toBeVisible();
  });

  test('stop generation during submission', async () => {
    await chatPage.sendUserMessage('why is grass green?');
    await chatPage.stopButton.click();
    await expect(chatPage.sendButton).toBeVisible();
  });

  test('edit user message and resubmit', async () => {
    await chatPage.sendUserMessage('why is grass green?');
    await chatPage.isGenerationComplete();

    expect(await chatPage.getAssistantResponse()).toContain(
      "it's just green duh!",
    );

    await chatPage.editAndResendUserMessage('why is the sky blue?');
    await chatPage.isGenerationComplete();

    expect(await chatPage.getAssistantResponse()).toContain(
      "it's just blue duh!",
    );
  });

  test('hide suggested actions after sending message', async () => {
    await chatPage.isElementVisible('suggested-actions');
    await chatPage.sendUserMessageFromSuggestion();
    await chatPage.isElementNotVisible('suggested-actions');
  });

  test('handle file upload and send image attachment with message', async () => {
    await chatPage.addImageAttachment();

    await chatPage.isElementVisible('attachments-preview');
    await chatPage.isElementVisible('input-attachment-loader');
    await chatPage.isElementNotVisible('input-attachment-loader');

    await chatPage.sendUserMessage('who painted this?');
    await chatPage.isElementVisible('message-attachments-0');

    await chatPage.isGenerationComplete();

    await chatPage.isElementVisible('message-assistant-1');
    expect(await chatPage.getAssistantResponse()).toContain(
      'this painting is by monet!',
    );
  });
});
