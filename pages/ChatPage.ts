import { Page } from '@playwright/test';

export class ChatPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/messages');
  }

  async selectConversation(index: number = 0) {
    await this.page.locator('[data-test-id="chat-conv-item"]').nth(index).click();
  }

  async sendMessage(text: string) {
    await this.page.getByTestId('chat-message-input').fill(text);
    await this.page.getByTestId('chat-send-btn').click();
  }

  async getMessages() {
    return this.page.locator('.message-bubble').allTextContents();
  }
}
