import { expect, type Page } from "@playwright/test";

const CHAT_ID_REGEX =
  /^http:\/\/localhost:3000\/chat\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export class ChatPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get sendButton() {
    return this.page.getByTestId("send-button");
  }

  get stopButton() {
    return this.page.getByTestId("stop-button");
  }

  get multimodalInput() {
    return this.page.getByTestId("multimodal-input");
  }

  get messagesContainer() {
    return this.page.locator("[data-testid='messages-container']");
  }

  async goto() {
    await this.page.goto("/");
    await this.page.waitForLoadState("networkidle");
  }

  async createNewChat() {
    await this.goto();
  }

  getCurrentURL(): string {
    return this.page.url();
  }

  async sendUserMessage(message: string) {
    await this.multimodalInput.click();
    await this.multimodalInput.fill(message);
    await this.sendButton.click();
  }

  async waitForResponse(timeout = 30_000) {
    const response = await this.page.waitForResponse(
      (res) => res.url().includes("/api/chat") && res.status() === 200,
      { timeout }
    );
    await response.finished();
  }

  async isGenerationComplete(timeout = 30_000) {
    await this.waitForResponse(timeout);
    await this.page.waitForTimeout(500);
  }

  async hasChatIdInUrl() {
    await expect(this.page).toHaveURL(CHAT_ID_REGEX);
  }

  async getAssistantMessages() {
    return await this.page.getByTestId("message-assistant").all();
  }

  async getUserMessages() {
    return await this.page.getByTestId("message-user").all();
  }

  async getLastAssistantMessageContent(): Promise<string | null> {
    const messages = await this.getAssistantMessages();
    const lastMessage = messages.at(-1);
    if (!lastMessage) {
      return null;
    }
    const content = await lastMessage
      .getByTestId("message-content")
      .innerText();
    return content;
  }

  async getLastUserMessageContent(): Promise<string | null> {
    const messages = await this.getUserMessages();
    const lastMessage = messages.at(-1);
    if (!lastMessage) {
      return null;
    }
    const content = await lastMessage
      .getByTestId("message-content")
      .innerText();
    return content;
  }

  async isElementVisible(testId: string) {
    await expect(this.page.getByTestId(testId)).toBeVisible();
  }

  async isElementNotVisible(testId: string) {
    await expect(this.page.getByTestId(testId)).not.toBeVisible();
  }

  async expectToastToContain(text: string) {
    await expect(this.page.getByTestId("toast")).toContainText(text);
  }

  async waitForInputToBeReady() {
    await expect(this.multimodalInput).toBeVisible();
    await expect(this.sendButton).toBeVisible();
  }
}
