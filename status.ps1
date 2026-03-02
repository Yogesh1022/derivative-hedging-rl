Write-Host "=== HedgeAI Status ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Docker Compose Services:" -ForegroundColor Yellow
docker-compose ps --format table
Write-Host ""
Write-Host "Running HedgeAI Containers:" -ForegroundColor Yellow
docker ps --filter "name=hedgeai" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""
