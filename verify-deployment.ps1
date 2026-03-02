# Quick Deployment Verification & Setup

Write-Host "Checking container status..." -ForegroundColor Cyan
$containers = docker ps --filter "name=hedgeai" --format "{{.Names}}"
$count = ($containers | Measure-Object).Count
Write-Host "Running containers: $count/5" -ForegroundColor Yellow
$containers

Write-Host "`nWaiting for backend to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host "`nTesting backend health..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "Backend is healthy!" -ForegroundColor Green
    $health | ConvertTo-Json
} catch {
    Write-Host "Backend not ready yet. Waiting 30 more seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -ErrorAction Stop
        Write-Host "Backend is now healthy!" -ForegroundColor Green
    } catch {
        Write-Host "Backend still not responding. Check logs:" -ForegroundColor Red
        Write-Host "  docker logs hedgeai-backend --tail=50" -ForegroundColor White
        exit 1
    }
}

Write-Host "`nRunning database migrations..." -ForegroundColor Cyan
docker exec hedgeai-backend npx prisma migrate deploy
if ($LASTEXITCODE -eq 0) {
    Write-Host "Migrations completed!" -ForegroundColor Green
} else {
    Write-Host "Migrations may have failed. Check output above." -ForegroundColor Yellow
}

Write-Host "`nCreating admin user..." -ForegroundColor Cyan
$body = @{
    email = "admin@hedgeai.com"
    password = "Admin123!"
    name = "Admin User"
    role = "ADMIN"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "Admin user created successfully!" -ForegroundColor Green
    Write-Host "Email: admin@hedgeai.com" -ForegroundColor Cyan
    Write-Host "Password: Admin123!" -ForegroundColor Cyan
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        Write-Host "Admin user already exists!" -ForegroundColor Yellow
    } else {
        Write-Host "Failed to create admin user: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "ML Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "`nLogin: admin@hedgeai.com / Admin123!" -ForegroundColor Cyan

$open = Read-Host "`nOpen frontend? (Y/n)"
if ($open -ne 'n') {
    Start-Process "http://localhost:3001"
}
