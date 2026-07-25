import { By } from 'selenium-webdriver';
import { BasePage } from './BasePage.js';

export class NavigationPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.navLinks = {
      dashboard: By.css('a[href*="/dashboard"], nav a:contains("Dashboard")'),
      cases: By.css('a[href*="/cases"], nav a:contains("Cases")'),
      network: By.css('a[href*="/network"], nav a:contains("Network")'),
      chat: By.css('a[href*="/chat"], nav a:contains("Chat")'),
      notifications: By.css('a[href*="/notifications"], nav a:contains("Notifications")'),
      search: By.css('a[href*="/search"], nav a:contains("Search")')
    };
  }

  async goToModule(moduleName) {
    const locator = this.navLinks[moduleName.toLowerCase()];
    if (locator) {
      await this.click(locator);
    } else {
      await this.navigateTo(`#/${moduleName.toLowerCase()}`);
    }
  }
}
