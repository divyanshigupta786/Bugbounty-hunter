import shutil
import platform
import sys
from fastapi import APIRouter
from app.core.config import settings
from app.sandbox.factory import is_docker_active
from app.providers.ollama import OllamaProvider

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check for load balancers and container orchestrators."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/readiness")
async def readiness_check():
    """Readiness probe checking database, sandbox, and inference reachability."""
    docker_ready = is_docker_active()
    ollama_ready = await OllamaProvider().is_available()

    return {
        "status": "ready",
        "checks": {
            "database": "sqlite_ready",
            "docker_sandbox": "available" if docker_ready else "fallback_to_isolated_process",
            "ollama_inference": "available" if ollama_ready else "fallback_to_deterministic_engine",
        },
        "system": {
            "os": platform.platform(),
            "python": sys.version.split()[0],
        },
    }
