# ═══════════════════════════════════════════════════════════════
# HEDGEAI - DEVELOPMENT SETUP SCRIPT (Windows)
# ═══════════════════════════════════════════════════════════════

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "║         HedgeAI Platform - Development Setup             ║" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

$node = Get-Command node -ErrorAction SilentlyContinue
$npm = Get-Command npm -ErrorAction SilentlyContinue
$python = Get-Command python -ErrorAction SilentlyContinue
$psql = Get-Command psql -ErrorAction SilentlyContinue

if (-not $node) {
    Write-Host "❌ Node.js is not installed" -ForegroundColor Red
    exit 1
}

if (-not $npm) {
    Write-Host "❌ npm is not installed" -ForegroundColor Red
    exit 1
}

if (-not $python) {
    Write-Host "❌ Python is not installed" -ForegroundColor Red
    exit 1
}

if (-not $psql) {
    Write-Host "❌ PostgreSQL is not installed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All prerequisites found" -ForegroundColor Green
Write-Host ""

# Setup Backend
Write-Host "🔧 Setting up Backend..." -ForegroundColor Yellow
Set-Location backend

if (-not (Test-Path ".env")) {
    Copy-Item .env.example .env
    Write-Host "⚠️  Created backend/.env - Please update with your values" -ForegroundColor Yellow
}

npm install
npx prisma generate
Write-Host "✅ Backend setup complete" -ForegroundColor Green
Set-Location ..
Write-Host ""

# Setup ML Service
Write-Host "🤖 Setting up ML Service..." -ForegroundColor Yellow
Set-Location ml-service

if (-not (Test-Path "venv")) {
    python -m venv venv
}

& .\venv\Scripts\Activate.ps1
pip install -r requirements.txt

if (-not (Test-Path ".env")) {
    Copy-Item .env.example .env
}

deactivate
Write-Host "✅ ML Service setup complete" -ForegroundColor Green
Set-Location ..
Write-Host ""

# Setup Frontend
Write-Host "⚛️  Setting up Frontend..." -ForegroundColor Yellow
Set-Location frontend

if (-not (Test-Path ".env")) {
    Copy-Item .env.example .env
}

npm install
Write-Host "✅ Frontend setup complete" -ForegroundColor Green
Set-Location ..
Write-Host ""

# Create models directory
Write-Host "📦 Creating models directory..." -ForegroundColor Yellow
if (-not (Test-Path "models")) {
    New-Item -ItemType Directory -Path "models" | Out-Null
}
Write-Host "✅ Models directory created" -ForegroundColor Green
Write-Host ""

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "║              Setup Complete! 🎉                          ║" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configure environment variables:"
Write-Host "   - backend\.env"
Write-Host "   - ml-service\.env"
Write-Host "   - frontend\.env"
Write-Host ""
Write-Host "2. Start PostgreSQL and create database:"
Write-Host "   createdb hedgeai"
Write-Host ""
Write-Host "3. Run database migrations:"
Write-Host "   cd backend; npx prisma migrate dev"
Write-Host ""
Write-Host "4. Start services:"
Write-Host "   Terminal 1: cd backend; npm run dev"
Write-Host "   Terminal 2: cd ml-service; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload"
Write-Host "   Terminal 3: cd frontend; npm run dev"
Write-Host ""
Write-Host "Or use Docker:"
Write-Host "   docker-compose up -d"
Write-Host ""
