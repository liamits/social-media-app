import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { ProfilePage } from '../../../pages/ProfilePage';

test.describe('Profile UI', () => {
  let loginPage: LoginPage;
  let profilePage: ProfilePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    profilePage = new ProfilePage(page);

    await loginPage.goto();
    await loginPage.login('cuong', '123456');
    await loginPage.isAtDashboard();
  });

  test('should display user profile correctly', async ({ page }) => {
    // Act
    await profilePage.goto('cuong');

    // Assert
    await expect(page.locator('.profile-username')).toContainText('cuong');
  });

  test('should allow toggling follow state on other user', async () => {
    // Arrange
    await profilePage.goto('testuser'); // Assume a 'testuser' exists

    // Act
    const initialState = await profilePage.isFollowing();
    await profilePage.toggleFollow();

    // Assert
    const finalState = await profilePage.isFollowing();
    expect(finalState).not.toEqual(initialState);
  });
});
