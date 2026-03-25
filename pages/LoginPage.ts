import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(emailOrUsername: string, password: string) {
    await this.page.getByTestId('login-email-input').fill(emailOrUsername);
    await this.page.getByTestId('login-password-input').fill(password);
    await this.page.getByTestId('login-submit-btn').click();
  }

  async getErrorMessage() {
    const errorLocator = this.page.getByTestId('login-error-msg');
    await expect(errorLocator).toBeVisible();
    return errorLocator.textContent();
  }

  async isAtDashboard() {
    await this.page.waitForURL('/');
    return this.page.url().endsWith('/');
  }
}
