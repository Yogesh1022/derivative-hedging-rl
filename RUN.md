# 🚀 Quick Start Commands

## Start the Project

### 1️⃣ One-Command Start (Recommended)
```powershell
.\restart-dev.ps1
```
This will:
- Kill all old Node.js processes
- Check ports are free
- Start both backend (port 5000) and frontend (port 5174)

### 2️⃣ Manual Start (Alternative)
```powershell
# Kill old processes
Get-Process -Name node | Stop-Process -Force

# Start servers
npm run dev
```

---

## Access the Application

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5174 |
| **Backend API** | http://localhost:5000/api |
| **Prisma Studio** | http://localhost:5555 |

---

## Common Commands

### Start Servers
```powershell
# Start both (backend + frontend)
npm run dev

# Backend only
cd backend
npm run dev

# Frontend only
cd frontend
npm run dev
```

### Database
```powershell
# Start PostgreSQL (Docker)
docker-compose up -d postgres

# Stop database
docker-compose down

# View database UI
cd backend
npx prisma studio
```

### Testing
```powershell
# Test all authentication endpoints
.\test-all-auth.ps1

# Test specific endpoint
curl http://localhost:5000/api/auth/me -Headers @{Authorization="Bearer YOUR_TOKEN"}
```

### Stop Everything
```powershell
# Stop all Node processes
Get-Process -Name node | Stop-Process -Force

# Stop Docker containers
docker-compose down
```

---

## Troubleshooting

### "Port already in use"
```powershell
.\restart-dev.ps1
```

### "Cannot connect to database"
```powershell
# Start Docker Desktop first, then:
docker-compose up -d postgres
npm run dev
```

### "CORS error"
Already fixed! Backend configured for http://localhost:5174

---

## Project Structure

```
E:\Derivative_Hedging_RL\
├── backend/          # Node.js + Express + Prisma (Port 5000)
├── frontend/         # React + Vite (Port 5174)
├── restart-dev.ps1   # Quick start script
└── docker-compose.yml # PostgreSQL database
```

---

## Development Workflow

1. **First Time Setup**
   ```powershell
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Daily Development**
   ```powershell
   .\restart-dev.ps1
   # Open http://localhost:5174
   ```

3. **View Database**
   ```powershell
   cd backend
   npx prisma studio
   # Open http://localhost:5555
   ```

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start everything | `.\restart-dev.ps1` |
| Stop everything | `Get-Process -Name node \| Stop-Process -Force` |
| View logs | Check terminal output |
| Database UI | `cd backend; npx prisma studio` |
| Test API | `.\test-all-auth.ps1` |

---

**Ready to start?** Just run:
```powershell
.\restart-dev.ps1
```

Then open: **http://localhost:5174** 🎉
