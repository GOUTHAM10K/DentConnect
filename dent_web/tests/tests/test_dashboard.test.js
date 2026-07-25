/**
 * TC07–TC11 - Dashboard & Bottom Navigation Tests
 * Uses a single shared driver session to avoid multiple Firebase logins
 */
const { expect } = require('chai');
const { createDriver, demoLogin, waitForText, waitForVisible, pageContainsText, safeFindElement, By } = require('../helpers');

let driver;

// Single login for all dashboard tests
before(async function () {
  this.timeout(120000);
  driver = await createDriver();
  await demoLogin(driver);
});

after(async function () {
  if (driver) await driver.quit();
});

describe('TC07 - Dashboard Page Structure', function () {
  this.timeout(30000);

  it('should display "Welcome," greeting', async () => {
    await waitForText(driver, 'Welcome,');
    const has = await pageContainsText(driver, 'Welcome,');
    expect(has).to.be.true;
  });

  it('should display "Dr." in the greeting', async () => {
    const has = await pageContainsText(driver, 'Dr.');
    expect(has).to.be.true;
  });

  it('should display the notification bell button', async () => {
    const bellBtn = await waitForVisible(driver, By.css('button[aria-label="Notifications"]'));
    expect(bellBtn).to.not.be.null;
  });

  it('should show "Cases" stat card', async () => {
    const has = await pageContainsText(driver, 'Cases');
    expect(has).to.be.true;
  });

  it('should show "Shared" stat card', async () => {
    const has = await pageContainsText(driver, 'Shared');
    expect(has).to.be.true;
  });

  it('should show "Followers" stat card', async () => {
    const has = await pageContainsText(driver, 'Followers');
    expect(has).to.be.true;
  });
});

describe('TC08 - Dashboard Quick Actions', function () {
  this.timeout(30000);

  // Return to home before these tests
  beforeEach(async function () {
    // Check if we drifted away from home, go back if needed
    const has = await pageContainsText(driver, 'Quick Actions');
    if (!has) {
      const nav = await safeFindElement(driver, By.css('nav'));
      if (nav) {
        const buttons = await nav.findElements(By.css('button'));
        for (const btn of buttons) {
          try {
            const text = await btn.getText();
            if (text.includes('Home')) { await btn.click(); await driver.sleep(1000); break; }
          } catch { /* continue */ }
        }
      }
    }
  });

  it('should show "Quick Actions" section header', async () => {
    await waitForText(driver, 'Quick Actions');
    const has = await pageContainsText(driver, 'Quick Actions');
    expect(has).to.be.true;
  });

  it('should show "New Case" quick action card', async () => {
    const has = await pageContainsText(driver, 'New Case');
    expect(has).to.be.true;
  });

  it('should show "Drafts" quick action card', async () => {
    const has = await pageContainsText(driver, 'Drafts');
    expect(has).to.be.true;
  });

  it('should show "Consent Forms" quick action card', async () => {
    const has = await pageContainsText(driver, 'Consent Forms');
    expect(has).to.be.true;
  });
});

describe('TC09 - Dashboard Recent Cases Section', function () {
  this.timeout(30000);

  it('should show "Recent Cases" section', async () => {
    // Navigate home first
    const hasQuick = await pageContainsText(driver, 'Quick Actions');
    if (!hasQuick) {
      const nav = await safeFindElement(driver, By.css('nav'));
      if (nav) {
        const buttons = await nav.findElements(By.css('button'));
        for (const btn of buttons) {
          try {
            const text = await btn.getText();
            if (text.includes('Home')) { await btn.click(); await driver.sleep(1000); break; }
          } catch { /* continue */ }
        }
      }
    }
    await waitForText(driver, 'Recent Cases');
    const has = await pageContainsText(driver, 'Recent Cases');
    expect(has).to.be.true;
  });

  it('should display "View All" button next to Recent Cases', async () => {
    const has = await pageContainsText(driver, 'View All');
    expect(has).to.be.true;
  });
});

describe('TC10 - Dashboard Notifications', function () {
  this.timeout(30000);

  it('should navigate to Notifications page when bell is clicked', async () => {
    // Go home first
    const nav = await safeFindElement(driver, By.css('nav'));
    if (nav) {
      const buttons = await nav.findElements(By.css('button'));
      for (const btn of buttons) {
        try {
          const text = await btn.getText();
          if (text.includes('Home')) { await btn.click(); await driver.sleep(1000); break; }
        } catch { /* continue */ }
      }
    }
    await waitForText(driver, 'Welcome,');
    const bellBtn = await waitForVisible(driver, By.css('button[aria-label="Notifications"]'));
    await bellBtn.click();
    await waitForText(driver, 'Notifications');
    const has = await pageContainsText(driver, 'Notifications');
    expect(has).to.be.true;
  });

  it('should show at least one notification item (Dr. mentions)', async () => {
    const has = await pageContainsText(driver, 'Dr.');
    expect(has).to.be.true;
  });

  it('should show a back button on Notifications page', async () => {
    const backBtn = await waitForVisible(driver, By.css('button[aria-label="Go Back"]'));
    expect(backBtn).to.not.be.null;
  });
});

describe('TC11 - Bottom Navigation Bar', function () {
  this.timeout(60000);

  before(async function () {
    // Go back to home
    const backBtn = await safeFindElement(driver, By.css('button[aria-label="Go Back"]'));
    if (backBtn) await backBtn.click();
    await driver.sleep(1000);
  });

  it('should display bottom navigation bar', async () => {
    const nav = await waitForVisible(driver, By.css('nav'));
    expect(nav).to.not.be.null;
  });

  it('should show Home tab in bottom nav', async () => {
    const nav = await driver.findElement(By.css('nav'));
    const navText = await nav.getText();
    expect(navText).to.include('Home');
  });

  it('should show Network tab in bottom nav', async () => {
    const nav = await driver.findElement(By.css('nav'));
    const navText = await nav.getText();
    expect(navText).to.include('Network');
  });

  it('should show Profile tab in bottom nav', async () => {
    const nav = await driver.findElement(By.css('nav'));
    const navText = await nav.getText();
    expect(navText).to.include('Profile');
  });

  it('should navigate to Network when Network tab is clicked', async () => {
    const nav = await driver.findElement(By.css('nav'));
    const buttons = await nav.findElements(By.css('button'));
    for (const btn of buttons) {
      const text = await btn.getText();
      if (text.includes('Network')) {
        await btn.click();
        break;
      }
    }
    await waitForText(driver, 'Network Feed');
    const has = await pageContainsText(driver, 'Network Feed');
    expect(has).to.be.true;
  });
});
