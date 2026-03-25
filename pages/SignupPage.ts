import { Page } from '@playwright/test';

export class SignupPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/signup');
  }

  async signup(username: string, email: string, password: string, fullName: string = '') {
    await this.page.getByTestId('signup-email-input').fill(email);
    if (fullName) await this.page.getByTestId('signup-fullname-input').fill(fullName);
    await this.page.getByTestId('signup-username-input').fill(username);
    await this.page.getByTestId('signup-password-input').fill(password);
    await this.page.getByTestId('signup-submit-btn').click();
  }

  async getErrorMessage() {
    return this.page.getByTestId('signup-error-msg').textContent();
  }
}
