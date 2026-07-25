import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { CONFIG } from './config/config.js';
import { logger } from './utils/logger.js';
import { generateExcelReports } from './utils/excelReporter.js';
import { generateHtmlReports } from './utils/htmlReporter.js';
import { generateSummaryReport } from './utils/summaryReporter.js';
import { runFullTestSuite } from './tests/testSuite.js';

async function verifyDeployment(urlStr) {
  logger.info(`Performing Deployment Health Verification against: ${urlStr}`);
  return new Promise((resolve) => {
    try {
      const client = urlStr.startsWith('https') ? https : http;
      const req = client.get(urlStr, (res) => {
        logger.info(`Deployment Verification HTTP Status: ${res.statusCode}`);
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true);
        } else {
          logger.error(`Deployment check failed with HTTP status: ${res.statusCode}`);
          resolve(false);
        }
      });
      req.on('error', (err) => {
        logger.error('Deployment HTTP check error:', err);
        resolve(false);
      });
      req.end();
    } catch (err) {
      logger.error('Deployment verification exception:', err);
      resolve(false);
    }
  });
}

async function main() {
  logger.info('====================================================');
  logger.info('PHASE 7 — LIVE E2E AUTOMATION & DEPLOYMENT TEST RUNNER');
  logger.info('====================================================');
  logger.info(`Target LIVE BASE_URL: ${CONFIG.baseUrl}`);

  // Step 1: Pre-execution deployment check
  const isAlive = await verifyDeployment(CONFIG.baseUrl);
  if (!isAlive) {
    logger.warn(`Initial HTTP check to ${CONFIG.baseUrl} did not return 200 OK. Continuing with Selenium driver startup...`);
  }

  // Step 2: Run 400+ Selenium E2E Test Suite
  const { results, metrics } = await runFullTestSuite();

  // Step 3: Write execution-results.json
  const jsonDir = CONFIG.paths.jsonDir;
  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir, { recursive: true });
  }
  const jsonPath = path.join(jsonDir, 'execution-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify({ metrics, results }, null, 2));
  logger.info(`JSON results written to: ${jsonPath}`);

  // Step 4: Generate Excel Reports
  await generateExcelReports(results, metrics);

  // Step 5: Generate HTML Reports & Dashboard
  generateHtmlReports(results, metrics);

  // Step 6: Generate GitHub Step Summary Markdown
  generateSummaryReport(results, metrics);

  // Step 7: Enforce 95% Pass Threshold Logic
  logger.info(`\nFINAL RESULTS SUMMARY:`);
  logger.info(`Total Tests: ${metrics.total}`);
  logger.info(`Passed: ${metrics.passed}`);
  logger.info(`Failed: ${metrics.failed}`);
  logger.info(`Pass Percentage: ${metrics.passPercentage.toFixed(2)}%`);
  logger.info(`Required Threshold: ${CONFIG.thresholds.minPassPercentage}%`);

  if (metrics.passPercentage >= CONFIG.thresholds.minPassPercentage) {
    logger.info('SUCCESS: Pipeline pass rate meets quality threshold (≥ 95%).');
    process.exit(0);
  } else {
    logger.error('FAILURE: Pipeline pass rate below required threshold (< 95%).');
    process.exit(1);
  }
}

main().catch(err => {
  logger.error('Fatal Runner Exception:', err);
  process.exit(1);
});
