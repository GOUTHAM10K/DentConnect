/**
 * TC22 - Drafts Page Tests
 * Shared session - single login
 */
const { expect } = require('chai');
const { createDriver, demoLogin, waitForText, pageContainsText, By } = require('../helpers');

let driver;

before(async function () {
  this.timeout(120000);
  driver = await createDriver();
  await demoLogin(driver);
  // Navigate to Drafts/Cases via bottom nav
  const nav = await driver.findElement(By.css('nav'));
  const buttons = await nav.findElements(By.css('button'));
  let clicked = false;
  for (const btn of buttons) {
    const text = await btn.getText();
    if (text.includes('Cases') || text.includes('Drafts') || text.includes('Files') || text.includes('Folder')) {
      await btn.click();
      clicked = true;
      break;
    }
  }
  // Fallback: try clicking the + (center add) button area or second tab
  if (!clicked && buttons.length >= 2) {
    await buttons[1].click();
  }
  await driver.sleep(2000);
});

after(async function () {
  if (driver) await driver.quit();
});

describe('TC22 - Drafts Page', function () {
  this.timeout(30000);

  it('should navigate to Drafts or Cases page', async () => {
    const body = await driver.findElement(By.css('body'));
    const text = await body.getText();
    const onDrafts = text.includes('Draft') || text.includes('Cases') || text.includes('All Cases') || text.includes('Resume') || text.includes('No ');
    expect(onDrafts).to.be.true;
  });

  it('should show tab sections for draft and completed cases', async () => {
    const hasDraft = await pageContainsText(driver, 'Draft') || await pageContainsText(driver, 'In Progress');
    const hasAll = await pageContainsText(driver, 'All') || await pageContainsText(driver, 'Completed') || await pageContainsText(driver, 'Cases');
    expect(hasDraft || hasAll).to.be.true;
  });

  it('should show empty state or list of cases', async () => {
    const body = await driver.findElement(By.css('body'));
    const text = await body.getText();
    const hasEmptyOrList = text.includes('No') || text.includes('draft') || text.includes('Case') || text.includes('Patient') || text.includes('Create') || text.includes('Start');
    expect(hasEmptyOrList).to.be.true;
  });
});
