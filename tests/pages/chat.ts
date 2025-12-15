import type { Page } from "@playwright/test";

const MODEL_BUTTON_REGEX = /Gemini|Claude|GPT|Grok/i;

export class ChatPage {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/");
  }

  async createNewChat() {
    await this.page.goto("/");
    await this.page.waitForSelector("[data-testid='multimodal-input']");
  }

  getInput() {
    return this.page.getByTestId("multimodal-input");
  }

  async typeMessage(message: string) {
    const input = this.getInput();
    await input.fill(message);
  }

  async sendMessage() {
    await this.page.getByTestId("send-button").click();
  }

  async sendUserMessage(message: string) {
    await this.typeMessage(message);
    await this.sendMessage();
  }

  getSendButton() {
    return this.page.getByTestId("send-button");
  }

  getStopButton() {
    return this.page.getByTestId("stop-button");
  }

  async clickSuggestedAction(index = 0) {
    const suggestions = this.page.locator(
      "[data-testid='suggested-actions'] button"
    );
    await suggestions.nth(index).click();
  }

  async openModelSelector() {
    const modelButton = this.page
      .locator("button")
      .filter({ hasText: MODEL_BUTTON_REGEX })
      .first();
    await modelButton.click();
  }

  async selectModel(modelName: string) {
    await this.openModelSelector();
    await this.page.getByText(modelName).first().click();
  }

  async searchModels(query: string) {
    await this.openModelSelector();
    await this.page.getByPlaceholder("Search models...").fill(query);
  }
}
