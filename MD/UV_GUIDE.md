# UV Package Manager Setup Guide

## 🚀 What is UV?

UV is a modern, fast Python package manager written in Rust. It's significantly faster than pip and provides better dependency resolution.

## 📦 Installation

### Windows (PowerShell)
```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### macOS/Linux
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Verify Installation
```bash
uv --version
```

## 🎯 Quick Start with This Project

### 1. Install Dependencies
```bash
# Navigate to project directory
cd E:\Derivative_Hedging_RL

# Create virtual environment
uv venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install project with all dependencies
uv pip install -e "."

# Or install with dev dependencies
uv pip install -e ".[dev]"

# Or install everything
uv pip install -e ".[all]"
```

### 2. Start PostgreSQL and Redis with Docker
```bash
docker-compose up -d postgres redis
```

### 3. Run Database Migrations
```bash
alembic upgrade head
```

### 4. Start the API Server
```bash
uvicorn src.api.main:app --reload
```

### 5. Access the API
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/v1/health

## 📚 UV Commands Cheat Sheet

### Package Management
```bash
# Install a package
uv pip install package_name

# Install from requirements.txt
uv pip install -r requirements.txt

# Install project in editable mode
uv pip install -e .

# Uninstall a package
uv pip uninstall package_name

# List installed packages
uv pip list

# Show package info
uv pip show package_name

# Update all packages
uv pip install --upgrade -r requirements.txt
```

### Virtual Environment
```bash
# Create new virtual environment
uv venv

# Create with specific Python version
uv venv --python 3.10

# Create with custom name
uv venv my_custom_env

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate

# Deactivate
deactivate
```

### Lock File (Coming Soon)
```bash
# Generate lock file
uv lock

# Sync environment with lock file
uv sync
```

## 🔧 Development Workflow

### Install Development Tools
```bash
# Install with dev dependencies
uv pip install -e ".[dev]"

# Install pre-commit hooks
pre-commit install
```

### Run Tests
```bash
# Install test dependencies
uv pip install pytest pytest-cov pytest-asyncio

# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html
```

### Code Quality
```bash
# Format code
black src/ tests/

# Sort imports
isort src/ tests/

# Type checking
mypy src/

# Linting
flake8 src/ tests/
pylint src/
```

## 🐳 Docker Workflow

### Start All Services
```bash
# Start everything (API, PostgreSQL, Redis, Celery, Flower)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (careful - deletes data!)
docker-compose down -v
```

### Individual Services
```bash
# Start only database and cache
docker-compose up -d postgres redis

# Start API only
docker-compose up -d api

# Restart a service
docker-compose restart api

# View service logs
docker-compose logs -f api
```

## 🔥 Useful Commands

### Database
```bash
# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current revision
alembic current

# Show migration history
alembic history
```

### Data Pipeline
```bash
# Download market data
python download_data.py

# Generate synthetic data
python -c "from src.data import SyntheticDataGenerator; SyntheticDataGenerator.generate_training_data()"
```

### API Testing
```bash
# Test health endpoint
curl http://localhost:8000/api/v1/health

# Register user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","username":"testuser","password":"password123"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=password123"
```

## 🆚 UV vs PIP Comparison

| Feature | UV | PIP |
|---------|----|----|
| **Speed** | ⚡ 10-100x faster | Baseline |
| **Dependency Resolution** | ✅ Better | Good |
| **Lock Files** | ✅ Built-in | Requires pip-tools |
| **Parallel Downloads** | ✅ Yes | No |
| **Cache Management** | ✅ Smarter | Basic |
| **Written in** | Rust | Python |

## 🐛 Troubleshooting

### UV Not Found
```bash
# Add to PATH (Windows - add to PowerShell profile)
$env:PATH += ";$env:USERPROFILE\.cargo\bin"

# macOS/Linux - add to ~/.bashrc or ~/.zshrc
export PATH="$HOME/.cargo/bin:$PATH"
```

### SSL Certificate Errors
```bash
# Use trusted host
uv pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org package_name
```

### Permission Errors (Unix/Mac)
```bash
# Install with user flag
uv pip install --user package_name
```

## 📖 Additional Resources

- **UV Documentation**: https://github.com/astral-sh/uv
- **Project Documentation**: [README.md](README.md)
- **Quick Start Guide**: [QUICK_START.md](QUICK_START.md)
- **API Documentation**: http://localhost:8000/docs (when running)

## 💡 Tips

1. **Always use virtual environments** - Keep project dependencies isolated
2. **Use lock files** - Ensure reproducible builds across environments
3. **Cache is your friend** - UV's cache makes reinstalls super fast
4. **Parallel installs** - UV downloads and installs packages in parallel
5. **Check compatibility** - Some packages may have issues; report them to maintainers

## 🎉 You're Ready!

Your Phase 1 setup is complete. You can now:
- ✅ Use UV for blazing fast package management
- ✅ Run PostgreSQL and Redis via Docker
- ✅ Access FastAPI backend with authentication
- ✅ Fetch and preprocess market data
- ✅ Generate synthetic training data

Next steps: Continue to Phase 2 to build the RL environment!
