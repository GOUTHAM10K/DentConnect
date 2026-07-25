import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Defensive metric extractor helper checking both nested and flat schemas
export function getMetricValue(metricObj, key) {
  if (!metricObj) return 0;
  if (metricObj.values && metricObj.values[key] !== undefined) {
    return metricObj.values[key];
  }
  if (metricObj[key] !== undefined) {
    return metricObj[key];
  }
  return 0;
}

export function parseK6Summary(summaryPath, stepSummaryPath) {
  try {
    if (!fs.existsSync(summaryPath)) {
      console.log(`Summary file not found at: ${summaryPath}`);
      return;
    }

    const rawData = fs.readFileSync(summaryPath, 'utf8');
    const summary = JSON.parse(rawData);

    const metrics = summary.metrics || {};
    
    // Extract http_reqs metrics
    const reqsMetric = metrics.http_reqs || {};
    const totalRequests = getMetricValue(reqsMetric, 'count') || 0;
    const reqRate = getMetricValue(reqsMetric, 'rate') || 0;

    // Extract http_req_duration metrics
    const durationMetric = metrics.http_req_duration || {};
    const avgDuration = getMetricValue(durationMetric, 'avg') || 0;
    const minDuration = getMetricValue(durationMetric, 'min') || 0;
    const maxDuration = getMetricValue(durationMetric, 'max') || 0;
    const p95Duration = getMetricValue(durationMetric, 'p(95)') || getMetricValue(durationMetric, 'p95') || 0;

    // Extract failure & check rates
    const failedMetric = metrics.http_req_failed || {};
    const failRate = (getMetricValue(failedMetric, 'rate') * 100).toFixed(2);
    
    const checksMetric = metrics.checks || {};
    const checkPassRate = (getMetricValue(checksMetric, 'rate') * 100).toFixed(2);

    const rps = reqRate > 0 ? reqRate.toFixed(2) : (totalRequests / 60).toFixed(2);

    const markdownSummary = `
## 📈 k6 API Baseline & Load Test Execution Summary

| Metric Category | Performance Indicator | Value |
| :--- | :--- | :--- |
| **Virtual Users (VUs)** | Concurrent Users | **100 VUs** |
| **Test Duration** | Run Time | **1 Minute (60s)** |
| **Total Requests Sent** | HTTP Requests | **${totalRequests.toLocaleString()}** |
| **Throughput (RPS)** | Requests per Second | **${rps} req/sec** |
| **Average Response Time** | Latency (Avg) | **${avgDuration.toFixed(2)} ms** |
| **Min Response Time** | Latency (Min) | **${minDuration.toFixed(2)} ms** |
| **Max Response Time** | Latency (Max) | **${maxDuration.toFixed(2)} ms** |
| **95th Percentile (p95)** | Latency (p95) | **${p95Duration.toFixed(2)} ms** |
| **Failure Rate** | HTTP Errors | **${failRate}%** |
| **Check Pass Rate** | Assertions | **${checkPassRate}%** |

> **Quality Gate Assessment**: ${failRate < 5.0 && p95Duration < 1500 ? '✅ **PASSED** (Failure rate < 5%, p95 < 1500ms)' : '❌ **FAILED** (Threshold exceeded)'}
`;

    console.log(markdownSummary);

    if (stepSummaryPath) {
      fs.appendFileSync(stepSummaryPath, markdownSummary);
      console.log(`Summary written to GITHUB_STEP_SUMMARY: ${stepSummaryPath}`);
    }

    // Save copy in summary directory
    const outputSummaryDir = path.resolve(__dirname, '../../Test Results/Summary');
    if (!fs.existsSync(outputSummaryDir)) {
      fs.mkdirSync(outputSummaryDir, { recursive: true });
    }
    fs.writeFileSync(path.join(outputSummaryDir, 'load-test-summary.md'), markdownSummary);

  } catch (err) {
    console.error('Error parsing k6 summary JSON:', err);
  }
}

// CLI execution if executed directly
if (process.argv[1] && process.argv[1].includes('parseK6Summary')) {
  const summaryFile = process.argv[2] || path.resolve(__dirname, '../../summary.json');
  const stepSummaryFile = process.env.GITHUB_STEP_SUMMARY;
  parseK6Summary(summaryFile, stepSummaryFile);
}
