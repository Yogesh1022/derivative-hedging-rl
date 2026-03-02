# 🎯 HedgeAI - Enterprise Trading Risk Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)](https://www.postgresql.org/)

> **Production-ready microservice architecture for AI-powered derivatives hedging and risk management**

---

## 🌟 Features

### ✨ Core Capabilities

- 🤖 **AI-Powered Risk Analysis** - Reinforcement Learning models for real-time risk prediction
- 📊 **Real-Time Dashboards** - Role-based trading, analytics, and risk management views
- 🔐 **Enterprise Authentication** - JWT-based auth with refresh tokens and role-based access control
- 🐳 **Containerized Deployment** - Docker Compose for development, production-ready orchestration
- 📈 **Advanced Analytics** - VaR, Greeks, Sharpe Ratio, volatility monitoring
- 🛡️ **Security First** - Helmet, rate limiting, input validation, bcrypt hashing

### 🎯 Supported User Roles

- **Trader**: Portfolio management, trade execution, AI hedging recommendations
- **Analyst**: Performance analytics, baseline comparisons, risk metrics
- **Risk Manager**: VaR analysis, limit monitoring, alert management
- **Admin**: User management, system configuration, audit logs

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                       │
│          React 18 + Vite + TypeScript                   │
│                   Port: 3000/5173                       │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/REST + JWT
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  API Gateway Layer                      │
│          Node.js + Express + TypeScript                 │
│                     Port: 5000                          │
│  ┌───────────┐ ┌──────────────┐ ┌─────────────┐       │
│  │   Auth    │ │  Portfolio   │ │ Risk Mgmt   │       │
│  │ Service   │ │   Service    │ │  Service    │       │
│  └───────────┘ └──────────────┘ └─────────────┘       │
└───────┬──────────────────┬──────────────────────────────┘
        │                  │
        ▼                  ▼
┌───────────────┐   ┌─────────────────────┐
│  PostgreSQL   │   │  FastAPI ML Service │
│   Database    │   │   (Python 3.11)     │
│   Port: 5432  │   │    Port: 8000       │
└───────────────┘   └─────────────────────┘
        │                  │
        │                  ▼
        │           ┌─────────────┐
        │           │  RL Models  │
        │           │  (PPO/SAC)  │
        │           └─────────────┘
        ▼
┌───────────────┐
│  Redis Cache  │
│  (Optional)   │
│  Port: 6379   │
└───────────────┘
```

### Tech Stack

**Frontend**:
- React 18 + TypeScript
- Vite (build tool)
- Axios (API client)
- Recharts (data visualization)
- Framer Motion (animations)

**Backend API**:
- Node.js 18+ + TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- JWT + bcrypt
- Winston (logging)

**ML Service**:
- FastAPI + Python 3.11
- Stable Baselines3 (RL)
- NumPy, Pandas
- Joblib (model serialization)
- Pydantic (validation)

**Infrastructure**:
- Docker + Docker Compose
- Nginx (reverse proxy)
- PostgreSQL 15
- Redis 7 (optional)

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/your-org/hedgeai.git
cd hedgeai

# Start all services
docker-compose up -d

# Run database migrations
docker exec hedgeai-backend npx prisma migrate deploy

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# ML Service Docs: http://localhost:8000/docs
```

### Option 2: Local Development

**Prerequisites**: Node.js 18+, Python 3.11+, PostgreSQL 15+

```bash
# 1. Setup Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev  # Port 5000

# 2. Setup ML Service
cd ml-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload  # Port 8000

# 3. Setup Frontend
cd frontend
npm install
cp .env.example .env
npm run dev  # Port 5173
```

**📖 Full documentation**: [QUICKSTART.md](QUICKSTART.md)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](QUICKSTART.md) | Get started in 5 minutes |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Production deployment guide |
| [ARCHITECTURE_FLOW.md](ARCHITECTURE_FLOW.md) | System architecture & data flow |
| [frontend/ARCHITECTURE.md](frontend/ARCHITECTURE.md) | Frontend design system |

---

## 🔑 API Endpoints

### Authentication

```http
POST   /api/auth/register    # Register new user
POST   /api/auth/login       # Login user
POST   /api/auth/refresh     # Refresh access token
POST   /api/auth/logout      # Logout user
GET    /api/auth/me          # Get current user profile
```

### ML Service

```http
GET    /api/ml/health                # Check ML service health
GET    /api/ml/model-info            # Get model information
POST   /api/ml/predict               # Get risk prediction
POST   /api/ml/recommend-hedge       # Get hedging recommendation
POST   /api/ml/batch-predict         # Batch prediction (Risk Manager only)
```

**Interactive API Docs**: `http://localhost:8000/docs` (FastAPI Swagger UI)

