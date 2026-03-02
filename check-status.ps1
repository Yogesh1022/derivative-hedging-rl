Write-Host "=== HedgeAI System Status Check ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Containers:" -ForegroundColor Yellow
docker ps --filter "name=hedgeai" --format "{{.Names}}: {{.Status}}" 2>$null

Write-Host ""
Write-Host "To initialize the database, run:" -ForegroundColor Green
Write-Host "docker exec hedgeai-backend npx prisma migrate deploy" -ForegroundColor White

Write-Host ""
Write-Host "To create an admin user, run:" -ForegroundColor Green
Write-Host '$body = @{email="admin@hedgeai.com";password="Admin123!";name="Admin";role="ADMIN"} | ConvertTo-Json' -ForegroundColor White
Write-Host 'Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json"' -ForegroundColor White

Write-Host ""
Write-Host "Access points:" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "  Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "  ML Service Docs: http://localhost:8000/docs" -ForegroundColor White
