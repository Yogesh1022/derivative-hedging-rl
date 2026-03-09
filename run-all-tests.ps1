# HedgeAI Testing Implementation - Run All Tests
# This script runs all test suites across the platform

Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        HedgeAI Trading Platform - Test Suite Runner              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$totalTests = 0
$passedTests = 0
$failedTests = 0

# Function to display section header
function Write-SectionHeader {
    param([string]$Title)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "  $Title" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""
}

# Check if dependencies are installed
Write-SectionHeader "Checking Dependencies"

if (-not (Test-Path "backend/node_modules")) {
    Write-Host "⚠️  Backend dependencies not found. Installing..." -ForegroundColor Yellow
    Push-Location backend
    npm install
    Pop-Location
}

if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "⚠️  Frontend dependencies not found. Installing..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
}

Write-Host "✅ Dependencies check complete" -ForegroundColor Green

# Run Backend Tests
Write-SectionHeader "Running Backend Tests (Jest + Supertest)"

Push-Location backend
Write-Host "📦 Location: backend/" -ForegroundColor Cyan
Write-Host "🧪 Framework: Jest + Supertest" -ForegroundColor Cyan
Write-Host "🎯 Target Coverage: 80%+" -ForegroundColor Cyan
Write-Host ""

npm test 2>&1 | Tee-Object -Variable backendOutput
$backendExitCode = $LASTEXITCODE

if ($backendExitCode -eq 0) {
    Write-Host "✅ Backend tests PASSED" -ForegroundColor Green
    $passedTests++
} else {
    Write-Host "❌ Backend tests FAILED" -ForegroundColor Red
    $failedTests++
}

Pop-Location

# Run Backend Coverage
Write-SectionHeader "Backend Test Coverage"

Push-Location backend
npm run test:coverage 2>&1 | Select-Object -Last 20
Pop-Location

# Run Frontend Unit Tests
Write-SectionHeader "Running Frontend Tests (Vitest + RTL)"

Push-Location frontend
Write-Host "📦 Location: frontend/" -ForegroundColor Cyan
Write-Host "🧪 Framework: Vitest + React Testing Library" -ForegroundColor Cyan
Write-Host "🎯 Target Coverage: 70%+" -ForegroundColor Cyan
Write-Host ""

npm test -- --run 2>&1 | Tee-Object -Variable frontendOutput
$frontendExitCode = $LASTEXITCODE

if ($frontendExitCode -eq 0) {
    Write-Host "✅ Frontend tests PASSED" -ForegroundColor Green
    $passedTests++
} else {
    Write-Host "❌ Frontend tests FAILED" -ForegroundColor Red
    $failedTests++
}

Pop-Location

# Run Frontend Coverage
Write-SectionHeader "Frontend Test Coverage"

Push-Location frontend
npm run test:coverage -- --run 2>&1 | Select-Object -Last 20
Pop-Location

# Check if Playwright is installed
Write-SectionHeader "Running E2E Tests (Playwright)"

Push-Location frontend

$playwrightInstalled = Test-Path "node_modules/@playwright/test"

if (-not $playwrightInstalled) {
    Write-Host "⚠️  Playwright not installed. Installing..." -ForegroundColor Yellow
    npm install @playwright/test
    npx playwright install
}

Write-Host "📦 Location: frontend/e2e/" -ForegroundColor Cyan
Write-Host "🧪 Framework: Playwright" -ForegroundColor Cyan
Write-Host "🎯 Coverage: Key user journeys" -ForegroundColor Cyan
Write-Host "🌐 Browsers: Chromium, Firefox, WebKit" -ForegroundColor Cyan
Write-Host ""

Write-Host "ℹ️  E2E tests require services to be running:" -ForegroundColor Yellow
Write-Host "   - Frontend: http://localhost:5174" -ForegroundColor Gray
Write-Host "   - Backend: http://localhost:5000" -ForegroundColor Gray
Write-Host "   - ML Service: http://localhost:8000" -ForegroundColor Gray
Write-Host ""

$runE2E = Read-Host "Run E2E tests? (y/N)"

if ($runE2E -eq "y" -or $runE2E -eq "Y") {
    npm run test:e2e 2>&1 | Tee-Object -Variable e2eOutput
    $e2eExitCode = $LASTEXITCODE

    if ($e2eExitCode -eq 0) {
        Write-Host "✅ E2E tests PASSED" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "❌ E2E tests FAILED" -ForegroundColor Red
        $failedTests++
    }
} else {
    Write-Host "⏭️  Skipped E2E tests" -ForegroundColor Yellow
}

Pop-Location

# Summary
Write-SectionHeader "Test Summary"

$totalTests = $passedTests + $failedTests

Write-Host "📊 Test Results:" -ForegroundColor Cyan
Write-Host "   Total Suites:  $totalTests" -ForegroundColor White
Write-Host "   Passed:        $passedTests" -ForegroundColor Green
Write-Host "   Failed:        $failedTests" -ForegroundColor Red
Write-Host ""

if ($failedTests -eq 0 -and $passedTests -gt 0) {
    Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Backend Tests: PASSED" -ForegroundColor Green
    Write-Host "✅ Frontend Tests: PASSED" -ForegroundColor Green
    if ($runE2E -eq "y" -or $runE2E -eq "Y") {
        Write-Host "✅ E2E Tests: PASSED" -ForegroundColor Green
    }
} elseif ($failedTests -gt 0) {
    Write-Host "⚠️  SOME TESTS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please review the output above for details." -ForegroundColor Yellow
} else {
    Write-Host "ℹ️  No tests were run" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test Coverage Reports:" -ForegroundColor Cyan
Write-Host "  - Backend: backend/coverage/lcov-report/index.html" -ForegroundColor Gray
Write-Host "  - Frontend: frontend/coverage/index.html" -ForegroundColor Gray
Write-Host "  - E2E: frontend/playwright-report/index.html" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 For more information, see TESTING_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
