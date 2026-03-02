# HedgeAI Setup - Solutions Applied

## ✅ Issues Found and Fixed

### 1. **Docker Desktop Not Running** ✅ FIXED
- **Problem**: Docker daemon was not running
- **Solution**: Started Docker Desktop - should now be running

### 2. **Port 6379 Conflict** ✅ FIXED  
- **Problem**: Redis default port (6379) was already in use by another process
- **Solution**: Changed Redis to use port 6380 on host machine
  - Updated `docker-compose.yml`: Redis now uses `6380:6379`
  - Updated `backend/.env`: Backend connects to Redis inside Docker network (no change needed there)

### 3. **Containers Building** 🔄 IN PROGRESS
- Docker Compose is currently building all images
- This takes 5-10 minutes on first build
- Builds: backend (Node.js), ml-service (Python), frontend (React)

## 📋 What's Happening Right Now

Your containers are being built. The process is:
1. ✅ Docker Desktop started
2. ✅ Port conflicts fixed
3. 🔄 **Currently**: Building images (5-10 min)
4.  ⏱️ **Next**: Containers will start automatically
5. ⏱️ **Then**: Initialize database
6. ⏱️ **Finally**: Create admin user

## 🔍 Check Build Progress

Run these commands to monitor:

### See if containers are running:
```powershell
docker ps | findstr "hedgeai"
```

### See all containers (including stopped):
```powershell
docker ps -a | findstr "hedgeai"
```

### Watch build logs live:
```powershell
docker-compose logs -f
```
(Press Ctrl+C to exit)

### Check specific service logs:
```powershell
# Backend
docker-compose logs backend --tail=50

# ML Service  
docker-compose logs ml-service --tail=50

# Frontend
docker-compose logs frontend --tail=50
```

## ✅ Once Containers Are Running

You'll see 5 containers when you run `docker ps | findstr "hedgeai"`:
- hedgeai-postgres
- hedgeai-redis
- hedgeai-ml-service
- hedgeai-backend  
- hedgeai-frontend

### Then Initialize Database:
```powershell
docker exec hedgeai-backend npx prisma migrate deploy
```

### Create Admin User:
```powershell
$body = @{
    email = "admin@hedgeai.com"
    password = "Admin123!"
    name = "Admin User"
    role = "ADMIN"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### Access the Platform:
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5000
- **ML Documentation**: http://localhost:8000/docs

## 🔧 If Build Fails

### Check for errors:
```powershell
docker-compose logs | Select-String "error|Error|failed"
```

### Clean rebuild:
```powershell
docker-compose down -v
docker-compose up -d --build
```

### Build services individually to isolate issues:
```powershell
# Build backend only
docker-compose build backend

# Build ML service only
docker-compose build ml-service

# Build frontend only  
docker-compose build frontend
```

## 📊 Port Configuration

| Service | Host Port | Container Port | Notes |
|---------|-----------|----------------|-------|
| PostgreSQL | 5433 | 5432 | Changed from 5432 to avoid conflicts |
| Redis | 6380 | 6379 | Changed from 6379 (was in use) |
| ML Service | 8000 | 8000 | Available |
| Backend | 5000 | 5000 | Available |
| Frontend | 3001 | 5173 | Changed from 5173 to avoid conflicts |

## ⏱️ Typical Build Timeline

- **Postgres & Redis**: 30 seconds (pull images)
- **ML Service**: 2-3 minutes (install Python packages)
- **Backend**: 3-4 minutes (install Node packages, build TypeScript)
- **Frontend**: 2-3 minutes (install Node packages)
- **Total First Build**: ~8-10 minutes

Subsequent builds are faster due to caching.

## 🎯 Current Status Commands

Run this to get full status:
```powershell
Write-Host "=== HedgeAI Status ===" -ForegroundColor Cyan
docker ps --filter "name=hedgeai" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Or use the diagnostic script:
```powershell
.\diagnose.ps1
```

---

**Recommendation**: Wait 5-10 minutes, then run:
```powershell
docker ps | findstr "hedgeai"
```

If you see 5 containers running, proceed with database initialization!
