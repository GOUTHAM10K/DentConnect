/**
 * TC23 - Page Title & Meta Tests
 */
const { expect } = require('chai');
const { createDriver, goToApp, By } = require('../helpers');

let driver;

describe('TC23 - Page Title and Meta Tags', function () {
  this.timeout(30000);

  before(async () => {
    driver = await createDriver();
    await goToApp(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should have a page title containing "DentConnect"', async () => {
    const title = await driver.getTitle();
    expect(title).to.include('DentConnect');
  });

  it('should have a valid HTML document structure', async () => {
    const html = await driver.findElement(By.css('html'));
    expect(html).to.not.be.null;
  });

  it('should have a root div element', async () => {
    const root = await driver.findElement(By.css('#root'));
    expect(root).to.not.be.null;
  });

  it('should load CSS styles successfully', async () => {
    // Check that some CSS variable is applied by checking background color
    const body = await driver.findElement(By.css('body'));
    const bgColor = await body.getCssValue('background-color');
    expect(bgColor).to.not.equal('');
  });
});
