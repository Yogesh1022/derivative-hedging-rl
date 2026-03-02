# HedgeAI Service Status Checker
Write-Host "`n=== HedgeAI Service Status ===" -ForegroundColor Cyan

# Check Docker containers
Write-Host "`n1. Docker Containers:" -ForegroundColor Yellow
$containers = docker ps --filter "name=hedgeai" --format "{{.Names}}|{{.Status}}|{{.Ports}}"
if ($containers) {
    foreach ($container in $containers) {
        $parts = $container -split '\|'
        Write-Host "  ✓ $($parts[0]): $($parts[1])" -ForegroundColor Green
    }
} else {
    Write-Host "  ✗ No HedgeAI containers running" -ForegroundColor Red
}

# Check service health
Write-Host "`n2. Service Health Checks:" -ForegroundColor Yellow

# PostgreSQL
try {
    $pg = Test-NetConnection -ComputerName localhost -Port 5433 -WarningAction SilentlyContinue -ErrorAction Stop
    if ($pg.TcpTestSucceeded) {
        Write-Host "  ✓ PostgreSQL (port 5433): Running" -ForegroundColor Green
    } else {
        Write-Host "  ✗ PostgreSQL (port 5433): Not responding" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ PostgreSQL (port 5433): Error" -ForegroundColor Red
}

# Redis
try {
    $redis = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue -ErrorAction Stop
    if ($redis.TcpTestSucceeded) {
        Write-Host "  ✓ Redis (port 6379): Running" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Redis (port 6379): Not responding" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Redis (port 6379): Error" -ForegroundColor Red
}

# ML Service
try {
    $ml = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✓ ML Service (port 8000): $($ml.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ ML Service (port 8000): Not responding" -ForegroundColor Red
}

# Backend API
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✓ Backend API (port 5000): $($backend.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Backend API (port 5000): Not responding" -ForegroundColor Red
}

# Frontend
try {
    $frontend = Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue -ErrorAction Stop
    if ($frontend.TcpTestSucceeded) {
        Write-Host "  ✓ Frontend (port 3001): Running" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Frontend (port 3001): Not responding" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Frontend (port 3001): Error" -ForegroundColor Red
}

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "If all services are running:"
Write-Host "  1. Initialize database: docker exec hedgeai-backend npx prisma migrate deploy"
Write-Host "  2. Access frontend: http://localhost:3001"
Write-Host "  3. Check ML docs: http://localhost:8000/docs"
Write-Host "`nIf services are not running:"
Write-Host "  1. Check logs: docker-compose logs -f"
Write-Host "  2. Rebuild: docker-compose up -d --build"
Write-Host ""
