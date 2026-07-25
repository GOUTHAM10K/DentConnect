/**
 * TC14 - Profile Page Tests
 * Shared session - single login
 */
const { expect } = require('chai');
const { createDriver, demoLogin, waitForText, waitForVisible, pageContainsText, By } = require('../helpers');

let driver;

before(async function () {
  this.timeout(120000);
  driver = await createDriver();
  await demoLogin(driver);
  // Navigate to Profile tab
  const nav = await driver.findElement(By.css('nav'));
  const buttons = await nav.findElements(By.css('button'));
  for (const btn of buttons) {
    const text = await btn.getText();
    if (text.includes('Profile')) {
      await btn.click();
      break;
    }
  }
  await driver.sleep(2000);
});

after(async function () {
  if (driver) await driver.quit();
});

describe('TC14 - Profile Page', function () {
  this.timeout(30000);

  it('should navigate to Profile page', async () => {
    const body = await driver.findElement(By.css('body'));
    const text = await body.getText();
    const onProfile = text.includes('Profile') || text.includes('Dr.') || text.includes('Edit') || text.includes('Specialization');
    expect(onProfile).to.be.true;
  });

  it('should show Edit Profile option', async () => {
    const has = await pageContainsText(driver, 'Edit');
    expect(has).to.be.true;
  });

  it('should show Logout or Settings option', async () => {
    const hasLogout = await pageContainsText(driver, 'Logout') || await pageContainsText(driver, 'Log out') || await pageContainsText(driver, 'Sign out');
    const hasSettings = await pageContainsText(driver, 'Settings');
    expect(hasLogout || hasSettings).to.be.true;
  });

  it('should show doctor specialization info', async () => {
    const has = await pageContainsText(driver, 'Endodontics') || await pageContainsText(driver, 'Dentistry') || await pageContainsText(driver, 'Specialization') || await pageContainsText(driver, 'Dr.');
    expect(has).to.be.true;
  });
});
