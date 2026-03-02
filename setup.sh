#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# HEDGEAI - DEVELOPMENT SETUP SCRIPT
# ═══════════════════════════════════════════════════════════════

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║         HedgeAI Platform - Development Setup             ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "🔍 Checking prerequisites..."

command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js is not installed${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}❌ npm is not installed${NC}"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo -e "${RED}❌ Python 3 is not installed${NC}"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo -e "${RED}❌ PostgreSQL is not installed${NC}"; exit 1; }

echo -e "${GREEN}✅ All prerequisites found${NC}"
echo ""

# Setup Backend
echo "🔧 Setting up Backend..."
cd backend
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Created backend/.env - Please update with your values${NC}"
fi
npm install
npx prisma generate
echo -e "${GREEN}✅ Backend setup complete${NC}"
cd ..
echo ""

# Setup ML Service
echo "🤖 Setting up ML Service..."
cd ml-service
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
if [ ! -f ".env" ]; then
    cp .env.example .env
fi
deactivate
echo -e "${GREEN}✅ ML Service setup complete${NC}"
cd ..
echo ""

# Setup Frontend
echo "⚛️  Setting up Frontend..."
cd frontend
if [ ! -f ".env" ]; then
    cp .env.example .env
fi
npm install
echo -e "${GREEN}✅ Frontend setup complete${NC}"
cd ..
echo ""

# Create models directory
echo "📦 Creating models directory..."
mkdir -p models
echo -e "${GREEN}✅ Models directory created${NC}"
echo ""

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║              Setup Complete! 🎉                          ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure environment variables:"
echo "   - backend/.env"
echo "   - ml-service/.env"
echo "   - frontend/.env"
echo ""
echo "2. Start PostgreSQL and create database:"
echo "   createdb hedgeai"
echo ""
echo "3. Run database migrations:"
echo "   cd backend && npx prisma migrate dev"
echo ""
echo "4. Start services:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd ml-service && source venv/bin/activate && uvicorn main:app --reload"
echo "   Terminal 3: cd frontend && npm run dev"
echo ""
echo "Or use Docker:"
echo "   docker-compose up -d"
echo ""
