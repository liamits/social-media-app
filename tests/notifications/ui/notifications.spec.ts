import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { NotificationsPage } from '../../../pages/NotificationsPage';

test.describe('Notifications UI', () => {
  let loginPage: LoginPage;
  let notificationsPage: NotificationsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    notificationsPage = new NotificationsPage(page);

    await loginPage.goto();
    await loginPage.login('cuong', '123456');
    await loginPage.isAtDashboard();
  });

  test('should display notifications list', async ({ page }) => {
    // Act
    await notificationsPage.goto();

    // Assert
    const count = await notificationsPage.getNotificationsCount();
    // Even if 0, the page should load correctly
    await expect(page.locator('.notif-title')).toBeVisible();
  });
});
