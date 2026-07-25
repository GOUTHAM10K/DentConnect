import { By } from 'selenium-webdriver';
import { BasePage } from './BasePage.js';

export class CasesPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.createCaseBtn = By.css('button:contains("New Case"), #create-case-btn, .create-case');
    this.patientNameInput = By.css('input[name="patientName"], #patientName');
    this.diagnosisInput = By.css('textarea[name="diagnosis"], #diagnosis');
    this.saveCaseBtn = By.css('button[type="submit"], #save-case');
    this.caseListItems = By.css('.case-card, .case-item, tr.case-row');
    this.searchInput = By.css('input[placeholder*="Search cases"]');
  }

  async searchCases(query) {
    if (await this.isDisplayed(this.searchInput)) {
      await this.type(this.searchInput, query);
    }
  }
}
