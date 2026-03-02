# 🚀 HedgeAI Platform - Complete Setup & Deployment Guide

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [API Documentation](#api-documentation)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

```
┌─────────────────┐
│  React Frontend │  (Port 3000/5173)
│  (Vite + TS)    │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Node.js API    │  (Port 5000)
│  Gateway         │
│  (Express + TS) │
└────┬───────┬────┘
     │       │
     │       └──────────┐
     ▼                  ▼
┌─────────┐      ┌──────────────┐
│ PostgreSQL│      │ FastAPI ML   │  (Port 8000)
│ Database  │      │ Service      │
│           │      │ (Python)     │
└───────────┘      └──────────────┘
```

### Key Components:

- **Frontend (React + Vite)**: User interface with role-based dashboards
- **Backend API (Node.js)**: Authentication, business logic, API gateway
- **PostgreSQL**: Primary database for users, portfolios, trades
- **FastAPI ML Service**: Machine learning model serving
- **Redis** (Optional): Caching layer

---

## ✅ Prerequisites

### Required Software:

- **Node.js** 18+ and npm 9+
- **Python** 3.11+
- **PostgreSQL** 15+
- **Docker** & Docker Compose (for containerized deployment)
- **Git**

### Optional:

- **Redis** 7+ (for caching)
- **AWS CLI** or other cloud provider CLI (for production deployment)

---

## 💻 Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/hedgeai.git
cd hedgeai
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Set DATABASE_URL, JWT_SECRET, etc.

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed

# Start development server
npm run dev
```

**Backend will be running at**: `http://localhost:5000`

### 3. ML Service Setup

```bash
cd ml-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Start FastAPI server
uvicorn main:app --reload --port 8000
```

**ML Service will be running at**: `http://localhost:8000`

**API Documentation**: `http://localhost:8000/docs`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env
# VITE_API_URL=http://localhost:5000/api
# VITE_WS_URL=http://localhost:5000

# Start development server
npm run dev
```

**Frontend will be running at**: `http://localhost:5173`

### 5. PostgreSQL Setup (Local)

```bash
# Install PostgreSQL (if not already installed)

# Create database
createdb hedgeai

# Or using psql:
psql -U postgres
CREATE DATABASE hedgeai;
\q
```

Update `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/hedgeai?schema=public"
```

---

## 🐳 Docker Deployment

### Development Environment

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

**Services will be available at**:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- ML Service: `http://localhost:8000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### Production Environment

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Useful Docker Commands

```bash
# Rebuild specific service
docker-compose build backend

# Shell into container
docker exec -it hedgeai-backend sh

# View database
docker exec -it hedgeai-postgres psql -U postgres -d hedgeai

# Run migrations in container
docker exec hedgeai-backend npx prisma migrate deploy

# View container logs
docker logs hedgeai-backend --tail 100 -f
```

---

## 🚀 Production Deployment

### Option 1: VPS (DigitalOcean, Linode, AWS EC2)

**1. Prepare Server**

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**2. Clone & Configure**

```bash
git clone https://github.com/your-org/hedgeai.git
cd hedgeai

# Create production environment file
cp .env.example .env.production

# Edit with production values
nano .env.production
```

**Important**: Change all default secrets!

**3. Deploy**

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker exec hedgeai-backend npx prisma migrate deploy

# Create admin user (optional)
docker exec -it hedgeai-backend npm run seed
```

**4. Setup Nginx Reverse Proxy**

```nginx
# /etc/nginx/sites-available/hedgeai

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hedgeai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

### Option 2: AWS Deployment

**Architecture**:
- **Frontend**: S3 + CloudFront
- **Backend**: ECS Fargate or EC2
- **Database**: RDS PostgreSQL
- **ML Service**: ECS Fargate or Lambda (for inference)

**Steps**:

1. **Setup RDS PostgreSQL**
```bash
# Create RDS instance via AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier hedgeai-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YourSecurePassword \
  --allocated-storage 20
```

2. **Deploy Backend to ECS**
```bash
# Build and push Docker image
docker build -t hedgeai-backend ./backend
docker tag hedgeai-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/hedgeai-backend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/hedgeai-backend:latest

# Create ECS task definition and service via AWS Console
```

3. **Deploy Frontend to S3**
```bash
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://hedgeai-frontend --delete

# Setup CloudFront distribution pointing to S3 bucket
```

### Option 3: Kubernetes (Advanced)

See separate `K8S_DEPLOYMENT.md` for Kubernetes deployment guide.

---

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "role": "TRADER"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "TRADER"
    }
  }
}
```

#### POST `/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### POST `/api/auth/refresh`
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### GET `/api/auth/me`
Headers: `Authorization: Bearer <token>`

### ML Service Endpoints

#### POST `/api/ml/predict`
```json
{
  "portfolioId": "uuid"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "riskScore": 72,
    "volatility": 0.184,
    "var95": -42100.50,
    "var99": -58200.75,
    "sharpeRatio": 1.42,
    "recommendation": "MODERATE: Portfolio risk is within acceptable range...",
    "confidence": 0.85,
    "timestamp": "2025-02-26T10:30:00Z"
  }
}
```

#### POST `/api/ml/recommend-hedge`
```json
{
  "portfolioId": "uuid"
}
```

**Full API Documentation**: Run backend and visit `http://localhost:5000/api-docs`

---

## 🔒 Security Best Practices

### Environment Variables

**NEVER commit** `.env` files to version control!

**Production Checklist**:

✅ Change all default secrets (JWT_SECRET, DATABASE passwords)  
✅ Use strong passwords (min 32 characters for secrets)  
✅ Enable HTTPS/TLS in production  
✅ Set `NODE_ENV=production`  
✅ Use secure cookies for sensitive data  
✅ Enable rate limiting  
✅ Setup CORS properly  
✅ Keep dependencies updated  

### Database Security

```bash
# Create read-only user for analytics
CREATE USER analytics_user WITH PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;

# Backup database regularly
pg_dump hedgeai > backup_$(date +%Y%m%d).sql
```

### Secrets Management

**For Production**:
- Use **AWS Secrets Manager** or **HashiCorp Vault**
- Environment variables via container orchestration
- Never hardcode secrets in code

---

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Failed**

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

**2. Prisma Migration Issues**

```bash
# Reset database (CAREFUL: deletes all data)
npx prisma migrate reset

# Force deploy migrations
npx prisma migrate deploy --skip-seed
```

**3. Port Already in Use**

```bash
# Find process using port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env
PORT=5001
```

**4. ML Service Model Not Found**

```bash
# Check model path
ls -la ml-service/models/

# Mount models directory in Docker
volumes:
  - ./models:/app/models:ro
```

**5. CORS Errors**

Update `backend/.env`:
```env
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# Backend logs
docker logs hedgeai-backend -f

# ML Service logs
docker logs hedgeai-ml-service -f

# Database logs
docker logs hedgeai-postgres -f

# All services
docker-compose logs -f
```

### Health Checks

```bash
# Backend health
curl http://localhost:5000/health

# ML Service health
curl http://localhost:8000/health

# Database health
docker exec hedgeai-postgres pg_isready -U postgres
```

---

## 🔄 Database Migrations

### Create New Migration

```bash
cd backend
npx prisma migrate dev --name add_new_feature
```

### Deploy to Production

```bash
npx prisma migrate deploy
```

### Rollback Migration (Manual)

```bash
# Not supported directly - restore from backup
psql hedgeai < backup_20250226.sql
```

---

## 📈 Performance Optimization

### Backend

- Enable Redis caching
- Use connection pooling
- Optimize Prisma queries
- Add database indexes

### Frontend

- Code splitting
- Lazy loading routes
- Image optimization
- CDN for static assets

### ML Service

- Model quantization
- Batch predictions
- GPU acceleration (if available)
- Model caching

---

## 📝 License

MIT License - see LICENSE file

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📞 Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Email: support@hedgeai.com

---

**Last Updated**: February 26, 2026  
**Version**: 1.0.0
