import { Page } from '@playwright/test';

export class SidebarPage {
  constructor(private page: Page) {}

  async navigateTo(label: string) {
    const selector = `[data-test-id="sidebar-${label.toLowerCase()}-link"]`;
    await this.page.click(selector);
  }

  async logout() {
    await this.page.click('[data-test-id="sidebar-logout-link"]');
  }

  async openCreateModal() {
    await this.page.click('[data-test-id="sidebar-create-link"]');
  }

  async getUnreadNotifications() {
    return this.page.locator('[data-test-id="sidebar-notifications-link"] .notif-badge').textContent();
  }
}
