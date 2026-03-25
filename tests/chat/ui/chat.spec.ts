import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { ChatPage } from '../../../pages/ChatPage';

test.describe('Chat UI', () => {
  let loginPage: LoginPage;
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    chatPage = new ChatPage(page);

    await loginPage.goto();
    await loginPage.login('cuong', '123456');
    await loginPage.isAtDashboard();
  });

  test('should allow sending a message', async () => {
    // Arrange
    await chatPage.goto();
    await chatPage.selectConversation(0);

    const messageText = `Hello from Playwright ${Date.now()}`;

    // Act
    await chatPage.sendMessage(messageText);

    // Assert
    const messages = await chatPage.getMessages();
    expect(messages).toContain(messageText);
  });
});
