# HedgeAI Status and Diagnosis
Clear-Host
Write-Host "=== HedgeAI Diagnostic Report ===" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "Docker Status:" -ForegroundColor Yellow
docker ps 2>&1 | Select-Object -First 3
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Docker is not running!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Docker is running" -ForegroundColor Green
Write-Host ""

# Check HedgeAI containers - running
Write-Host "Running HedgeAI Containers:" -ForegroundColor Yellow
$running = docker ps --filter "name=hedgeai" --format "{{.Names}}"
if ($running) {
    foreach ($container in $running) {
        Write-Host "  ✓ $container" -ForegroundColor Green
    }
} else {
    Write-Host "  ✗ No containers running" -ForegroundColor Red
}
Write-Host ""

# Check all HedgeAI containers
Write-Host "All HedgeAI Containers (including stopped):" -ForegroundColor Yellow
docker ps -a --filter "name=hedgeai" --format "table {{.Names}}\t{{.State}}\t{{.Status}}"
Write-Host ""

# Check images
Write-Host "HedgeAI Images:" -ForegroundColor Yellow
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | Select-String "derivative_hedging_rl"
Write-Host ""

# Check for recent errors in logs
Write-Host "Recent Errors (if any):" -ForegroundColor Yellow
docker-compose logs --tail=20 2>&1 | Select-String "error|Error|ERROR|failed|Failed|FAILED" | Select-Object -First 10
Write-Host ""

Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "To view full logs: docker-compose logs -f"
Write-Host "To restart services: docker-compose restart"
Write-Host "To rebuild: docker-compose down; docker-compose up -d --build"
