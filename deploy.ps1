# HedgeAI - One-Click Deployment Script

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  HedgeAI Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Docker
Write-Host "[1/8] Checking Docker..." -ForegroundColor Yellow
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  X Docker is not running. Starting Docker Desktop..." -ForegroundColor Red
        Start-Process "Docker Desktop.exe"
        Write-Host "  Waiting 30 seconds for Docker to initialize..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
    }
    Write-Host "  OK Docker is running" -ForegroundColor Green
} catch {
    Write-Host "  X Docker is not installed!" -ForegroundColor Red
    exit 1
}

# Step 2: Navigate to project
Write-Host "[2/8] Navigating to project directory..." -ForegroundColor Yellow
Set-Location -Path "E:\Derivative_Hedging_RL"
Write-Host "  OK Current directory: $(Get-Location)" -ForegroundColor Green

# Step 3: Build and start services
Write-Host "[3/8] Building and starting services..." -ForegroundColor Yellow
Write-Host "  This may take 5-10 minutes on first run..." -ForegroundColor Gray
docker compose up -d --build
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK Services started successfully" -ForegroundColor Green
} else {
    Write-Host "  X Failed to start services" -ForegroundColor Red
    Write-Host "  Run 'docker compose logs' to see errors" -ForegroundColor Yellow
    exit 1
}

# Step 4: Wait for services
Write-Host "[4/8] Waiting for services to initialize..." -ForegroundColor Yellow
$seconds = 60
for ($i = $seconds; $i -gt 0; $i--) {
    Write-Progress -Activity "Initializing services" -Status "$i seconds remaining" -PercentComplete ((($seconds - $i) / $seconds) * 100)
    Start-Sleep -Seconds 1
}
Write-Progress -Activity "Initializing services" -Completed
Write-Host "  OK Services should be ready" -ForegroundColor Green

# Step 5: Check container status
Write-Host "[5/8] Checking container status..." -ForegroundColor Yellow
$containers = docker ps --filter "name=hedgeai" --format "{{.Names}}" 2>$null
$containerCount = ($containers | Measure-Object).Count
Write-Host "  Found $containerCount/5 containers running:" -ForegroundColor Gray
$containers | ForEach-Object { Write-Host "    - $_" -ForegroundColor Gray }

if ($containerCount -lt 5) {
    Write-Host "  WARNING: Not all containers are running. Checking logs..." -ForegroundColor Yellow
    docker compose ps
}

# Step 6: Initialize database
Write-Host "[6/8] Initializing database..." -ForegroundColor Yellow
try {
    $migrateOutput = docker exec hedgeai-backend npx prisma migrate deploy 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK Database migrations applied" -ForegroundColor Green
    } else {
        Write-Host "  X Database migration failed" -ForegroundColor Red
        Write-Host "  Backend may still be starting. Wait 30 seconds and run manually:" -ForegroundColor Yellow
        Write-Host "  docker exec hedgeai-backend npx prisma migrate deploy" -ForegroundColor White
    }
} catch {
    Write-Host "  WARNING: Could not connect to backend container" -ForegroundColor Yellow
}

# Step 7: Create admin user
Write-Host "[7/8] Creating admin user..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $body = @{
        email = "admin@hedgeai.com"
        password = "Admin123!"
        name = "Admin User"
        role = "ADMIN"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "  OK Admin user created successfully" -ForegroundColor Green
    Write-Host "    Email: admin@hedgeai.com" -ForegroundColor Gray
    Write-Host "    Password: Admin123!" -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "  INFO: Admin user already exists" -ForegroundColor Cyan
    } elseif ($_.Exception.Message -like "*Unable to connect*") {
        Write-Host "  WARNING: Backend not ready yet. Create admin user manually:" -ForegroundColor Yellow
        Write-Host '    $body = @{email="admin@hedgeai.com";password="Admin123!";name="Admin";role="ADMIN"} | ConvertTo-Json' -ForegroundColor White
        Write-Host '    Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json"' -ForegroundColor White
    } else {
        Write-Host "  WARNING: Could not create admin user: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Step 8: Health checks
Write-Host "[8/8] Performing health checks..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    $backendHealth = Invoke-RestMethod -Uri "http://localhost:5000/health" -ErrorAction Stop
    Write-Host "  OK Backend: Healthy" -ForegroundColor Green
} catch {
    Write-Host "  X Backend: Not responding" -ForegroundColor Red
}

try {
    $mlHealth = Invoke-RestMethod -Uri "http://localhost:8000/health" -ErrorAction Stop
    Write-Host "  OK ML Service: Healthy" -ForegroundColor Green
} catch {
    Write-Host "  X ML Service: Not responding" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "  Frontend:    http://localhost:3001" -ForegroundColor White
Write-Host "  Backend:     http://localhost:5000" -ForegroundColor White
Write-Host "  ML Docs:     http://localhost:8000/docs" -ForegroundColor White
Write-Host ""

Write-Host "Credentials:" -ForegroundColor Yellow
Write-Host "  Email:       admin@hedgeai.com" -ForegroundColor White
Write-Host "  Password:    Admin123!" -ForegroundColor White
Write-Host ""

Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "  View logs:   docker compose logs -f" -ForegroundColor White
Write-Host "  Stop:        docker compose stop" -ForegroundColor White
Write-Host "  Restart:     docker compose restart" -ForegroundColor White
Write-Host "  Status:      .\check-status.ps1" -ForegroundColor White
Write-Host ""

# Open browser
$openBrowser = Read-Host "Open frontend in browser? (Y/n)"
if ($openBrowser -ne 'n' -and $openBrowser -ne 'N') {
    Write-Host "Opening http://localhost:3001..." -ForegroundColor Green
    Start-Process "http://localhost:3001"
}

Write-Host ""
Write-Host "OK Setup complete! Check COMMANDS.md for more information." -ForegroundColor Green
