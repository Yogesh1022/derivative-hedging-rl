# 🚀 QUICK START GUIDE - Industry Implementation

## Overview

**Project:** Derivative Hedging using Reinforcement Learning  
**Tech Stack:** Python (Backend/ML) + Node.js/React (Frontend)  
**Timeline:** 12 weeks  
**Team:** 4-6 engineers  

---

## 📁 Repository Structure

```
derivative-hedging-rl/
├── backend/          # Python FastAPI + ML
├── frontend/         # Node.js React app
├── docker/           # Docker configs
├── k8s/              # Kubernetes manifests
└── docs/             # Documentation
```

---

## ⚡ Quick Setup (5 Minutes)

### Prerequisites
```bash
# Required
- Python 3.11+
- Node.js 20 LTS
- Docker Desktop
- Git

# Check versions
python --version
node --version
docker --version
```

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/yourorg/derivative-hedging-rl.git
cd derivative-hedging-rl

# 2. Setup backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Setup frontend
cd ../frontend
npm install

# 4. Start infrastructure
cd ..
docker-compose up -d postgres redis

# 5. Run migrations
cd backend
alembic upgrade head

# 6. Download data
python download_data.py

# 7. Start backend
uvicorn app.main:app --reload

# 8. Start frontend (new terminal)
cd frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📦 Key Technologies

### Backend Stack
```
FastAPI       → REST API
Celery        → Background tasks
PyTorch       → Deep learning
Stable-B3     → RL agents
PostgreSQL    → Database
Redis         → Cache/Queue
```

### Frontend Stack
```
React 18      → UI framework
Vite          → Build tool
Redux Toolkit → State management
MUI           → Component library
Recharts      → Data visualization
Socket.IO     → Real-time updates
```

---

## 🏗️ Project Phases

| Week | Phase | Focus |
|------|-------|-------|
| 1 | Setup | Infrastructure, dev environment |
| 2-3 | Foundation | APIs, data pipeline, UI shell |
| 4-5 | ML Core | RL environment, baselines |
| 6-7 | Training | DQN, PPO, SAC agents |
| 8 | Evaluation | Metrics, visualization |
| 9 | Advanced | Live simulation, portfolio |
| 10 | Integration | Testing, polish |
| 11 | Deployment | Production setup |
| 12 | Launch | Beta testing, documentation |

---

## 🎯 Sprint Goals

### Sprint 1 (Week 2-3): Foundation
**Backend:**
- ✅ FastAPI app structure
- ✅ PostgreSQL models
- ✅ JWT authentication
- ✅ Data fetching API

**Frontend:**
- ✅ React project setup
- ✅ Redux store
- ✅ Layout components
- ✅ API integration

### Sprint 2 (Week 4-5): ML Core
**Backend:**
- ✅ Hedging environment
- ✅ Black-Scholes pricer
- ✅ Baseline strategies
- ✅ Evaluation metrics

**Frontend:**
- ✅ Environment config UI
- ✅ Data visualization
- ✅ Baseline comparison

### Sprint 3 (Week 6-7): Training
**Backend:**
- ✅ DQN agent
- ✅ PPO agent
- ✅ SAC agent
- ✅ Training pipeline
- ✅ Celery tasks

**Frontend:**
- ✅ Training dashboard
- ✅ Live metrics
- ✅ Model management

### Sprint 4 (Week 8): Evaluation
**Backend:**
- ✅ Full evaluation suite
- ✅ Backtesting engine
- ✅ Report generation

**Frontend:**
- ✅ Comparison charts
- ✅ Performance metrics
- ✅ Interactive analysis

---

## 🔧 Development Workflow

### Daily Routine

```bash
# Morning
git pull origin develop
docker-compose up -d

# Backend dev
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Frontend dev (new terminal)
cd frontend
npm run dev

# Run tests before commit
pytest                    # Backend
npm test                  # Frontend

# End of day
git add .
git commit -m "feat: add training dashboard"
git push origin feature/training-dashboard
```

### Creating a Feature

```bash
# 1. Create branch
git checkout develop
git pull
git checkout -b feature/live-simulation

# 2. Implement feature
# ... code ...

# 3. Write tests
pytest tests/unit/test_simulation.py
npm test simulation.test.tsx

# 4. Check code quality
ruff check .              # Python linting
npm run lint              # JavaScript linting

# 5. Create PR
git push origin feature/live-simulation
# Go to GitHub → Create Pull Request
```

---

## 🐛 Common Issues & Solutions

### Issue: Database connection error
```bash
# Solution: Restart PostgreSQL
docker-compose restart postgres

# Check if running
docker ps | grep postgres
```

### Issue: Frontend build fails
```bash
# Solution: Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Issue: Python import errors
```bash
# Solution: Reinstall in editable mode
cd backend
pip install -e .
```

### Issue: Training job hangs
```bash
# Solution: Check Celery worker
docker-compose logs celery

