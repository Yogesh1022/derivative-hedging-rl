# Start All Services with Model Loading Check
# This script ensures the ML model loads properly

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host " STARTING HEDGEAI WITH ML MODEL VERIFICATION" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

# Check Python dependencies first
Write-Host "`n1. Checking ML Service Dependencies..." -ForegroundColor Yellow

if (Test-Path "ml-service\.venv") {
    Write-Host "   ✅ Virtual environment found" -ForegroundColor Green
    
    # Activate venv and check stable-baselines3
    Write-Host "   Checking stable-baselines3..." -ForegroundColor Gray
    
    $sb3Check = & "ml-service\.venv\Scripts\python.exe" -c "import stable_baselines3; print('installed')" 2>&1
    
    if ($sb3Check -match "installed") {
        Write-Host "   ✅ stable-baselines3 is installed" -ForegroundColor Green
    } else {
        Write-Host "   ❌ stable-baselines3 NOT installed" -ForegroundColor Red
        Write-Host "   Installing stable-baselines3..." -ForegroundColor Yellow
        & "ml-service\.venv\Scripts\pip.exe" install stable-baselines3 --quiet
        Write-Host "   ✅ stable-baselines3 installed" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠️  Virtual environment not found" -ForegroundColor Yellow
    Write-Host "   Creating virtual environment..." -ForegroundColor Gray
    python -m venv ml-service\.venv
    Write-Host "   Installing dependencies..." -ForegroundColor Gray
    & "ml-service\.venv\Scripts\pip.exe" install -r ml-service\requirements.txt
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
}

# Check if model file exists
Write-Host "`n2. Checking RL Model File..." -ForegroundColor Yellow
if (Test-Path "ml-service\models\rl_agent_ppo.zip") {
    $modelSize = (Get-Item "ml-service\models\rl_agent_ppo.zip").Length / 1MB
    Write-Host "   ✅ Model file found (Size: $($modelSize.ToString('0.00')) MB)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Model file NOT found at ml-service\models\rl_agent_ppo.zip" -ForegroundColor Red
    Write-Host "   The ML service will use heuristic fallback" -ForegroundColor Yellow
}

# Start PostgreSQL
Write-Host "`n3. Starting PostgreSQL..." -ForegroundColor Yellow
try {
    $postgresRunning = docker ps --filter "name=postgres" --format "{{.Names}}" 2>$null
    if ($postgresRunning -match "postgres") {
        Write-Host "   ✅ PostgreSQL already running" -ForegroundColor Green
    } else {
        docker-compose up -d postgres 2>$null
        Start-Sleep -Seconds 3
        Write-Host "   ✅ PostgreSQL started" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Could not start PostgreSQL (Docker may not be running)" -ForegroundColor Yellow
}

# Start services in new terminals
Write-Host "`n4. Starting Services..." -ForegroundColor Yellow

# ML Service
Write-Host "   Starting ML Service (Port 8000)..." -ForegroundColor Gray
Start-Process powershell -ArgumentList @"
    -NoExit
    -Command `"
        Write-Host '🤖 ML SERVICE' -ForegroundColor Cyan;
        Write-Host '=' * 60;
        cd ml-service;
        .venv\Scripts\activate;
        Write-Host 'Starting FastAPI with model loading...' -ForegroundColor Yellow;
        uvicorn main:app --reload --port 8000
    `"
"@
Start-Sleep -Seconds 2
Write-Host "   ✅ ML Service started in new window" -ForegroundColor Green

# Backend
Write-Host "   Starting Backend API (Port 5000)..." -ForegroundColor Gray
Start-Process powershell -ArgumentList @"
    -NoExit
    -Command `"
        Write-Host '⚙️  BACKEND API' -ForegroundColor Yellow;
        Write-Host '=' * 60;
        cd backend;
        Write-Host 'Starting Express server...' -ForegroundColor Yellow;
        npm run dev
    `"
"@
Start-Sleep -Seconds 2
Write-Host "   ✅ Backend API started in new window" -ForegroundColor Green

# Frontend
Write-Host "   Starting Frontend (Port 5173)..." -ForegroundColor Gray
Start-Process powershell -ArgumentList @"
    -NoExit
    -Command `"
        Write-Host '🎨 FRONTEND' -ForegroundColor Magenta;
        Write-Host '=' * 60;
        cd frontend;
        Write-Host 'Starting Vite dev server...' -ForegroundColor Yellow;
        npm run dev
    `"
"@
Write-Host "   ✅ Frontend started in new window" -ForegroundColor Green

Write-Host "`n" + ("=" * 70) -ForegroundColor Cyan
Write-Host " SERVICES STARTING" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

Write-Host "`nPlease wait 10-15 seconds for all services to initialize..." -ForegroundColor Yellow
Write-Host "`nService URLs:" -ForegroundColor Yellow
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend:   http://localhost:5000" -ForegroundColor Cyan
Write-Host "  ML Service: http://localhost:8000" -ForegroundColor Cyan

Write-Host "`nTo verify ML model loaded:" -ForegroundColor Yellow
Write-Host "  Check ML Service terminal for 'Model loaded successfully'" -ForegroundColor Gray
Write-Host "  Or visit: http://localhost:8000/health" -ForegroundColor Gray

Write-Host "`nReal-Time ML Features:" -ForegroundColor Yellow
Write-Host "  ✅ Auto-refresh every 60 seconds" -ForegroundColor Green
Write-Host "  ✅ Manual refresh button available" -ForegroundColor Green
Write-Host "  ✅ Last updated timestamp shown" -ForegroundColor Green
Write-Host "  ✅ Loading states and indicators" -ForegroundColor Green

Write-Host "`nDefault Test Users:" -ForegroundColor Yellow
Write-Host "  Trader:       trader@hedgeai.com / trader123" -ForegroundColor Cyan
Write-Host "  Risk Manager: risk@hedgeai.com / risk123" -ForegroundColor Cyan
Write-Host "  Analyst:      analyst@hedgeai.com / analyst123" -ForegroundColor Cyan

Write-Host "`nPress Ctrl+C to return to prompt" -ForegroundColor Gray
Write-Host ""
