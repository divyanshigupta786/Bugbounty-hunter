from fastapi import APIRouter
from app.api.v1.endpoints import investigations, health, models

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health & Readiness"])
api_router.include_router(models.router, prefix="/models", tags=["Models"])
api_router.include_router(investigations.router, prefix="/investigations", tags=["Investigations"])
