/**
 * helpers.js - Shared Selenium WebDriver helpers for DentConnect tests
 */
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const BASE_URL = 'http://localhost:5173';
const TIMEOUT = 20000;
const SHORT_WAIT = 3000;

/**
 * Create a configured Chrome WebDriver instance
 */
async function createDriver(headless = false) {
  const options = new chrome.Options();
  if (headless) {
    options.addArguments('--headless=new');
  }
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--window-size=430,932'); // Mobile viewport like Android
  options.addArguments('--disable-web-security');
  options.addArguments('--allow-running-insecure-content');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.manage().setTimeouts({ implicit: 5000, pageLoad: 30000 });
  return driver;
}

/**
 * Navigate to base URL and wait for app to load
 */
async function goToApp(driver) {
  await driver.get(BASE_URL);
  // Wait for the app root to render
  await driver.wait(until.elementLocated(By.css('.app-viewport, #root')), TIMEOUT);
  await driver.sleep(1000);
}

/**
 * Wait for element to be visible
 */
async function waitForVisible(driver, locator, timeout = TIMEOUT) {
  const el = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  return el;
}

/**
 * Wait for text to appear anywhere on page
 */
async function waitForText(driver, text, timeout = TIMEOUT) {
  await driver.wait(async () => {
    const body = await driver.findElement(By.css('body'));
    const bodyText = await body.getText();
    return bodyText.includes(text);
  }, timeout, `Timed out waiting for text: "${text}"`);
}

/**
 * Click "Get Started" to navigate to Auth page
 */
async function goToAuth(driver) {
  await goToApp(driver);
  await waitForText(driver, 'Get Started');
  const btn = await waitForVisible(driver, By.xpath("//button[contains(text(),'Get Started')]"));
  await btn.click();
  await waitForText(driver, 'Welcome Back');
}

/**
 * Perform Demo Login - navigates through Welcome -> Auth -> Demo login -> Dashboard
 */
async function demoLogin(driver) {
  await goToAuth(driver);
  const demoBtn = await waitForVisible(driver, By.xpath("//button[contains(text(),'Demo Mode')]"));
  await demoBtn.click();

  // Wait up to 60s for Firebase auth + dashboard to appear
  await driver.wait(async () => {
    try {
      const body = await driver.findElement(By.css('body'));
      const text = await body.getText();
      return (
        text.includes('Welcome,') ||
        text.includes('Quick Actions') ||
        text.includes('Recent Cases') ||
        text.includes('Followers') ||
        text.includes('Cases') && text.includes('Shared')
      );
    } catch {
      return false;
    }
  }, 60000, 'Demo login did not navigate to Dashboard within 60s');

  // Extra buffer for Firebase to finish loading data
  await driver.sleep(2000);
}

/**
 * Safe find element (returns null if not found)
 */
async function safeFindElement(driver, locator) {
  try {
    return await driver.findElement(locator);
  } catch {
    return null;
  }
}

/**
 * Check if text exists on page
 */
async function pageContainsText(driver, text) {
  try {
    const body = await driver.findElement(By.css('body'));
    const bodyText = await body.getText();
    return bodyText.includes(text);
  } catch {
    return false;
  }
}

/**
 * Click bottom nav tab by label
 */
async function clickNavTab(driver, tabLabel) {
  await driver.sleep(500);
  const tabs = await driver.findElements(By.css('nav button, nav div[role="button"], nav [class*="tab"]'));
  for (const tab of tabs) {
    try {
      const text = await tab.getText();
      if (text.toLowerCase().includes(tabLabel.toLowerCase())) {
        await tab.click();
        return true;
      }
    } catch { /* continue */ }
  }
  return false;
}

module.exports = {
  createDriver,
  goToApp,
  goToAuth,
  demoLogin,
  waitForVisible,
  waitForText,
  safeFindElement,
  pageContainsText,
  clickNavTab,
  BASE_URL,
  TIMEOUT,
  SHORT_WAIT,
  By,
  until,
  Key
};
