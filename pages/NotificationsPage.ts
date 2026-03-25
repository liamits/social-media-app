import { Page } from '@playwright/test';

export class NotificationsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/notifications');
  }

  async getNotificationsCount() {
    return this.page.locator('[data-test-id="notif-item"]').count();
  }
}
