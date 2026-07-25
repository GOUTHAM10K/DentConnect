# DentConnect Selenium Test Runner
# Run this script from the dent_web/tests directory

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   DentConnect Selenium Test Suite" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Node.js: $(node --version)" -ForegroundColor Green

# Check if dev server is running
Write-Host ""
Write-Host "Checking dev server at http://localhost:5173 ..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[OK] Dev server is running!" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Dev server does not appear to be running!" -ForegroundColor Red
    Write-Host "Please start it first: cd ..\  then  npm run dev" -ForegroundColor Yellow
    $answer = Read-Host "Continue anyway? (y/n)"
    if ($answer -ne 'y') { exit 1 }
}

# Install dependencies
Write-Host ""
Write-Host "Installing test dependencies..." -ForegroundColor Yellow
Set-Location $PSScriptRoot
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dependencies installed!" -ForegroundColor Green

# Run all tests with HTML report
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Running All 23 Test Cases..." -ForegroundColor Cyan  
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

npx mocha --timeout 120000 --reporter spec "tests/**/*.test.js"

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Generating HTML Report..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Generate mochawesome HTML report
npx mocha --timeout 120000 --reporter mochawesome --reporter-options "reportDir=report,reportFilename=index,overwrite=true" "tests/**/*.test.js" 2>&1 | Out-Null

if (Test-Path "report\index.html") {
    Write-Host "[OK] HTML Report generated: report\index.html" -ForegroundColor Green
    Write-Host "Opening report..." -ForegroundColor Yellow
    Start-Process "report\index.html"
}

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "   ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
} else {
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host "   SOME TESTS FAILED - check report" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Red
}
Write-Host ""

exit $exitCode
