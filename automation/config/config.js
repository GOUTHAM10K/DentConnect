import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
  // MUST always default to or consume process.env.BASE_URL.
  // Never run Selenium against localhost per mandatory requirements.
  baseUrl: process.env.BASE_URL || 'https://GOUTHAM10K.github.io/DentConnect/',
  
  headless: process.env.SELENIUM_HEADLESS === 'true' || process.env.CI === 'true',
  
  timeouts: {
    implicit: 10000,
    explicit: 15000,
    pageLoad: 30000,
    script: 15000
  },
  
  retries: 2,
  
  thresholds: {
    minPassPercentage: 95.0,
    maxCriticalFailures: 0
  },
  
  paths: {
    baseDir: path.resolve(__dirname, '../..'),
    resultsDir: path.resolve(__dirname, '../../Test Results'),
    excelDir: path.resolve(__dirname, '../../Test Results/Excel'),
    htmlDir: path.resolve(__dirname, '../../Test Results/HTML'),
    jsonDir: path.resolve(__dirname, '../../Test Results/JSON'),
    summaryDir: path.resolve(__dirname, '../../Test Results/Summary'),
    screenshotsDir: path.resolve(__dirname, '../../Test Results/Screenshots'),
    logsDir: path.resolve(__dirname, '../../Test Results/Logs')
  }
};