# Restart worker
docker-compose restart celery
```

---

## 📊 Monitoring & Debugging

### Check System Health

```bash
# Backend health
curl http://localhost:8000/health

# Database status
docker exec -it postgres psql -U dev -d hedging_rl -c "SELECT version();"

# Redis status
docker exec -it redis redis-cli ping

# Celery workers
celery -A app.tasks.celery_app inspect active
```

### View Logs

```bash
# Backend logs
tail -f backend/logs/app.log

# Frontend console
# Open browser DevTools → Console

# Docker logs
docker-compose logs -f backend
docker-compose logs -f celery
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test
pytest tests/unit/test_environment.py::test_hedging_env_reset

# View coverage
open htmlcov/index.html
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- MetricsCard.test.tsx

# E2E tests
npm run test:e2e
```

---

## 🚀 Deployment

### Build for Production

```bash
# Backend
cd backend
docker build -t hedging-backend:latest .

# Frontend
cd frontend
npm run build
docker build -t hedging-frontend:latest .
```

### Deploy to Staging

```bash
# Push to staging branch
git checkout develop
git pull
git checkout staging
git merge develop
git push origin staging

# CI/CD will auto-deploy
# Monitor: https://staging.example.com
```

### Deploy to Production

```bash
# Create release branch
git checkout main
git pull
git merge develop
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags

# CI/CD will auto-deploy
# Monitor: https://app.example.com
```

---

## 📚 Useful Commands

### Docker

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service]

# Rebuild service
docker-compose build [service]

# Execute command in container
docker-compose exec backend python manage.py shell
```

### Database

```bash
# Create migration
cd backend
alembic revision --autogenerate -m "add user table"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1

# Reset database
alembic downgrade base
alembic upgrade head
```

### Git

```bash
# Create feature branch
git checkout -b feature/new-feature

# Update from develop
git fetch origin
git rebase origin/develop

# Squash commits
git rebase -i HEAD~3

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

---

## 📖 Documentation

### Where to Find Help

| Document | Location | Purpose |
|----------|----------|---------|
| **Implementation Plan** | `IMPLEMENTATION_PLAN.md` | Complete 12-week roadmap |
| **Data Sources** | `DATA_SOURCES.md` | Download instructions |
| **API Docs** | http://localhost:8000/docs | Backend API reference |
| **Architecture** | `docs/ARCHITECTURE.md` | System design |
| **User Guide** | `docs/USER_GUIDE.md` | How to use the app |

### Getting Help

1. **Check documentation first**
2. **Search closed issues on GitHub**
3. **Ask in team Slack channel**
4. **Create GitHub issue with template**

---

## 👥 Team Contacts

| Role | Name | Slack | Email |
|------|------|-------|-------|
| Tech Lead | [Name] | @techlead | tech.lead@company.com |
| ML Engineer | [Name] | @mleng | ml.eng@company.com |
| Backend Dev | [Name] | @backend | backend@company.com |
| Frontend Dev | [Name] | @frontend | frontend@company.com |
| DevOps | [Name] | @devops | devops@company.com |

---

## 🎯 Next Steps

### For New Developers

1. ✅ **Setup dev environment** (follow Quick Setup above)
2. ✅ **Read architecture docs** (`docs/ARCHITECTURE.md`)
3. ✅ **Run the app locally**
4. ✅ **Pick a starter issue** (label: `good-first-issue`)
5. ✅ **Submit your first PR**

### For Project Manager

1. ✅ **Review sprint goals** (see Sprint Goals section)
2. ✅ **Setup project board** (Jira/Linear)
3. ✅ **Schedule kickoff meeting**
4. ✅ **Assign initial tasks**

### For DevOps

1. ✅ **Setup CI/CD pipeline** (GitHub Actions)
2. ✅ **Configure staging environment**
3. ✅ **Setup monitoring** (Prometheus + Grafana)
4. ✅ **Configure alerts**

---

## 🔗 Important Links

- **Repository:** https://github.com/yourorg/derivative-hedging-rl
- **Project Board:** https://linear.app/project
- **CI/CD:** https://github.com/yourorg/derivative-hedging-rl/actions
- **Staging:** https://staging.example.com
- **Production:** https://app.example.com
- **Monitoring:** https://grafana.example.com

---

## ✅ Pre-Launch Checklist

- [ ] All critical features implemented
- [ ] Test coverage > 80%
- [ ] Code review passed
- [ ] Security audit completed
- [ ] Performance tested
- [ ] Documentation complete
- [ ] User training done
- [ ] Monitoring configured
- [ ] Backup tested
- [ ] Launch plan approved

---

**Ready to start? Run `docker-compose up` and begin with Sprint 1!** 🚀
