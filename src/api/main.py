"""Main FastAPI application."""

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from prometheus_client import make_asgi_app

from src.api.routes import (
    auth,
    datasets,
    environments,
    baselines,
    evaluations,
    experiments,
    health,
    models,
)
from src.api.websocket import get_socket_app, sio, get_connection_info
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


# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests and responses."""
    start_time = time.time()
    
    # Log request
    logger.info(f"→ {request.method} {request.url.path}")
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    process_time = time.time() - start_time
    
    # Log response
    logger.info(
        f"← {request.method} {request.url.path} "
        f"[{response.status_code}] {process_time:.3f}s"
    )
    
    # Add custom header
    response.headers["X-Process-Time"] = str(process_time)
    
    return response


# Mount Prometheus metrics
if settings.ENABLE_METRICS:
    metrics_app = make_asgi_app()
    app.mount("/metrics", metrics_app)

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(datasets.router, prefix="/api/v1/datasets", tags=["Datasets"])
app.include_router(environments.router, prefix="/api/v1", tags=["Environments"])
app.include_router(baselines.router, prefix="/api/v1", tags=["Baselines"])
app.include_router(experiments.router, prefix="/api/v1/experiments", tags=["Experiments"])
app.include_router(models.router, prefix="/api/v1/models", tags=["Models"])
app.include_router(evaluations.router, prefix="/api/v1/evaluations", tags=["Evaluations"])

# Mount WebSocket application
logger.info("🔌 Mounting WebSocket server at /socket.io/")
app.mount("/socket.io", get_socket_app())


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Derivative Hedging RL API",
        "version": "0.3.0",
        "docs": "/docs",
        "health": "/api/v1/health",
        "websocket": "/socket.io",
    }


@app.get("/ws-info")
async def websocket_info():
    """Get WebSocket connection information."""
    return get_connection_info()


@app.get("/ws-test")
async def websocket_test():
    """Test WebSocket broadcasting."""
    from src.api.websocket import broadcast_to_all
    await broadcast_to_all('test_message', {
        'message': 'Test broadcast from API',
        'timestamp': time.time()
    })
    return {
        "status": "broadcasted",
        "message": "Test message sent to all connected clients"
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
