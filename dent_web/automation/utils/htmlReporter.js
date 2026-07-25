import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config/config.js';
import { logger } from './logger.js';

export function generateHtmlReports(testResults, metrics) {
  const htmlDir = CONFIG.paths.htmlDir;
  if (!fs.existsSync(htmlDir)) {
    fs.mkdirSync(htmlDir, { recursive: true });
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

  // 1. execution-report.html
  const executionHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DentConnect Live E2E Automation Test Report</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
    .header { background: linear-gradient(135deg, #0284c7, #0f172a); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header h1 { margin: 0 0 8px 0; font-size: 28px; }
    .header p { margin: 0; opacity: 0.9; font-size: 14px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .metric-card { background: white; padding: 20px; border-radius: 10px; border-left: 5px solid #0284c7; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center; }
    .metric-card.pass { border-left-color: #10b981; }
    .metric-card.fail { border-left-color: #ef4444; }
    .metric-card.skip { border-left-color: #f59e0b; }
    .metric-card .val { font-size: 32px; font-weight: bold; margin-top: 4px; }
    .metric-card .lbl { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; }
    .table-container { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 24px; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #f1f5f9; padding: 12px; font-size: 13px; color: #475569; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .badge.passed { background: #d1fae5; color: #047857; }
    .badge.failed { background: #fee2e2; color: #b91c1c; }
    .badge.skipped { background: #fef3c7; color: #b45309; }
    .error-msg { font-family: monospace; font-size: 12px; color: #dc2626; background: #fff1f2; padding: 8px; border-radius: 4px; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>DentConnect Live E2E Automation Execution Report</h1>
    <p>Target URL: <strong>${metrics.baseUrl}</strong> | Executed: ${metrics.timestamp}</p>
  </div>

  <div class="metrics-grid">
    <div class="metric-card"><div class="lbl">Total Tests</div><div class="val">${metrics.total}</div></div>
    <div class="metric-card pass"><div class="lbl">Passed</div><div class="val">${metrics.passed}</div></div>
    <div class="metric-card fail"><div class="lbl">Failed</div><div class="val">${metrics.failed}</div></div>
    <div class="metric-card skip"><div class="lbl">Skipped</div><div class="val">${metrics.skipped}</div></div>
    <div class="metric-card pass"><div class="lbl">Pass Rate</div><div class="val">${metrics.passPercentage.toFixed(1)}%</div></div>
  </div>

  <div class="table-container">
    <h2>Execution Results Breakdown (${testResults.length} Tests)</h2>
    <table>
      <thead>
        <tr>
          <th>Test ID</th>
          <th>Module</th>
          <th>Test Name</th>
          <th>Priority</th>
          <th>Duration</th>
          <th>Status</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        ${testResults.map(t => `
        <tr>
          <td><strong>${t.id}</strong></td>
          <td>${t.module}</td>
          <td>${t.name}</td>
          <td>${t.priority}</td>
          <td>${(t.duration / 1000).toFixed(2)}s</td>
          <td><span class="badge ${t.status.toLowerCase()}">${t.status}</span></td>
          <td>${t.error ? `<div class="error-msg">${t.error}</div>` : 'Pass'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(htmlDir, 'execution-report.html'), executionHtml);

  // 2. dashboard.html
  const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DentConnect Live E2E Test Dashboard</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    .title { font-size: 28px; font-weight: bold; margin-bottom: 24px; color: #38bdf8; display: flex; justify-content: space-between; align-items: center; }
    .status-banner { background: ${metrics.passPercentage >= 95 ? '#065f46' : '#991b1b'}; color: white; padding: 16px 24px; border-radius: 8px; font-weight: bold; margin-bottom: 24px; font-size: 18px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    .card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; }
    .card h3 { margin-top: 0; color: #94a3b8; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; }
    .module-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; font-size: 14px; }
    .progress-bar { height: 8px; background: #334155; border-radius: 4px; overflow: hidden; margin-top: 4px; }
    .progress-fill { height: 100%; background: #10b981; }
  </style>
</head>
<body>
  <div class="title">
    <span>DentConnect E2E Live Quality Dashboard</span>
    <span style="font-size: 14px; color: #94a3b8;">URL: ${metrics.baseUrl}</span>
  </div>

  <div class="status-banner">
    OVERALL STATUS: ${metrics.passPercentage >= 95 ? 'PASSED (≥ 95% Pass Rate)' : 'FAILED (< 95% Pass Rate)'} — ${metrics.passPercentage.toFixed(2)}% Success Rate
  </div>

  <div class="grid">
    <div class="card">
      <h3>Module Pass Rates</h3>
      ${Object.entries(moduleStats).map(([mod, data]) => {
        const rate = (data.passed / data.total) * 100;
        return `
        <div style="margin-bottom: 12px;">
          <div class="module-row">
            <span>${mod} (${data.passed}/${data.total})</span>
            <span style="font-weight: bold; color: ${rate >= 95 ? '#34d399' : '#f87171'}">${rate.toFixed(0)}%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width: ${rate}%; background: ${rate >= 95 ? '#10b981' : '#ef4444'};"></div></div>
        </div>
        `;
      }).join('')}
    </div>

    <div class="card">
      <h3>Summary Metrics</h3>
      <div class="module-row"><span>Total Test Cases</span><strong>${metrics.total}</strong></div>
      <div class="module-row"><span>Passed</span><strong style="color: #34d399">${metrics.passed}</strong></div>
      <div class="module-row"><span>Failed</span><strong style="color: #f87171">${metrics.failed}</strong></div>
      <div class="module-row"><span>Skipped</span><strong style="color: #fbbf24">${metrics.skipped}</strong></div>
      <div class="module-row"><span>Duration</span><strong>${metrics.durationSeconds.toFixed(1)}s</strong></div>
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(htmlDir, 'dashboard.html'), dashboardHtml);
  logger.info('HTML reports generated successfully in Test Results/HTML/');
}
