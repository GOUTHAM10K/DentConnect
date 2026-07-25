import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const resultsDir = path.join(rootDir, 'test-results');
fs.mkdirSync(resultsDir, { recursive: true });

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: rootDir, stdio: 'inherit', shell: true, ...options });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

async function main() {
  try {
    await run('npm', ['run', 'test:unit']);
    await run('npm', ['run', 'test:security']);
    await run('npm', ['run', 'test:e2e']);
    await run('node', ['scripts/generateTestReport.mjs']);
    fs.writeFileSync(path.join(resultsDir, 'summary.json'), JSON.stringify({
      status: 'passed',
      generatedAt: new Date().toISOString(),
      report: 'test-reports/E2E_Test_Report_DentConnect.xlsx',
    }, null, 2));
    console.log('QA suite completed successfully.');
  } catch (error) {
    fs.writeFileSync(path.join(resultsDir, 'summary.json'), JSON.stringify({
      status: 'failed',
      error: error.message,
      generatedAt: new Date().toISOString(),
    }, null, 2));
    console.error(error.message);
    process.exit(1);
  }
}

main();
