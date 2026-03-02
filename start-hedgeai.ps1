# HedgeAI Microservices Startup Script

$logFile = ".\hedgeai-startup.log"
"=== HedgeAI Startup Log - $(Get-Date) ===" | Tee-Object -FilePath $logFile

Write-Host "`n[1/6] Cleaning up old containers..." -ForegroundColor Cyan
docker-compose down -v 2>&1 | Tee-Object -FilePath $logFile -Append

Write-Host "`n[2/6] Building images (this may take 5-10 minutes)..." -ForegroundColor Cyan  
docker-compose build --no-cache 2>&1 | Tee-Object -FilePath $logFile -Append

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n✗ Build failed! Check $logFile for details" -ForegroundColor Red
    exit 1
}

Write-Host "`n[3/6] Starting services..." -ForegroundColor Cyan
docker-compose up -d 2>&1 | Tee-Object -FilePath $logFile -Append

Write-Host "`n[4/6] Waiting for services to be healthy (30s)..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

Write-Host "`n[5/6] Checking service status..." -ForegroundColor Cyan
$healthResults = @()

# Check each service
$services = @(
    @{Name="PostgreSQL"; Port=5433},
    @{Name="Redis"; Port=6379},
    @{Name="ML Service"; Port=8000; Http=$true; Path="/health"},
    @{Name="Backend API"; Port=5000; Http=$true; Path="/health"},
    @{Name="Frontend"; Port=3001}
)

foreach ($svc in $services) {
    if ($svc.Http) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($svc.Port)$($svc.Path)" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            Write-Host "  ✓ $($svc.Name) - Healthy" -ForegroundColor Green
            $healthResults += "$($svc.Name): HEALTHY"
        } catch {
            Write-Host "  ✗ $($svc.Name) - Not responding" -ForegroundColor Red
            $healthResults += "$($svc.Name): DOWN"
        }
    } else {
        $test = Test-NetConnection -ComputerName localhost -Port $svc.Port -WarningAction SilentlyContinue
        if ($test.TcpTestSucceeded) {
            Write-Host "  ✓ $($svc.Name) - Running" -ForegroundColor Green
            $healthResults += "$($svc.Name): RUNNING"
        } else {
            Write-Host "  ✗ $($svc.Name) - Not accessible" -ForegroundColor Red
            $healthResults += "$($svc.Name): DOWN"
        }
    }
}

Write-Host "`n[6/6] Initializing database..." -ForegroundColor Cyan
if ($healthResults -contains "Backend API: HEALTHY") {
    docker exec hedgeai-backend npx prisma migrate deploy 2>&1 | Tee-Object -FilePath $logFile -Append
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Database initialized" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Database initialization failed" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ Skipped - Backend not healthy" -ForegroundColor Yellow
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host "`nService URLs:"
Write-Host "  Frontend:    http://localhost:3001"
Write-Host "  Backend API: http://localhost:5000"
Write-Host "  ML Service:  http://localhost:8000/docs"
Write-Host "  PostgreSQL:  localhost:5433"
Write-Host "`nLog file: $logFile"
Write-Host "`nTo view logs: docker-compose logs -f"
Write-Host "To stop: docker-compose down"
Write-Host ""
