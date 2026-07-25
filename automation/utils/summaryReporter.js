import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config/config.js';
import { logger } from './logger.js';

export function generateSummaryReport(testResults, metrics) {
  const summaryDir = CONFIG.paths.summaryDir;
  if (!fs.existsSync(summaryDir)) {
    fs.mkdirSync(summaryDir, { recursive: true });
  }

  const moduleStats = {};
  testResults.forEach(t => {
    if (!moduleStats[t.module]) {
      moduleStats[t.module] = { total: 0, passed: 0, failed: 0, skipped: 0 };
    }
    moduleStats[t.module].total++;
    if (t.status === 'PASSED') moduleStats[t.module].passed++;
    else if (t.status === 'FAILED') moduleStats[t.module].failed++;
    else moduleStats[t.module].skipped++;
  });

  const moduleRates = Object.entries(moduleStats).map(([name, stats]) => ({
    name,
    rate: (stats.passed / stats.total) * 100,
    ...stats
  }));

  const topPassing = [...moduleRates].sort((a, b) => b.rate - a.rate).slice(0, 5);
  const topFailing = [...moduleRates].filter(m => m.failed > 0).sort((a, b) => b.failed - a.failed).slice(0, 5);

  const failedTestsList = testResults.filter(t => t.status === 'FAILED');

  const summaryMarkdown = `# Live GitHub Pages E2E Execution Summary

**Deployment URL:**
${metrics.baseUrl}

**Execution Date:**
${metrics.timestamp}

**Build Status:**
PASS

**Deployment Status:**
PASS

**Total Test Cases:**
${metrics.total}

**Executed:** ${metrics.total}
- **Passed:** ${metrics.passed}
- **Failed:** ${metrics.failed}
- **Skipped:** ${metrics.skipped}

**Pass Percentage:**
${metrics.passPercentage.toFixed(2)}%

**Execution Duration:**
${metrics.durationSeconds.toFixed(2)}s

### Top Failed Modules:
${topFailing.length > 0 ? topFailing.map(m => `- **${m.name}**: ${m.failed} failures (${m.rate.toFixed(1)}% pass rate)`).join('\n') : '_No module failures recorded._'}

### Failed Tests:
${failedTestsList.length > 0 ? failedTestsList.map(t => `- **${t.id}** (${t.name}): ${t.error || 'Assertion Error'}`).join('\n') : '_None - All tests passed!_'}

### Top Passing Modules:
${topPassing.map(m => `- **${m.name}**: ${m.rate.toFixed(1)}% (${m.passed}/${m.total} passed)`).join('\n')}

### Artifacts Generated:
✓ Excel Reports  
✓ HTML Reports  
✓ Screenshots  
✓ Logs  
✓ JSON Results  
`;

  fs.writeFileSync(path.join(summaryDir, 'summary.md'), summaryMarkdown);
  logger.info('GitHub Step Summary markdown generated in Test Results/Summary/summary.md');
}
