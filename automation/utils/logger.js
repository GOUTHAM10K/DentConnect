import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config/config.js';

class Logger {
  constructor() {
    this.logDir = CONFIG.paths.logsDir;
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    this.logFilePath = path.join(this.logDir, 'automation.log');
    // Clear log file at start
    fs.writeFileSync(this.logFilePath, `=== DentConnect Selenium E2E Automation Log - ${new Date().toISOString()} ===\n\n`);
  }

  formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  log(level, message) {
    const formatted = this.formatMessage(level, message);
    console.log(formatted);
    try {
      fs.appendFileSync(this.logFilePath, formatted + '\n');
    } catch (e) {
      console.error('Failed writing to log file:', e);
    }
  }

  info(message) {
    this.log('INFO', message);
  }

  warn(message) {
    this.log('WARN', message);
  }

  error(message, errorObj = null) {
    let errStr = message;
    if (errorObj) {
      errStr += ` | Error: ${errorObj.message || errorObj}`;
      if (errorObj.stack) {
        errStr += `\nStack: ${errorObj.stack}`;
      }
    }
    this.log('ERROR', errStr);
  }

  debug(message) {
    this.log('DEBUG', message);
  }

  step(stepNumber, description) {
    this.log('STEP', `Step ${stepNumber}: ${description}`);
  }
}

export const logger = new Logger();
