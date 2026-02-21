"""Main FastAPI application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from prometheus_client import make_asgi_app

from src.api.routes import auth, datasets, evaluations, experiments, health, models
from src.utils.config import get_settings
from src.utils.logger import setup_logger

settings = get_settings()
logger = setup_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🚀 Starting Derivative Hedging RL API...")
    logger.info(f"📊 Environment: {settings.ENVIRONMENT}")
    logger.info(f"🔒 Debug mode: {settings.DEBUG}")
    yield
    logger.info("🛑 Shutting down Derivative Hedging RL API...")


# Create FastAPI app
app = FastAPI(
    title="Derivative Hedging RL API",
    description="API for training and evaluating reinforcement learning agents for derivatives hedging",
    version="0.3.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Mount Prometheus metrics
if settings.ENABLE_METRICS:
    metrics_app = make_asgi_app()
    app.mount("/metrics", metrics_app)

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(datasets.router, prefix="/api/v1/datasets", tags=["Datasets"])
app.include_router(experiments.router, prefix="/api/v1/experiments", tags=["Experiments"])
app.include_router(models.router, prefix="/api/v1/models", tags=["Models"])
app.include_router(evaluations.router, prefix="/api/v1/evaluations", tags=["Evaluations"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Derivative Hedging RL API",
        "version": "0.3.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.api.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
    )
