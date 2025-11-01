import fs from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";
import { chatModels } from "@/lib/ai/models";

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

  get scrollContainer() {
    return this.page.locator(".overflow-y-scroll");
  }

  get scrollToBottomButton() {
    return this.page.getByTestId("scroll-to-bottom-button");
  }

  async createNewChat() {
    await this.page.goto("/");
  }

  getCurrentURL(): string {
    return this.page.url();
  }

  async sendUserMessage(message: string) {
    await this.multimodalInput.click();
    await this.multimodalInput.fill(message);
    await this.sendButton.click();
  }

  async isGenerationComplete() {
    const response = await this.page.waitForResponse((currentResponse) =>
      currentResponse.url().includes("/api/chat")
    );

    await response.finished();
  }

  async isVoteComplete() {
    const response = await this.page.waitForResponse((currentResponse) =>
      currentResponse.url().includes("/api/vote")
    );

    await response.finished();
  }

  async hasChatIdInUrl() {
    await expect(this.page).toHaveURL(CHAT_ID_REGEX);
  }

  async sendUserMessageFromSuggestion() {
    await this.page
      .getByRole("button", { name: "What are the advantages of" })
      .click();
  }

  async isElementVisible(elementId: string) {
    await expect(this.page.getByTestId(elementId)).toBeVisible();
  }

  async isElementNotVisible(elementId: string) {
    await expect(this.page.getByTestId(elementId)).not.toBeVisible();
  }

  async addImageAttachment() {
    this.page.on("filechooser", async (fileChooser) => {
      const filePath = path.join(
        process.cwd(),
        "public",
        "images",
        "mouth of the seine, monet.jpg"
      );
      const imageBuffer = fs.readFileSync(filePath);

      await fileChooser.setFiles({
        name: "mouth of the seine, monet.jpg",
        mimeType: "image/jpeg",
        buffer: imageBuffer,
      });
    });

    await this.page.getByTestId("attachments-button").click();
  }

  async getSelectedModel() {
    const modelId = await this.page.getByTestId("model-selector").innerText();
    return modelId;
  }

  async chooseModelFromSelector(chatModelId: string) {
    const chatModel = chatModels.find(
      (currentChatModel) => currentChatModel.id === chatModelId
    );

    if (!chatModel) {
      throw new Error(`Model with id ${chatModelId} not found`);
    }

    await this.page.getByTestId("model-selector").click();
    await this.page.getByTestId(`model-selector-item-${chatModelId}`).click();
    expect(await this.getSelectedModel()).toBe(chatModel.name);
  }

  async getSelectedVisibility() {
    const visibilityId = await this.page
      .getByTestId("visibility-selector")
      .innerText();
    return visibilityId;
  }

  async chooseVisibilityFromSelector(chatVisibility: "public" | "private") {
    await this.page.getByTestId("visibility-selector").click();
    await this.page
      .getByTestId(`visibility-selector-item-${chatVisibility}`)
      .click();
    expect(await this.getSelectedVisibility()).toBe(chatVisibility);
  }

  async getRecentAssistantMessage() {
    const messageElements = await this.page
      .getByTestId("message-assistant")
      .all();
    const lastMessageElement = messageElements.at(-1);

    if (!lastMessageElement) {
      return null;
    }

    const content = await lastMessageElement
      .getByTestId("message-content")
      .innerText()
      .catch(() => null);

    const reasoningElement = await lastMessageElement
      .getByTestId("message-reasoning")
      .isVisible()
      .then(async (visible) =>
        visible
          ? await lastMessageElement
              .getByTestId("message-reasoning")
              .innerText()
          : null
      )
      .catch(() => null);

    return {
      element: lastMessageElement,
      content,
      reasoning: reasoningElement,
      async toggleReasoningVisibility() {
        await lastMessageElement
          .getByTestId("message-reasoning-toggle")
          .click();
      },
      async upvote() {
        await lastMessageElement.getByTestId("message-upvote").click();
      },
      async downvote() {
        await lastMessageElement.getByTestId("message-downvote").click();
      },
    };
  }

  async getRecentUserMessage() {
    const messageElements = await this.page.getByTestId("message-user").all();
    const lastMessageElement = messageElements.at(-1);

    if (!lastMessageElement) {
      throw new Error("No user message found");
    }

    const content = await lastMessageElement
      .getByTestId("message-content")
      .innerText()
      .catch(() => null);

    const hasAttachments = await lastMessageElement
      .getByTestId("message-attachments")
      .isVisible()
      .catch(() => false);

    const attachments = hasAttachments
      ? await lastMessageElement.getByTestId("message-attachments").all()
      : [];

    const page = this.page;

    return {
      element: lastMessageElement,
      content,
      attachments,
      async edit(newMessage: string) {
        await page.getByTestId("message-edit-button").click();
        await page.getByTestId("message-editor").fill(newMessage);
        await page.getByTestId("message-editor-send-button").click();
        await expect(
          page.getByTestId("message-editor-send-button")
        ).not.toBeVisible();
      },
    };
  }

  async expectToastToContain(text: string) {
    await expect(this.page.getByTestId("toast")).toContainText(text);
  }

  async openSideBar() {
    const sidebarToggleButton = this.page.getByTestId("sidebar-toggle-button");
    await sidebarToggleButton.click();
  }

  isScrolledToBottom(): Promise<boolean> {
    return this.scrollContainer.evaluate(
      (el) => Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 1
    );
  }

  async waitForScrollToBottom(timeout = 5000): Promise<void> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      if (await this.isScrolledToBottom()) {
        return;
      }
      await this.page.waitForTimeout(100);
    }

    throw new Error(`Timed out waiting for scroll bottom after ${timeout}ms`);
  }

  async sendMultipleMessages(
    count: number,
    makeMessage: (i: number) => string
  ) {
    for (let i = 0; i < count; i++) {
      await this.sendUserMessage(makeMessage(i));
      await this.isGenerationComplete();
    }
  }

  async scrollToTop(): Promise<void> {
    await this.scrollContainer.evaluate((element) => {
      element.scrollTop = 0;
    });
  }
}
