import httpx
from fastapi import APIRouter
from app.core.config import settings
from app.providers.ollama import OllamaProvider
from app.providers.gemini import GeminiProvider

router = APIRouter()


@router.get("")
async def list_available_models():
    """List available model configurations, providers, and local/cloud status."""
    ollama_provider = OllamaProvider()
    ollama_online = await ollama_provider.is_available()

    gemini_provider = GeminiProvider()
    gemini_online = await gemini_provider.is_available()

    models = [
        {
            "id": "gemini-2.5-flash",
            "name": "Google Gemini 2.5 Flash",
            "provider": "gemini",
            "recommended": True if gemini_online else False,
            "status": "ready" if gemini_online else "offline",
            "description": "Ultra-fast multimodal model with state-of-the-art coding and reasoning capabilities",
        },
        {
            "id": "gemini-1.5-pro",
            "name": "Google Gemini 1.5 Pro",
            "provider": "gemini",
            "recommended": False,
            "status": "ready" if gemini_online else "offline",
            "description": "Frontier multimodal reasoning model with 2M token context for complex codebases",
        },
        {
            "id": "qwen2.5-coder:7b",
            "name": "Qwen 2.5 Coder (7B)",
            "provider": "ollama",
            "recommended": True if (ollama_online and not gemini_online) else False,
            "status": "ready" if ollama_online else "offline",
            "description": "High-accuracy open-weight coding model for local hypothesis and test generation",
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

    default_model = "gemini-2.5-flash" if gemini_online else ("qwen2.5-coder:7b" if ollama_online else "deterministic-fixture")

    return {
        "providers": [
            {
                "id": "gemini",
                "name": "Google Gemini (Cloud AI)",
                "online": gemini_online,
                "endpoint": "https://generativelanguage.googleapis.com",
            },
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
        "default": default_model,
    }
