/**
 * TC02–TC06 - Auth Page Tests
 * Tests: navigation, login form, signup form, demo login, google button
 */
const { expect } = require('chai');
const { createDriver, goToApp, goToAuth, waitForText, waitForVisible, safeFindElement, pageContainsText, By, until } = require('../helpers');

let driver;

describe('TC02 - Auth Page Navigation', function () {
  this.timeout(30000);

  before(async () => {
    driver = await createDriver();
    await goToApp(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should navigate to Auth page when Get Started is clicked', async () => {
    const btn = await waitForVisible(driver, By.xpath("//button[contains(text(),'Get Started')]"));
    await btn.click();
    await waitForText(driver, 'Welcome Back');
    const hasAuth = await pageContainsText(driver, 'Welcome Back');
    expect(hasAuth).to.be.true;
  });

  it('should show Login mode by default with "Welcome Back! 👋"', async () => {
    const title = await waitForVisible(driver, By.xpath("//*[contains(text(),'Welcome Back')]"));
    const text = await title.getText();
    expect(text).to.include('Welcome Back');
  });

  it('should display subtitle "Login to connect with clinicians"', async () => {
    const has = await pageContainsText(driver, 'Login to connect with clinicians');
    expect(has).to.be.true;
  });
});

describe('TC03 - Auth Page Login Form', function () {
  this.timeout(30000);

  before(async () => {
    driver = await createDriver();
    await goToAuth(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should show Email Address field', async () => {
    const emailInput = await waitForVisible(driver, By.css('input[type="email"]'));
    expect(emailInput).to.not.be.null;
  });

  it('should show Password field', async () => {
    const passInput = await waitForVisible(driver, By.css('input[type="password"]'));
    expect(passInput).to.not.be.null;
  });

  it('should show the eye toggle button for password visibility', async () => {
    // Find the eye icon button (it's inside the password input wrapper)
    const eyeBtn = await waitForVisible(driver, By.css('form button[type="button"]'));
    expect(eyeBtn).to.not.be.null;
  });

  it('should toggle password visibility when eye button clicked', async () => {
    const passInput = await driver.findElement(By.css('input[type="password"]'));
    await passInput.sendKeys('testpassword');

    const eyeBtn = await driver.findElement(By.css('form button[type="button"]'));
    await eyeBtn.click();
    await driver.sleep(300);

    const inputType = await driver.findElement(By.css('input[type="text"][placeholder="••••••••"]')).catch(() => null);
    expect(inputType).to.not.be.null;
  });

  it('should display "Forgot?" link in login mode', async () => {
    const has = await pageContainsText(driver, 'Forgot?');
    expect(has).to.be.true;
  });

  it('should show Login submit button', async () => {
    const btn = await waitForVisible(driver, By.css('button[type="submit"]'));
    const text = await btn.getText();
    expect(text).to.include('Login');
  });
});

describe('TC04 - Auth Page Sign-Up Form', function () {
  this.timeout(30000);

  before(async () => {
    driver = await createDriver();
    await goToAuth(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should toggle to Sign Up mode', async () => {
    const toggleBtn = await waitForVisible(driver, By.xpath("//button[contains(text(),'Create an account')]"));
    await toggleBtn.click();
    await waitForText(driver, 'Create Account');
    const has = await pageContainsText(driver, 'Create Account');
    expect(has).to.be.true;
  });

  it('should show Full Name field in signup mode', async () => {
    const nameInput = await waitForVisible(driver, By.css('input[placeholder*="Arun"]'));
    expect(nameInput).to.not.be.null;
  });

  it('should show Specialization dropdown with options', async () => {
    const select = await waitForVisible(driver, By.css('select'));
    const options = await select.findElements(By.css('option'));
    expect(options.length).to.be.at.least(6);

    const optionTexts = [];
    for (const opt of options) {
      optionTexts.push(await opt.getText());
    }
    expect(optionTexts).to.include('General Dentistry');
    expect(optionTexts).to.include('Orthodontics');
    expect(optionTexts).to.include('Endodontics');
  });

  it('should show Institution field in signup mode', async () => {
    const institutionInput = await waitForVisible(driver, By.css('input[placeholder*="Dental Care"]'));
    expect(institutionInput).to.not.be.null;
  });

  it('should show Location field in signup mode', async () => {
    const locationInput = await waitForVisible(driver, By.css('input[placeholder*="Bangalore"]'));
    expect(locationInput).to.not.be.null;
  });

  it('should show "Join the dental clinician network" subtitle in signup mode', async () => {
    const has = await pageContainsText(driver, 'Join the dental clinician network');
    expect(has).to.be.true;
  });

  it('should switch back to login mode when "Login" toggle is clicked', async () => {
    const toggleBtn = await waitForVisible(driver, By.xpath("//button[contains(text(),'Login') and not(@type='submit')]"));
    await toggleBtn.click();
    await waitForText(driver, 'Welcome Back');
    const has = await pageContainsText(driver, 'Welcome Back');
    expect(has).to.be.true;
  });
});

describe('TC05 - Auth Page Demo Login Button', function () {
  this.timeout(30000);

  before(async () => {
    driver = await createDriver();
    await goToAuth(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should display "Demo Mode" button', async () => {
    const demoBtn = await waitForVisible(driver, By.xpath("//button[contains(text(),'Demo Mode')]"));
    expect(demoBtn).to.not.be.null;
    const text = await demoBtn.getText();
    expect(text).to.include('Demo Mode');
  });

  it('should show loading state when Demo Mode is clicked', async () => {
    const demoBtn = await waitForVisible(driver, By.xpath("//button[contains(text(),'Demo Mode')]"));
    await demoBtn.click();
    // Check for Processing or loading indicator briefly
    await driver.sleep(500);
    // The button or page should indicate loading
    const body = await driver.findElement(By.css('body'));
    const text = await body.getText();
    // Either it shows processing or navigates to dashboard
    const isLoading = text.includes('Processing') || text.includes('Welcome,') || text.includes('Quick Actions');
    expect(isLoading).to.be.true;
  });
});

describe('TC06 - Auth Page Google Sign-In Button', function () {
  this.timeout(30000);

  before(async () => {
    driver = await createDriver();
    await goToAuth(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should display Google sign-in button', async () => {
    const googleBtn = await waitForVisible(driver, By.xpath("//button[contains(text(),'Google')]"));
    expect(googleBtn).to.not.be.null;
  });

  it('should display "or continue with" divider text', async () => {
    const has = await pageContainsText(driver, 'or continue with');
    expect(has).to.be.true;
  });

  it('should show the Google SVG icon in Google button', async () => {
    const googleIcon = await safeFindElement(driver, By.css('button svg'));
    expect(googleIcon).to.not.be.null;
  });
});
