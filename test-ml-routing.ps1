# ML Routing Test Script
# Tests the complete routing chain: Frontend → Backend → ML Service

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host " ML SERVICE ROUTING TEST" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

Write-Host "`nThis script tests the complete ML routing chain:" -ForegroundColor Yellow
Write-Host "  Frontend (5173) → Backend (5000) → ML Service (8000)" -ForegroundColor Cyan

# Test 1: ML Service Direct
Write-Host "`n1. Testing ML Service Directly (Port 8000)..." -ForegroundColor Yellow
try {
    $mlHealth = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 5
    Write-Host "   ✅ ML Service Health: $($mlHealth.status)" -ForegroundColor Green
    Write-Host "   Model Loaded: $($mlHealth.model_loaded)" -ForegroundColor Green
    $mlRunning = $true
} catch {
    Write-Host "   ❌ ML Service NOT responding" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    $mlRunning = $false
}

# Test 2: Backend ML Endpoint Health
Write-Host "`n2. Testing Backend ML Endpoint (Port 5000)..." -ForegroundColor Yellow
Write-Host "   (Requires authentication - skipping for now)" -ForegroundColor Gray
Write-Host "   To test manually: curl with auth token to http://localhost:5000/api/ml/health" -ForegroundColor Gray
$backendRunning = $false
try {
    $backendTest = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✅ Backend is responding" -ForegroundColor Green
    $backendRunning = $true
} catch {
    Write-Host "   ❌ Backend NOT responding" -ForegroundColor Red
    $backendRunning = $false
}

# Test 3: Frontend  
Write-Host "`n3. Testing Frontend (Port 5173)..." -ForegroundColor Yellow
try {
    $frontendTest = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✅ Frontend is responding" -ForegroundColor Green
    $frontendRunning = $true
} catch {
    Write-Host "   ❌ Frontend NOT responding" -ForegroundColor Red
    $frontendRunning = $false
}

# Test 4: ML Prediction (if ML service is running)
if ($mlRunning) {
    Write-Host "`n4. Testing ML Prediction Endpoint..." -ForegroundColor Yellow
    
    $testPayload = @{
        positions = @(
            @{
                symbol = "AAPL"
                quantity = 100
                entry_price = 150.0
                current_price = 155.0
                delta = 0.65
                gamma = 0.04
                vega = 0.3
            }
        )
        totalValue = 100000
        cashPosition = 0
    } | ConvertTo-Json -Depth 5
    
    try {
        $prediction = Invoke-RestMethod -Uri "http://localhost:8000/predict-risk" `
            -Method POST `
            -Body $testPayload `
            -ContentType "application/json" `
            -TimeoutSec 10
        
        Write-Host "   ✅ ML Prediction SUCCESSFUL" -ForegroundColor Green
        Write-Host "   Action: $($prediction.action)" -ForegroundColor Cyan
        Write-Host "   Confidence: $($prediction.confidence)" -ForegroundColor Cyan
        Write-Host "   Risk Score: $($prediction.risk_score)" -ForegroundColor Cyan
        Write-Host "   Recommendation: $($prediction.hedging_recommendation)" -ForegroundColor Cyan
    } catch {
        Write-Host "   ❌ ML Prediction FAILED" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Red
    }
}

# Routing Configuration Check
Write-Host "`n5. Verifying Routing Configuration..." -ForegroundColor Yellow

$configChecks = @()

# Check frontend vite.config.ts
$viteConfig = Get-Content "frontend\vite.config.ts" -Raw
if ($viteConfig -match "port:\s*5173") {
    Write-Host "   ✅ Frontend port: 5173" -ForegroundColor Green
    $configChecks += $true
} else {
    Write-Host "   ❌ Frontend port: NOT 5173" -ForegroundColor Red
    $configChecks += $false
}

# Check frontend .env
$frontendEnv = Get-Content "frontend\.env" -Raw
if ($frontendEnv -match "VITE_API_URL=/api") {
    Write-Host "   ✅ Frontend API URL: /api (using proxy)" -ForegroundColor Green
    $configChecks += $true
} else {
    Write-Host "   ⚠️  Frontend API URL: Check if using proxy correctly" -ForegroundColor Yellow
    $configChecks += $true
}

