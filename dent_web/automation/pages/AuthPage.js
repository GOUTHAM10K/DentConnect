import { By } from 'selenium-webdriver';
import { BasePage } from './BasePage.js';

export class AuthPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = By.css('input[type="email"], input[name="email"], #email');
    this.passwordInput = By.css('input[type="password"], input[name="password"], #password');
    this.loginBtn = By.css('button[type="submit"], #login-btn, button:contains("Login")');
    this.registerLink = By.css('a[href*="register"], a[href*="signup"]');
    this.errorMessage = By.css('.error-message, .alert-danger, [role="alert"]');
    this.userMenu = By.css('.user-menu, #user-profile, .avatar');
    this.logoutBtn = By.css('#logout-btn, button:contains("Logout")');
  }

  async login(email, password) {
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.loginBtn);
  }

  async isLoginSuccessful() {
    return await this.isDisplayed(this.userMenu, 5000);
  }

  async getErrorMessageText() {
    if (await this.isDisplayed(this.errorMessage)) {
      return await this.getText(this.errorMessage);
    }
    return '';
  }

  async logout() {
    if (await this.isDisplayed(this.userMenu)) {
      await this.click(this.userMenu);
      await this.click(this.logoutBtn);
    }
  }
}
