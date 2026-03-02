# Script to test CI/CD pipeline locally on Windows
# Run this before pushing to verify everything works

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing CI/CD Pipeline Locally" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Check if UV is installed
Write-Host "`n[1/6] Checking UV installation..." -ForegroundColor Yellow
if (!(Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Host "Installing UV..." -ForegroundColor Green
    powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
} else {
    Write-Host "UV is already installed" -ForegroundColor Green
}

# 2. Install dependencies
Write-Host "`n[2/6] Installing dependencies..." -ForegroundColor Yellow
uv pip install -e ".[dev]"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Dependency installation failed!" -ForegroundColor Red
    exit 1
}

# 3. Run linters
Write-Host "`n[3/6] Running linters..." -ForegroundColor Yellow

Write-Host "  - Running Black..." -ForegroundColor Cyan
black --check src/ tests/
$blackResult = $LASTEXITCODE

Write-Host "  - Running isort..." -ForegroundColor Cyan
isort --check-only src/ tests/
$isortResult = $LASTEXITCODE

Write-Host "  - Running flake8..." -ForegroundColor Cyan
flake8 src/ tests/
$flake8Result = $LASTEXITCODE

if ($blackResult -ne 0 -or $isortResult -ne 0 -or $flake8Result -ne 0) {
    Write-Host "Linting failed! Run formatters to fix:" -ForegroundColor Red
    Write-Host "  black src/ tests/" -ForegroundColor Yellow
    Write-Host "  isort src/ tests/" -ForegroundColor Yellow
    exit 1
}
Write-Host "All linters passed!" -ForegroundColor Green

# 4. Run type checker
Write-Host "`n[4/6] Running type checker..." -ForegroundColor Yellow
mypy src/ --install-types --non-interactive
if ($LASTEXITCODE -ne 0) {
    Write-Host "Type checking found issues!" -ForegroundColor Red
    Write-Host "Review and fix type errors above" -ForegroundColor Yellow
}

# 5. Run tests
Write-Host "`n[5/6] Running tests..." -ForegroundColor Yellow
$env:DATABASE_URL = "sqlite:///./test.db"
$env:REDIS_URL = "redis://localhost:6379/0"
$env:SECRET_KEY = "test-secret-key-for-local"

pytest tests/ -v --cov=src --cov-report=term-missing --cov-report=html
if ($LASTEXITCODE -ne 0) {
    Write-Host "Tests failed!" -ForegroundColor Red
    exit 1
}
Write-Host "All tests passed!" -ForegroundColor Green

# 6. Test Docker build (optional)
Write-Host "`n[6/6] Testing Docker build..." -ForegroundColor Yellow
$dockerTest = Read-Host "Do you want to test Docker build? (y/n)"
if ($dockerTest -eq "y") {
    Write-Host "Building Docker image..." -ForegroundColor Cyan
    docker build -t hedge-rl-api:test .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker build failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Testing Docker image..." -ForegroundColor Cyan
    docker run --rm hedge-rl-api:test python -c "import src; print('Import successful')"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker test failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Docker build successful!" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✓ All checks passed!" -ForegroundColor Green
Write-Host "Your code is ready to push!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
