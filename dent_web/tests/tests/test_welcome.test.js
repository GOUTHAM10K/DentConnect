/**
 * TC01 - Welcome Page Tests
 * Tests: heading, tagline, branding, Get Started button
 */
const { expect } = require('chai');
const { createDriver, goToApp, waitForText, waitForVisible, By } = require('../helpers');

let driver;

describe('TC01 - Welcome Page', function () {
  this.timeout(30000);

  before(async () => {
    driver = await createDriver();
    await goToApp(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should display the app name "DentConnect"', async () => {
    await waitForText(driver, 'DentConnect');
    const heading = await driver.findElement(By.xpath("//*[contains(text(),'DentConnect')]"));
    const text = await heading.getText();
    expect(text).to.include('DentConnect');
  });

  it('should display the tagline "Document. Share. Grow."', async () => {
    await waitForText(driver, 'Document. Share. Grow.');
    const tagline = await driver.findElement(By.xpath("//*[contains(text(),'Document. Share. Grow.')]"));
    const text = await tagline.getText();
    expect(text).to.include('Document. Share. Grow.');
  });

  it('should display "Get Started" button', async () => {
    const btn = await waitForVisible(driver, By.xpath("//button[contains(text(),'Get Started')]"));
    expect(btn).to.not.be.null;
    const text = await btn.getText();
    expect(text).to.include('Get Started');
  });

  it('should display the description text about the professional network', async () => {
    await waitForText(driver, 'professional network');
    const body = await driver.findElement(By.css('body'));
    const text = await body.getText();
    expect(text).to.include('professional network');
  });

  it('should show the "D" logo circle', async () => {
    const logo = await waitForVisible(driver, By.xpath("//*[contains(text(),'D') and not(contains(text(),'DentConnect')) and not(contains(text(),'Document'))]"));
    expect(logo).to.not.be.null;
  });
});