---

## 🔒 Security Features

✅ **JWT Authentication** - Access tokens (15 min) + Refresh tokens (7 days)  
✅ **Password Hashing** - bcrypt with 12 salt rounds  
✅ **Role-Based Access Control** - Middleware enforcement  
✅ **Rate Limiting** - 100 requests per 15 minutes  
✅ **Input Validation** - express-validator + Pydantic  
✅ **CORS** - Configured for allowed origins  
✅ **Security Headers** - Helmet.js  
✅ **SQL Injection Protection** - Prisma ORM parameterized queries  

---

## 📊 Database Schema

### Core Tables

- **User** - Authentication & user profiles
- **Portfolio** - Portfolio metadata & cached ML predictions
- **Position** - Individual positions (stocks, options, futures)
- **Trade** - Trade history & execution records
- **RiskAlert** - Risk notifications & warnings
- **PortfolioHistory** - Time-series snapshots for charting
- **AuditLog** - System audit trail
- **MLModel** - ML model metadata & performance tracking

**Full schema**: [backend/prisma/schema.prisma](backend/prisma/schema.prisma)

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# ML Service tests
cd ml-service
pytest

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

---

## 📈 Performance

| Metric | Target | Status |
|--------|--------|--------|
| API Latency (p95) | < 200ms | ✅ |
| ML Prediction (p95) | < 500ms | ✅ |
| Frontend LCP | < 2.5s | ✅ |
| Database Query (p95) | < 50ms | ✅ |
| Uptime SLA | 99.9% | 🎯 |

---

## 🚢 Deployment

### Production Checklist

- [ ] Update all secrets in `.env` files
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/TLS
- [ ] Configure production database with backups
- [ ] Setup monitoring (CloudWatch, DataDog, etc.)
- [ ] Configure domain & DNS
- [ ] Setup CI/CD pipeline
- [ ] Load testing
- [ ] Security audit

### Deployment Options

1. **VPS** (DigitalOcean, Linode, AWS EC2) - See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. **AWS** (ECS + RDS + S3 + CloudFront) - Full guide included
3. **Kubernetes** - K8s manifests provided

---

## 🛠️ Development

### Project Structure

```
hedgeai/
├── backend/                 # Node.js API Gateway
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── routes/         # API routes
│   │   └── types/          # TypeScript types
│   ├── prisma/             # Prisma schema & migrations
│   └── Dockerfile
├── ml-service/             # FastAPI ML Service
│   ├── main.py            # FastAPI application
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── services/      # API clients
│   │   ├── components/    # React components
│   │   └── pages/         # Page components
│   └── Dockerfile
├── models/                 # Trained ML models
├── docker-compose.yml      # Development orchestration
└── docker-compose.prod.yml # Production orchestration
```

### Adding a New Endpoint

**1. Define route** (`backend/src/routes/portfolio.routes.ts`)
```typescript
router.get('/portfolio/:id', authenticate, portfolioController.getById);
```

**2. Create controller** (`backend/src/controllers/portfolio.controller.ts`)
```typescript
export const portfolioController = {
  getById: asyncHandler(async (req, res) => {
    // Implementation
  })
};
```

**3. Add to app** (`backend/src/app.ts`)
```typescript
app.use('/api/portfolio', portfolioRoutes);
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style

- **Backend**: ESLint + Prettier
- **Frontend**: ESLint + Prettier
- **Python**: Black + isort

---

## 📝 Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/hedgeai
JWT_SECRET=your-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret
ML_SERVICE_URL=http://localhost:8000
```

### ML Service (.env)

```env
HOST=0.0.0.0
PORT=8000
MODEL_PATH=./models/rl_agent_ppo.pkl
MODEL_TYPE=PPO
CORS_ORIGINS=http://localhost:5000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
```

---

## 🐛 Troubleshooting

### Common Issues

**Database connection failed**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql $DATABASE_URL
```

**Port already in use**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

**ML Service model not found**
```bash
# Check model path
ls -la ml-service/models/

# Update MODEL_PATH in .env
```

**CORS errors**
```env
# Update backend/.env
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for more troubleshooting.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- Stable Baselines3 for RL implementations
- Prisma for excellent ORM
- FastAPI for ML service framework
- React team for amazing frontend library

---

## 📞 Support

- **Documentation**: Check `/docs` folder
- **Issues**: [GitHub Issues](https://github.com/your-org/hedgeai/issues)
- **Email**: support@hedgeai.com
- **Discord**: [Join our community](https://discord.gg/hedgeai)

---

<p align="center">
  Built with ❤️ by the HedgeAI Team
  <br>
  <sub>Last Updated: February 2026 | Version 1.0.0</sub>
</p>
