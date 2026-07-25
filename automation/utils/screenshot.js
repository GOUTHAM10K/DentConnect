import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config/config.js';
import { logger } from './logger.js';

export async function captureScreenshot(driver, testId, label = 'failure') {
  try {
    if (!driver) return null;
    const screenshotsDir = CONFIG.paths.screenshotsDir;
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    const cleanId = String(testId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${cleanId}_${label}_${timestamp}.png`;
    const filePath = path.join(screenshotsDir, fileName);

    const image = await driver.takeScreenshot();
    fs.writeFileSync(filePath, image, 'base64');
    logger.info(`Screenshot captured for test ${testId}: ${fileName}`);
    return fileName;
  } catch (err) {
    logger.error(`Failed to capture screenshot for test ${testId}:`, err);
    return null;
  }
}
