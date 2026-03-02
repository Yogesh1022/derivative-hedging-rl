Clear-Host
Write-Host "=== HedgeAI Quick Status ===" -ForegroundColor Cyan
Write-Host ""

# Test ports
Write-Host "Port Tests:" -ForegroundColor Yellow
$ports = @{
    "PostgreSQL" = 5433;
    "Redis" = 6379;
    "ML Service" = 8000;
    "Backend" = 5000;
    "Frontend" = 3001
}

foreach ($service in $ports.Keys) {
    $result = Test-NetConnection -ComputerName localhost -Port $ports[$service] -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($result) {
        Write-Host "  ✓ $service`: OPEN" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $service`: CLOSED" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Container Count:" -ForegroundColor Yellow
$count = (docker ps --filter "name=hedgeai" --format "{{.Names}}").Count
Write-Host "  Running: $count/5" -ForegroundColor $(if ($count -eq 5) { "Green" } else { "Yellow" })

Write-Host ""
