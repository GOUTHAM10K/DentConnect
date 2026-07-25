import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config/config.js';
import { logger } from './logger.js';

export async function generateExcelReports(testResults, metrics) {
  const excelDir = CONFIG.paths.excelDir;
  if (!fs.existsSync(excelDir)) {
    fs.mkdirSync(excelDir, { recursive: true });
  }

  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F4E79' }
  };
  const headerFont = { color: { argb: 'FFFFFFFF' }, bold: true };

  // 1. Generate Automation_Test_Report.xlsx
  const mainWorkbook = new ExcelJS.Workbook();
  
  // Sheet 1: Executed Test Cases
  const sheetExecuted = mainWorkbook.addWorksheet('Executed Test Cases');
  sheetExecuted.columns = [
    { header: 'Test ID', key: 'id', width: 15 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Test Name', key: 'name', width: 45 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Execution Time (s)', key: 'duration', width: 20 },
    { header: 'Priority', key: 'priority', width: 15 }
  ];
  sheetExecuted.getRow(1).eachCell(cell => {
    cell.fill = headerFill;
    cell.font = headerFont;
  });

  // Sheet 2: Passed Tests
  const sheetPassed = mainWorkbook.addWorksheet('Passed Tests');
  sheetPassed.columns = sheetExecuted.columns;
  sheetPassed.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; });

  // Sheet 3: Failed Tests
  const sheetFailed = mainWorkbook.addWorksheet('Failed Tests');
  sheetFailed.columns = [
    ...sheetExecuted.columns,
    { header: 'Failure Reason', key: 'error', width: 45 },
    { header: 'Screenshot', key: 'screenshot', width: 30 }
  ];
  sheetFailed.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; });

  // Sheet 4: Skipped Tests
  const sheetSkipped = mainWorkbook.addWorksheet('Skipped Tests');
  sheetSkipped.columns = sheetExecuted.columns;
  sheetSkipped.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; });

  // Sheet 5: Execution Metrics
  const sheetMetrics = mainWorkbook.addWorksheet('Execution Metrics');
  sheetMetrics.columns = [
    { header: 'Metric Name', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 30 }
  ];
  sheetMetrics.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; });

  sheetMetrics.addRows([
    { metric: 'Total Executed Tests', value: metrics.total },
    { metric: 'Passed Tests', value: metrics.passed },
    { metric: 'Failed Tests', value: metrics.failed },
    { metric: 'Skipped Tests', value: metrics.skipped },
    { metric: 'Blocked Tests', value: metrics.blocked || 0 },
    { metric: 'Pass Rate (%)', value: `${metrics.passPercentage.toFixed(2)}%` },
    { metric: 'Total Duration (s)', value: `${metrics.durationSeconds.toFixed(2)}s` },
    { metric: 'Execution Environment', value: metrics.baseUrl }
  ]);

  // Sheet 6: Defect Summary
  const sheetDefects = mainWorkbook.addWorksheet('Defect Summary');
  sheetDefects.columns = [
    { header: 'Defect ID', key: 'defectId', width: 15 },
    { header: 'Test ID', key: 'testId', width: 15 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Failure Description', key: 'description', width: 50 },
    { header: 'Severity', key: 'severity', width: 15 }
  ];
  sheetDefects.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; });

  let defectCount = 1;
  testResults.forEach(test => {
    const rowData = {
      id: test.id,
      module: test.module,
      name: test.name,
      status: test.status,
      duration: (test.duration / 1000).toFixed(2),
      priority: test.priority
    };
    sheetExecuted.addRow(rowData);

    if (test.status === 'PASSED') {
      sheetPassed.addRow(rowData);
    } else if (test.status === 'FAILED') {
      sheetFailed.addRow({
        ...rowData,
        error: test.error || 'Assertion failed',
        screenshot: test.screenshot || 'N/A'
      });
      sheetDefects.addRow({
        defectId: `DEF-${String(defectCount++).padStart(3, '0')}`,
        testId: test.id,
        module: test.module,
        description: test.error || 'Functional assertion failure',
        severity: test.priority === 'High' || test.priority === 'Critical' ? 'High' : 'Medium'
      });
    } else if (test.status === 'SKIPPED') {
      sheetSkipped.addRow(rowData);
    }
  });

  const mainPath = path.join(excelDir, 'Automation_Test_Report.xlsx');
  await mainWorkbook.xlsx.writeFile(mainPath);

  // 2. Generate Failed_Test_Cases.xlsx
  const failedWorkbook = new ExcelJS.Workbook();
  const failedSheet = failedWorkbook.addWorksheet('Failed Test Cases');
  failedSheet.columns = sheetFailed.columns;
  failedSheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; });
  testResults.filter(t => t.status === 'FAILED').forEach(t => {
    failedSheet.addRow({
      id: t.id,
      module: t.module,
      name: t.name,
      status: t.status,
      duration: (t.duration / 1000).toFixed(2),
      priority: t.priority,
      error: t.error || 'Failed',
      screenshot: t.screenshot || 'N/A'
    });
  });
  await failedWorkbook.xlsx.writeFile(path.join(excelDir, 'Failed_Test_Cases.xlsx'));

  // 3. Generate Passed_Test_Cases.xlsx
  const passedWorkbook = new ExcelJS.Workbook();
  const passedSheet = passedWorkbook.addWorksheet('Passed Test Cases');
  passedSheet.columns = sheetPassed.columns;
  passedSheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; });
  testResults.filter(t => t.status === 'PASSED').forEach(t => {
    passedSheet.addRow({
      id: t.id,
      module: t.module,
      name: t.name,
      status: t.status,
      duration: (t.duration / 1000).toFixed(2),
      priority: t.priority
    });
  });
  await passedWorkbook.xlsx.writeFile(path.join(excelDir, 'Passed_Test_Cases.xlsx'));

  // 4. Generate Summary_Report.xlsx
  const summaryWorkbook = new ExcelJS.Workbook();
  const summarySheet = summaryWorkbook.addWorksheet('Executive Summary');
  summarySheet.columns = sheetMetrics.columns;
  summarySheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; });
  sheetMetrics.eachRow((row, rowNumber) => {
    if (rowNumber > 1) summarySheet.addRow(row.values.slice(1));
  });
  await summaryWorkbook.xlsx.writeFile(path.join(excelDir, 'Summary_Report.xlsx'));

  logger.info('Excel reports generated successfully in Test Results/Excel/');
}
