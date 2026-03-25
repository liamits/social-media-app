import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { SignupPage } from '../../../pages/SignupPage';
import { faker } from '@faker-js/faker';

test.describe('Authentication UI', () => {
  let loginPage: LoginPage;
  let signupPage: SignupPage;

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.text()}`));
    page.on('request', request => console.log(`>> Request: ${request.method()} ${request.url()}`));
    page.on('response', response => console.log(`<< Response: ${response.status()} ${response.url()}`));
    loginPage = new LoginPage(page);
    signupPage = new SignupPage(page);
  });

  test('should show error with invalid credentials', async () => {
    // Arrange
    await loginPage.goto();

    // Act
    await loginPage.login('wrong@example.com', 'wrongpassword');

    // Assert
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Invalid credentials');
  });

  test('should login successfully with valid credentials', async () => {
    // Arrange
    await loginPage.goto();

    // Act
    await loginPage.login('cuong', '123456');

    // Assert
    expect(await loginPage.isAtDashboard()).toBe(true);
  });

  test('should allow user to navigate to signup page', async ({ page }) => {
    // Arrange
    await loginPage.goto();

    // Act
    await page.click('text=Sign up');

    // Assert
    await expect(page).toHaveURL(/.*signup/);
  });
});
