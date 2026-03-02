# Kill all Node processes
Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Verify ports are free
Write-Host "Checking ports..." -ForegroundColor Yellow
$port5000 = netstat -ano | findstr ":5000"
$port5174 = netstat -ano | findstr ":5174"

if ($port5000 -or $port5174) {
    Write-Host "Ports still in use, waiting..." -ForegroundColor Red
    Start-Sleep -Seconds 2
}

# Start servers
Write-Host "Starting development servers..." -ForegroundColor Green
npm run dev
