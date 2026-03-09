#!/usr/bin/env pwsh
# Test Runner Script - Runs all tests and generates coverage reports

param(
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$Coverage,
    [switch]$Watch,
    [switch]$Verbose
)

Write-Host "================================" -ForegroundColor Cyan
Write-Host " HedgeAI Test Suite Runner" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$testResults = @{
    Backend = $null
    Frontend = $null
    Success = $true
}

function Run-BackendTests {
    Write-Host "[BACKEND] Running tests..." -ForegroundColor Yellow
    Write-Host ""
    
    Push-Location backend
    
    try {
        if ($Watch) {
            npm test -- --watch
        } elseif ($Coverage) {
            npm test -- --coverage --verbose=$Verbose
            
            Write-Host ""
            Write-Host "[BACKEND] Coverage report generated at: backend/coverage/index.html" -ForegroundColor Green
            
            if (Test-Path "coverage/coverage-summary.json") {
                $summary = Get-Content "coverage/coverage-summary.json" | ConvertFrom-Json
                $total = $summary.total
                
                Write-Host ""
                Write-Host "Coverage Summary:" -ForegroundColor Cyan
                Write-Host "  Lines      : $($total.lines.pct)%" -ForegroundColor $(if ($total.lines.pct -ge 90) { "Green" } else { "Yellow" })
                Write-Host "  Statements : $($total.statements.pct)%" -ForegroundColor $(if ($total.statements.pct -ge 90) { "Green" } else { "Yellow" })
                Write-Host "  Functions  : $($total.functions.pct)%" -ForegroundColor $(if ($total.functions.pct -ge 90) { "Green" } else { "Yellow" })
                Write-Host "  Branches   : $($total.branches.pct)%" -ForegroundColor $(if ($total.branches.pct -ge 90) { "Green" } else { "Yellow" })
            }
        } else {
            npm test -- --verbose=$Verbose
        }
        
        $testResults.Backend = $LASTEXITCODE
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "[BACKEND] ✅ All tests passed!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "[BACKEND] ❌ Some tests failed!" -ForegroundColor Red
            $testResults.Success = $false
        }
    }
    catch {
        Write-Host "[BACKEND] ❌ Error running tests: $_" -ForegroundColor Red
        $testResults.Backend = 1
        $testResults.Success = $false
    }
    finally {
        Pop-Location
    }
}

function Run-FrontendTests {
    Write-Host "[FRONTEND] Running tests..." -ForegroundColor Yellow
    Write-Host ""
    
    Push-Location frontend
    
    try {
        if ($Watch) {
            npm run test:watch
        } elseif ($Coverage) {
            npm run test:coverage -- --run
            
            Write-Host ""
            Write-Host "[FRONTEND] Coverage report generated at: frontend/coverage/index.html" -ForegroundColor Green
            
            if (Test-Path "coverage/coverage-summary.json") {
                $summary = Get-Content "coverage/coverage-summary.json" | ConvertFrom-Json
                $total = $summary.total
                
                Write-Host ""
                Write-Host "Coverage Summary:" -ForegroundColor Cyan
                Write-Host "  Lines      : $($total.lines.pct)%" -ForegroundColor $(if ($total.lines.pct -ge 90) { "Green" } else { "Yellow" })
                Write-Host "  Statements : $($total.statements.pct)%" -ForegroundColor $(if ($total.statements.pct -ge 90) { "Green" } else { "Yellow" })
                Write-Host "  Functions  : $($total.functions.pct)%" -ForegroundColor $(if ($total.functions.pct -ge 90) { "Green" } else { "Yellow" })
                Write-Host "  Branches   : $($total.branches.pct)%" -ForegroundColor $(if ($total.branches.pct -ge 90) { "Green" } else { "Yellow" })
            }
        } else {
            npm run test -- --run
        }
        
        $testResults.Frontend = $LASTEXITCODE
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "[FRONTEND] ✅ All tests passed!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "[FRONTEND] ❌ Some tests failed!" -ForegroundColor Red
            $testResults.Success = $false
        }
    }
    catch {
        Write-Host "[FRONTEND] ❌ Error running tests: $_" -ForegroundColor Red
        $testResults.Frontend = 1
        $testResults.Success = $false
    }
    finally {
        Pop-Location
    }
}

function Show-CoverageReports {
    Write-Host ""
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host " Opening Coverage Reports" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    
    if ($testResults.Backend -eq 0 -and (Test-Path "backend/coverage/index.html")) {
        Write-Host "Opening backend coverage report..." -ForegroundColor Yellow
        Start-Process "backend/coverage/index.html"
    }
    
    if ($testResults.Frontend -eq 0 -and (Test-Path "frontend/coverage/index.html")) {
        Write-Host "Opening frontend coverage report..." -ForegroundColor Yellow
        Start-Process "frontend/coverage/index.html"
    }
}

# Main execution
$startTime = Get-Date

if (-not $Backend -and -not $Frontend) {
    # Run both if neither specified
    $Backend = $true
    $Frontend = $true
}

if ($Backend) {
    Run-BackendTests
    Write-Host ""
}

if ($Frontend) {
    Run-FrontendTests
    Write-Host ""
}

$endTime = Get-Date
$duration = $endTime - $startTime

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host " Test Results Summary" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

if ($testResults.Backend -ne $null) {
    $status = if ($testResults.Backend -eq 0) { "✅ PASSED" } else { "❌ FAILED" }
    $color = if ($testResults.Backend -eq 0) { "Green" } else { "Red" }
    Write-Host "Backend Tests  : $status" -ForegroundColor $color
}

if ($testResults.Frontend -ne $null) {
    $status = if ($testResults.Frontend -eq 0) { "✅ PASSED" } else { "❌ FAILED" }
    $color = if ($testResults.Frontend -eq 0) { "Green" } else { "Red" }
    Write-Host "Frontend Tests : $status" -ForegroundColor $color
}

Write-Host ""
Write-Host "Total Duration : $($duration.TotalSeconds.ToString('0.00')) seconds" -ForegroundColor Cyan
Write-Host ""

if ($Coverage -and -not $Watch) {
    $response = Read-Host "Open coverage reports in browser? (y/n)"
    if ($response -eq 'y') {
        Show-CoverageReports
    }
}

# Exit with appropriate code
if ($testResults.Success) {
    Write-Host "✅ All tests completed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Some tests failed. Please review the output above." -ForegroundColor Red
    exit 1
}
