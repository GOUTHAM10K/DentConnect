export function generate400TestCases() {
  const categories = [
    { name: 'Authentication', code: 'AUTH', count: 40, priority: 'High' },
    { name: 'Authorization', code: 'AZ', count: 40, priority: 'High' },
    { name: 'Navigation', code: 'NAV', count: 30, priority: 'Medium' },
    { name: 'UI Validation', code: 'UI', count: 50, priority: 'Medium' },
    { name: 'Forms', code: 'FORM', count: 50, priority: 'High' },
    { name: 'CRUD Operations', code: 'CRUD', count: 50, priority: 'High' },
    { name: 'Input Validation', code: 'VAL', count: 40, priority: 'Medium' },
    { name: 'Error Handling', code: 'ERR', count: 20, priority: 'High' },
    { name: 'Session Management', code: 'SESS', count: 20, priority: 'High' },
    { name: 'File Upload', code: 'FILE', count: 20, priority: 'Medium' },
    { name: 'Accessibility', code: 'A11Y', count: 20, priority: 'Low' },
    { name: 'Responsive Design', code: 'RESP', count: 20, priority: 'Medium' },
    { name: 'Performance Smoke Tests', code: 'PERF', count: 20, priority: 'High' },
    { name: 'Regression', code: 'REG', count: 50, priority: 'High' }
  ];

  const testCases = [];

  categories.forEach(cat => {
    for (let i = 1; i <= cat.count; i++) {
      const id = `TC-${cat.code}-${String(i).padStart(3, '0')}`;
      testCases.push({
        id,
        module: cat.name,
        name: `${cat.name} Scenario #${i} Verification`,
        priority: cat.priority,
        preconditions: `User is on LIVE application environment`,
        steps: [
          `1. Navigate to live base URL`,
          `2. Locate ${cat.name} component element #${i}`,
          `3. Execute user interaction step ${i}`,
          `4. Assert DOM state and response status`
        ],
        expectedResult: `${cat.name} step ${i} executes successfully without console errors`,
        category: cat.code
      });
    }
  });

  return testCases;
}
