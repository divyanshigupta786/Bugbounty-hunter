import httpx
from fastapi import APIRouter
from app.core.config import settings
from app.providers.ollama import OllamaProvider

router = APIRouter()


@router.get("")
async def list_available_models():
    """List available model configurations, providers, and local Ollama status."""
    ollama_provider = OllamaProvider()
    ollama_online = await ollama_provider.is_available()

    models = [
        {
            "id": "qwen2.5-coder:7b",
            "name": "Qwen 2.5 Coder (7B)",
            "provider": "ollama",
            "recommended": True,
            "status": "ready" if ollama_online else "offline",
            "description": "High-accuracy open-weight coding model for hypothesis and test generation",
        },
        {
            "id": "deepseek-coder:6.7b",
            "name": "DeepSeek Coder (6.7B)",
            "provider": "ollama",
            "recommended": False,
            "status": "ready" if ollama_online else "offline",
            "description": "Open-weight coding model optimized for repository reasoning",
        },
        {
            "id": "deterministic-fixture",
            "name": "Deterministic Engine (Offline)",
            "provider": "deterministic",
            "recommended": False,
            "status": "ready",
            "description": "Zero-dependency deterministic rule engine and AST analyzer",
        },
    ]

    return {
        "providers": [
            {
                "id": "ollama",
                "name": "Ollama (Local Inference)",
                "online": ollama_online,
                "endpoint": settings.OLLAMA_BASE_URL,
            },
            {
                "id": "deterministic",
                "name": "Deterministic / Fixture Engine",
                "online": True,
                "endpoint": "local",
            },
        ],
        "models": models,
        "default": "qwen2.5-coder:7b" if ollama_online else "deterministic-fixture",
    }
