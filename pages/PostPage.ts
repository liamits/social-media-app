import { Page, expect } from '@playwright/test';

export class PostPage {
  constructor(private page: Page) {}

  async likePost(postIndex: number = 0) {
    await this.page.locator('[data-test-id="post-like-btn"]').nth(postIndex).click();
  }

  async commentOnPost(text: string, postIndex: number = 0) {
    await this.page.locator('[data-test-id="post-comment-input"]').nth(postIndex).fill(text);
    await this.page.locator('[data-test-id="post-comment-submit-btn"]').nth(postIndex).click();
  }

  async isPostLiked(postIndex: number = 0) {
    const likeBtn = this.page.locator('[data-test-id="post-like-btn"]').nth(postIndex);
    const heartIcon = likeBtn.locator('svg');
    const fill = await heartIcon.getAttribute('fill');
    return fill !== 'none';
  }
}
