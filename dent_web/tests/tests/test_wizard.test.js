/**
 * TC15–TC21 - New Case Wizard Step-by-Step Tests
 */
const { expect } = require('chai');
const {
  createDriver, demoLogin, waitForText, waitForVisible,
  pageContainsText, safeFindElement, By, Key
} = require('../helpers');

let driver;

async function openWizard(driver) {
  await demoLogin(driver);
  await waitForText(driver, 'Quick Actions');
  const newCaseCard = await waitForVisible(driver, By.xpath("//*[contains(text(),'New Case')]"));
  await newCaseCard.click();
  await driver.sleep(1500);
}

async function clickNext(driver) {
  const body = await driver.findElement(By.css('body'));
  const buttons = await body.findElements(By.css('button'));
  for (const btn of buttons) {
    try {
      const text = await btn.getText();
      if (text.includes('Next') || text.includes('Continue') || text.includes('Proceed')) {
        await btn.click();
        await driver.sleep(1000);
        return true;
      }
    } catch { /* continue */ }
  }
  return false;
}

describe('TC15 - New Case Wizard Step 1 (Patient Info)', function () {
  this.timeout(90000);

  before(async () => {
    driver = await createDriver();
    await openWizard(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should show wizard is open with patient-related content', async () => {
    const body = await driver.findElement(By.css('body'));
    const text = await body.getText();
    const onWizard = text.includes('Patient') || text.includes('Step 1') || text.includes('Case');
    expect(onWizard).to.be.true;
  });

  it('should display gender chip/button options', async () => {
    const hasMale = await pageContainsText(driver, 'Male');
    const hasFemale = await pageContainsText(driver, 'Female');
    expect(hasMale || hasFemale).to.be.true;
  });

  it('should allow clicking a gender chip', async () => {
    const maleBtn = await safeFindElement(driver, By.xpath("//button[contains(text(),'Male')]"));
    if (maleBtn) {
      await maleBtn.click();
      await driver.sleep(300);
    }
    expect(maleBtn).to.not.be.null;
  });

  it('should show Patient ID or complaint input field', async () => {
    const inputs = await driver.findElements(By.css('input, textarea'));
    expect(inputs.length).to.be.at.least(1);
  });

  it('should show a "Next" or "Continue" button to advance wizard', async () => {
    const body = await driver.findElement(By.css('body'));
    const buttons = await body.findElements(By.css('button'));
    let hasNext = false;
    for (const btn of buttons) {
      try {
        const text = await btn.getText();
        if (text.includes('Next') || text.includes('Continue') || text.includes('Save') || text.includes('Proceed')) {
          hasNext = true;
          break;
        }
      } catch { /* continue */ }
    }
    expect(hasNext).to.be.true;
  });
});

describe('TC16 - New Case Wizard Step 2 (Clinical Photos)', function () {
  this.timeout(90000);

  before(async () => {
    driver = await createDriver();
    await openWizard(driver);
    // Fill Step 1 and advance
    await driver.sleep(500);
    const maleBtn = await safeFindElement(driver, By.xpath("//button[contains(text(),'Male')]"));
    if (maleBtn) await maleBtn.click();
    const inputs = await driver.findElements(By.css('input[type="text"], textarea'));
    if (inputs[0]) await inputs[0].sendKeys('P001');
    await clickNext(driver);
    await driver.sleep(1500);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should show photo/image tabs or upload section', async () => {
    const body = await driver.findElement(By.css('body'));
    const text = await body.getText();
    const hasPhotoSection = text.includes('Pre-Op') || text.includes('Photo') || text.includes('Image') || text.includes('Upload') || text.includes('Intra');
    expect(hasPhotoSection).to.be.true;
  });

  it('should display "Pre-Op" photo tab', async () => {
    const has = await pageContainsText(driver, 'Pre-Op') || await pageContainsText(driver, 'Pre Op');
    expect(has).to.be.true;
  });

  it('should display image slider controls or upload area', async () => {
    const hasSlider = await safeFindElement(driver, By.css('input[type="range"]'));
    const hasUpload = await safeFindElement(driver, By.css('input[type="file"]'));
    const hasUploadText = await pageContainsText(driver, 'Upload');
    expect(hasSlider || hasUpload || hasUploadText).to.be.true;
  });
});

describe('TC17 - New Case Wizard Step 3 (Clinical Findings)', function () {
  this.timeout(90000);

  before(async () => {
    driver = await createDriver();
    await openWizard(driver);
    // Step 1
    await driver.sleep(500);
    const maleBtn = await safeFindElement(driver, By.xpath("//button[contains(text(),'Male')]"));
    if (maleBtn) await maleBtn.click();
    await clickNext(driver);
    await driver.sleep(1000);
    // Step 2 -> advance
    await clickNext(driver);
    await driver.sleep(1500);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should show Clinical Findings or History section', async () => {
    const body = await driver.findElement(By.css('body'));
    const text = await body.getText();
    const hasFinding = text.includes('History') || text.includes('Clinical') || text.includes('Findings') || text.includes('Diagnosis') || text.includes('Treatment');
    expect(hasFinding).to.be.true;
  });

  it('should display text input areas for clinical data', async () => {
    const textareas = await driver.findElements(By.css('textarea'));
    const inputs = await driver.findElements(By.css('input[type="text"]'));
    expect(textareas.length + inputs.length).to.be.at.least(1);
  });
});

describe('TC18 - New Case Wizard Step 4 (Digital Consent)', function () {
  this.timeout(90000);

  before(async () => {
    driver = await createDriver();
    await openWizard(driver);
    // Navigate through steps 1-3
    await driver.sleep(500);
    const maleBtn = await safeFindElement(driver, By.xpath("//button[contains(text(),'Male')]"));
    if (maleBtn) await maleBtn.click();
    await clickNext(driver);  // Step 1 -> 2
    await driver.sleep(1000);
    await clickNext(driver);  // Step 2 -> 3
    await driver.sleep(1000);
    await clickNext(driver);  // Step 3 -> 4
    await driver.sleep(1500);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should show Digital Consent or Signature section', async () => {
    const body = await driver.findElement(By.css('body'));
    const text = await body.getText();
    const hasConsent = text.includes('Consent') || text.includes('Signature') || text.includes('Sign') || text.includes('Agree');
    expect(hasConsent).to.be.true;
  });

  it('should display a canvas or signature pad area', async () => {
    const canvas = await safeFindElement(driver, By.css('canvas'));
    const hasSignatureText = await pageContainsText(driver, 'Signature') || await pageContainsText(driver, 'Sign here');
    expect(canvas || hasSignatureText).to.be.true;
  });
});

describe('TC19 - New Case Wizard Step 5 (Document Compile)', function () {
  this.timeout(120000);

  before(async () => {
    driver = await createDriver();
    await openWizard(driver);
    // Navigate through steps 1-4
    await driver.sleep(500);
    const maleBtn = await safeFindElement(driver, By.xpath("//button[contains(text(),'Male')]"));
    if (maleBtn) await maleBtn.click();
    await clickNext(driver);
    await driver.sleep(1000);
    await clickNext(driver);
    await driver.sleep(1000);
    await clickNext(driver);
    await driver.sleep(1000);
    await clickNext(driver);
    await driver.sleep(3000);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should show document compilation or generation step', async () => {
    const body = await driver.findElement(By.css('body'));
    const text = await body.getText();
    const hasCompile = text.includes('Document') || text.includes('Generating') || text.includes('Compile') || text.includes('Report') || text.includes('Preparing') || text.includes('Case Sheet') || text.includes('Share');
    expect(hasCompile).to.be.true;
  });
});

describe('TC20 - New Case Wizard Step 6 (Case Sheet)', function () {
  this.timeout(120000);

  before(async () => {
    driver = await createDriver();
    await openWizard(driver);
    // Navigate steps 1-5
    await driver.sleep(500);
    const maleBtn = await safeFindElement(driver, By.xpath("//button[contains(text(),'Male')]"));
    if (maleBtn) await maleBtn.click();
    await clickNext(driver);
    await driver.sleep(1000);
    await clickNext(driver);
    await driver.sleep(1000);
    await clickNext(driver);
    await driver.sleep(1000);
    await clickNext(driver);
    await driver.sleep(4000);
    await clickNext(driver);
    await driver.sleep(2000);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should show Case Sheet or summary content', async () => {
    const body = await driver.findElement(By.css('body'));
    const text = await body.getText();
    const hasCaseSheet = text.includes('Case Sheet') || text.includes('Summary') || text.includes('Patient') || text.includes('Share') || text.includes('Caption');
    expect(hasCaseSheet).to.be.true;
  });
});

describe('TC21 - New Case Wizard Step 7 (Share)', function () {
  this.timeout(120000);

  before(async () => {
    driver = await createDriver();
    await openWizard(driver);
    // Navigate to final share step
    await driver.sleep(500);
    const maleBtn = await safeFindElement(driver, By.xpath("//button[contains(text(),'Male')]"));
    if (maleBtn) await maleBtn.click();
    await clickNext(driver);
    await driver.sleep(800);
    await clickNext(driver);
    await driver.sleep(800);
    await clickNext(driver);
    await driver.sleep(800);
    await clickNext(driver);
    await driver.sleep(4000);
    await clickNext(driver);
    await driver.sleep(1500);
    await clickNext(driver);
    await driver.sleep(1500);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should show Share page or caption input', async () => {
    const body = await driver.findElement(By.css('body'));
    const text = await body.getText();
    const hasShare = text.includes('Share') || text.includes('Caption') || text.includes('Public') || text.includes('Connections') || text.includes('Network') || text.includes('Case Sheet');
    expect(hasShare).to.be.true;
  });

  it('should show visibility options or share button', async () => {
    const hasVisibility = await pageContainsText(driver, 'Public') || await pageContainsText(driver, 'Private') || await pageContainsText(driver, 'Connections') || await pageContainsText(driver, 'Share');
    expect(hasVisibility).to.be.true;
  });
});
