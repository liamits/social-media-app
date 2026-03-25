import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { PostPage } from '../../../pages/PostPage';

test.describe('Post UI Interactions', () => {
  let loginPage: LoginPage;
  let postPage: PostPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    postPage = new PostPage(page);

    // Rule 7: Data setup (assume user 'cuong' exists as per user request)
    await loginPage.goto();
    await loginPage.login('cuong', '123456');
    await loginPage.isAtDashboard();
  });

  test('should allow user to like a post', async () => {
    // Arrange & Act
    const initialLiked = await postPage.isPostLiked(0);
    await postPage.likePost(0);

    // Assert
    const finallyLiked = await postPage.isPostLiked(0);
    expect(finallyLiked).not.toEqual(initialLiked);
  });

  test('should allow user to comment on a post', async ({ page }) => {
    // Arrange
    const commentText = `Test comment ${Date.now()}`;

    // Act
    await postPage.commentOnPost(commentText, 0);

    // Assert
    await expect(page.getByText(commentText)).toBeVisible();
  });
});
