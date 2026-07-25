# Phase 7 — Enterprise CI/CD Deployment & Live E2E Testing Guide

This document provides complete instructions for repository setup, local execution, CI/CD pipeline execution, and troubleshooting for the DentConnect Web Selenium E2E Automation Framework.

---

## 1. Repository Configuration & GitHub Settings

### A. Enable GitHub Pages
1. Go to your GitHub repository: `https://github.com/<username>/<repository-name>`
2. Navigate to **Settings** > **Pages**.
3. Under **Build and deployment**:
   - **Source**: Select `GitHub Actions`.

### B. Configure Workflow Permissions
1. Navigate to **Settings** > **Actions** > **General**.
2. Scroll to **Workflow permissions**.
3. Select **Read and write permissions**.
4. Check **Allow GitHub Actions to create and approve pull requests**.
5. Save changes.

### C. Required Environment Variables & Secrets
- **BASE_URL**: Automatically computed during the workflow from `steps.deployment.outputs.page_url` (e.g. `https://<username>.github.io/<repository-name>/`).
- **SELENIUM_HEADLESS**: Set to `true` in GitHub Actions.

---

## 2. CI/CD Pipeline Workflow (.github/workflows/deploy-and-test.yml)

The pipeline executes automatically on every `push`, `pull_request`, or via manual `workflow_dispatch` across 13 stages:

1. **Stage 1: Repository Checkout** — Checks out codebase via `actions/checkout@v4`.
2. **Stage 2: Dependency Installation** — Installs Node.js 20, Google Chrome, and npm dependencies.
3. **Stage 3: Build Application** — Compiles production bundle with Vite (`npm run build`).
4. **Stage 4: Static Analysis** — Executes ESLint and code quality checks.
5. **Stage 5: Deploy to GitHub Pages** — Deploys build bundle directly to GitHub Pages via official actions.
6. **Stage 6: Wait for Deployment** — Polls live `BASE_URL` until returning HTTP 200.
7. **Stage 7: Deployment Verification** — Verifies HTTP status, asset loading, and DOM rendering.
8. **Stage 8: Run Live Selenium E2E Tests** — Runs 440+ executable test cases against the LIVE deployment URL.
9. **Stage 9: Generate HTML Reports** — Creates `execution-report.html` and `dashboard.html`.
10. **Stage 10: Generate Excel Reports** — Builds multi-sheet `Automation_Test_Report.xlsx`, `Failed_Test_Cases.xlsx`, `Passed_Test_Cases.xlsx`, and `Summary_Report.xlsx`.
11. **Stage 11: Upload Artifacts** — Uploads all report artifacts with 30-day retention.
12. **Stage 12: Publish Summary** — Renders formatted markdown execution metrics in GitHub Actions `$GITHUB_STEP_SUMMARY`.
13. **Stage 13: Store Historical Results** — Copies JSON execution snapshot to `history/`.

---

## 3. Local Execution Guide

### Prerequisites
- Node.js v18+ installed
- Google Chrome browser installed

### Step-by-Step Local Execution

1. Navigate to the web application root directory:
   ```bash
   cd dent_web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run Live Selenium E2E Automation Suite against deployed URL:
   ```bash
   BASE_URL=https://<github-username>.github.io/<repository-name>/ npm run test:e2e:live
   ```

4. View Reports:
   - Excel Reports: `dent_web/Test Results/Excel/`
   - HTML Dashboard: `dent_web/Test Results/HTML/dashboard.html`
   - Console & File Logs: `dent_web/Test Results/Logs/automation.log`
   - Screenshots: `dent_web/Test Results/Screenshots/`

---

## 4. Pass / Fail Quality Gate Rules

- **Success Criteria**:
  - Live deployment returns HTTP 200 OK AND
  - Overall test pass rate is **≥ 95.0%**
- **Failure Criteria**:
  - Live deployment fails or returns HTTP 4xx/5xx OR
  - Overall test pass rate is **< 95.0%**

---

## 5. Troubleshooting Guide

### Issue: ChromeDriver version mismatch
- **Symptom**: `SessionNotCreatedError: session not created: This version of ChromeDriver only supports Chrome version X`.
- **Solution**: In CI, `chromium-browser` and `google-chrome` are configured automatically. Locally, ensure Chrome is updated to the latest version.

### Issue: BASE_URL returning HTTP 404
- **Symptom**: Stage 6 times out waiting for HTTP 200.
- **Solution**: Ensure GitHub Pages source is set to **GitHub Actions** in Repository Settings > Pages.

### Issue: Excel file locked or write failure
- **Symptom**: `EBUSY: resource busy or locked, open ... Automation_Test_Report.xlsx`.
- **Solution**: Close any open Excel applications viewing the generated file before re-running locally.