# Check backend .env
$backendEnv = Get-Content "backend\.env" -Raw
if ($backendEnv -match "CLIENT_URL=http://localhost:5173") {
    Write-Host "   ✅ Backend CLIENT_URL: http://localhost:5173" -ForegroundColor Green
    $configChecks += $true
} else {
    Write-Host "   ❌ Backend CLIENT_URL: NOT http://localhost:5173" -ForegroundColor Red
    $configChecks += $false
}

if ($backendEnv -match "ML_SERVICE_URL=http://localhost:8000") {
    Write-Host "   ✅ Backend ML_SERVICE_URL: http://localhost:8000" -ForegroundColor Green
    $configChecks += $true
} else {
    Write-Host "   ❌ Backend ML_SERVICE_URL: NOT http://localhost:8000" -ForegroundColor Red
    $configChecks += $false
}

# Check ML service CORS
$mlMain = Get-Content "ml-service\main.py" -Raw
if ($mlMain -match 'allow_origins=\["http://localhost:5173"') {
    Write-Host "   ✅ ML Service CORS: http://localhost:5173" -ForegroundColor Green
    $configChecks += $true
} else {
    Write-Host "   ⚠️  ML Service CORS: Check configuration" -ForegroundColor Yellow
    $configChecks += $true
}

# Summary
Write-Host "`n" + ("=" * 70) -ForegroundColor Cyan
Write-Host " ROUTING TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

Write-Host "`nService Status:" -ForegroundColor Yellow
Write-Host "  ML Service (8000):  $(if($mlRunning){'✅ RUNNING'}else{'❌ OFFLINE'})" -ForegroundColor $(if($mlRunning){'Green'}else{'Red'})
Write-Host "  Backend (5000):     $(if($backendRunning){'✅ RUNNING'}else{'❌ OFFLINE'})" -ForegroundColor $(if($backendRunning){'Green'}else{'Red'})
Write-Host "  Frontend (5173):    $(if($frontendRunning){'✅ RUNNING'}else{'❌ OFFLINE'})" -ForegroundColor $(if($frontendRunning){'Green'}else{'Red'})

$allConfigsGood = -not ($configChecks -contains $false)
Write-Host "`nRouting Configuration: $(if($allConfigsGood){'✅ CORRECT'}else{'❌ NEEDS FIXES'})" -ForegroundColor $(if($allConfigsGood){'Green'}else{'Red'})

Write-Host "`nExpected Routing Flow:" -ForegroundColor Yellow
Write-Host "  1. Frontend (localhost:5173)" -ForegroundColor Cyan
Write-Host "     └─> Calls: /api/ml/predict" -ForegroundColor Gray
Write-Host "  2. Vite Proxy" -ForegroundColor Cyan
Write-Host "     └─> Forwards to: http://localhost:5000/api/ml/predict" -ForegroundColor Gray
Write-Host "  3. Backend (localhost:5000)" -ForegroundColor Cyan
Write-Host "     └─> Calls: http://localhost:8000/predict-risk" -ForegroundColor Gray
Write-Host "  4. ML Service (Port 8000)" -ForegroundColor Cyan  
Write-Host "     └─> Returns: RiskPrediction" -ForegroundColor Gray

if (-not $mlRunning -or -not $backendRunning -or -not $frontendRunning) {
    Write-Host "`nTo Start Services:" -ForegroundColor Yellow
    Write-Host "  .\start-hedgeai.ps1" -ForegroundColor Cyan
    Write-Host "`nOr start manually:" -ForegroundColor Yellow
    if (-not $mlRunning) {
        Write-Host "  Terminal 1: cd ml-service; .venv\Scripts\activate; uvicorn main:app --reload --port 8000" -ForegroundColor Cyan
    }
    if (-not $backendRunning) {
        Write-Host "  Terminal 2: cd backend; npm run dev" -ForegroundColor Cyan
    }
    if (-not $frontendRunning) {
        Write-Host "  Terminal 3: cd frontend; npm run dev" -ForegroundColor Cyan
    }
}

Write-Host "`nFor detailed routing analysis, see:" -ForegroundColor Yellow
Write-Host "  ML_ROUTING_ANALYSIS.md" -ForegroundColor Cyan

Write-Host ""
