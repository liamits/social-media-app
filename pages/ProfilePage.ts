import { Page } from '@playwright/test';

export class ProfilePage {
  constructor(private page: Page) {}

  async goto(username: string) {
    await this.page.goto(`/profile/${username}`);
  }

  async openEditModal() {
    await this.page.click('[data-test-id="profile-edit-btn"]');
  }

  async toggleFollow() {
    await this.page.click('[data-test-id="profile-follow-btn"]');
  }

  async isFollowing() {
    const btn = this.page.locator('[data-test-id="profile-follow-btn"]');
    const text = await btn.textContent();
    return text?.toLowerCase().includes('unfollow');
  }
}
