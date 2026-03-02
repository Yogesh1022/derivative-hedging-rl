# Complete HedgeAI Deployment Script
# Rebuilds backend and starts all services

Write-Host "Step 1: Rebuilding backend image..." -ForegroundColor Cyan
docker compose build backend --no-cache

Write-Host "`nStep 2: Recreating all containers..." -ForegroundColor Cyan  
docker compose up -d --force-recreate

Write-Host "`nStep 3: Waiting for services to start (60 seconds)..." -ForegroundColor  Cyan
Start-Sleep -Seconds 60

Write-Host "`nStep 4: Checking container status..." -ForegroundColor Cyan
docker ps --filter "name=hedgeai" --format "table {{.Names}}\t{{.Status}}"

Write-Host "`nStep 5: Testing backend health..." -ForegroundColor Cyan
for ($i = 1; $i -le 5; $i++) {
    Write-Host "Attempt $i/5..."
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 3
        Write-Host " SUCCESS! Backend is healthy!" -ForegroundColor Green
        $health | ConvertTo-Json
        break
    } catch {
        Write-Host "  Not ready yet, waiting 15 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 15
    }
}

Write-Host "`nStep 6: Creating admin user..." -ForegroundColor Cyan
$body = @{
    email = "admin@hedgeai.com"
    password = "Admin123!"
    name = "Admin User"
    role = "ADMIN"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Admin user created successfully!" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        Write-Host "Admin user already exists!" -ForegroundColor Yellow
    } else {
        Write-Host "Could not create admin user. Try manually after backend starts." -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "HedgeAI Platform Ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "ML Service: http://localhost:8000/docs" -ForegroundColor White
Write-Host "`nLogin Credentials:" -ForegroundColor Cyan
Write-Host "  Email: admin@hedgeai.com" -ForegroundColor White
Write-Host "  Password: Admin123!" -ForegroundColor White
