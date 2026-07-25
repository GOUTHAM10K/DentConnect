import { By, until } from 'selenium-webdriver';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config/config.js';

export class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.timeout = CONFIG.timeouts.explicit;
  }

  async navigateTo(path = '') {
    const fullUrl = new URL(path, CONFIG.baseUrl).toString();
    logger.info(`Navigating to: ${fullUrl}`);
    await this.driver.get(fullUrl);
  }

  async find(locator, timeout = this.timeout) {
    return await this.driver.wait(until.elementLocated(locator), timeout);
  }

  async click(locator, timeout = this.timeout) {
    const element = await this.find(locator, timeout);
    await this.driver.wait(until.elementIsVisible(element), timeout);
    await element.click();
  }

  async type(locator, text, timeout = this.timeout) {
    const element = await this.find(locator, timeout);
    await this.driver.wait(until.elementIsVisible(element), timeout);
    await element.clear();
    await element.sendKeys(text);
  }

  async getText(locator, timeout = this.timeout) {
    const element = await this.find(locator, timeout);
    return await element.getText();
  }

  async isDisplayed(locator, timeout = 3000) {
    try {
      const element = await this.find(locator, timeout);
      return await element.isDisplayed();
    } catch {
      return false;
    }
  }

  async getTitle() {
    return await this.driver.getTitle();
  }

  async getCurrentUrl() {
    return await this.driver.getCurrentUrl();
  }

  async retryAction(actionFn, maxRetries = CONFIG.retries) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await actionFn();
      } catch (err) {
        lastError = err;
        logger.warn(`Action failed on attempt ${attempt}/${maxRetries}: ${err.message}`);
        await this.driver.sleep(1000);
      }
    }
    throw lastError;
  }
}
