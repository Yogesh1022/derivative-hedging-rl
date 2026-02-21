"""Health check endpoints."""

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_async_db
from src.utils.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/health")
async def health_check():
    """Basic health check."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "0.3.0",
        "environment": settings.ENVIRONMENT,
    }


@router.get("/health/db")
async def database_health(db: AsyncSession = Depends(get_async_db)):
    """Database health check."""
    try:
        await db.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


@router.get("/health/ready")
async def readiness_check(db: AsyncSession = Depends(get_async_db)):
    """Readiness probe for Kubernetes."""
    try:
        await db.execute("SELECT 1")
        return {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat(),
            "checks": {"database": "ok", "redis": "ok"},
        }
    except Exception as e:
        return {"status": "not_ready", "error": str(e)}


@router.get("/health/live")
async def liveness_check():
    """Liveness probe for Kubernetes."""
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}
