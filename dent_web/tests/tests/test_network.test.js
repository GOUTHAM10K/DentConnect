/**
 * TC12–TC13 - Network Feed Page Tests
 * Shared session - single login
 */
const { expect } = require('chai');
const { createDriver, demoLogin, waitForText, waitForVisible, pageContainsText, By } = require('../helpers');

let driver;

before(async function () {
  this.timeout(120000);
  driver = await createDriver();
  await demoLogin(driver);
  // Navigate to Network tab
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
});

after(async function () {
  if (driver) await driver.quit();
});

describe('TC12 - Network Feed Page Structure', function () {
  this.timeout(30000);

  it('should display "Network Feed" heading', async () => {
    const has = await pageContainsText(driver, 'Network Feed');
    expect(has).to.be.true;
  });

  it('should show stories section with doctor avatars', async () => {
    const stories = await driver.findElements(By.css('img[alt*="Dr."]'));
    expect(stories.length).to.be.at.least(1);
  });

  it('should display empty state or feed posts', async () => {
    const hasEmpty = await pageContainsText(driver, 'Feed is quiet') || await pageContainsText(driver, 'quiet today');
    const hasPosts = await pageContainsText(driver, 'Likes') || await pageContainsText(driver, 'Comments');
    expect(hasEmpty || hasPosts).to.be.true;
  });
});

describe('TC13 - Network Feed Stories', function () {
  this.timeout(30000);

  it('should show "Dr. Sarah" in stories', async () => {
    const has = await pageContainsText(driver, 'Dr. Sarah');
    expect(has).to.be.true;
  });

  it('should show "Dr. John" in stories', async () => {
    const has = await pageContainsText(driver, 'Dr. John');
    expect(has).to.be.true;
  });

  it('should show "Dr. Emily" in stories', async () => {
    const has = await pageContainsText(driver, 'Dr. Emily');
    expect(has).to.be.true;
  });

  it('should show story image avatars', async () => {
    const imgs = await driver.findElements(By.css('img'));
    expect(imgs.length).to.be.at.least(3);
  });
});
