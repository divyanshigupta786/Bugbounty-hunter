from typing import Optional
from app.providers.base import BaseModelProvider
from app.providers.deterministic import DeterministicFixtureProvider
from app.providers.ollama import OllamaProvider


def get_model_provider(
    provider_name: Optional[str] = "ollama",
    model_name: Optional[str] = None,
    is_demo: bool = False,
) -> BaseModelProvider:
    """Factory creating appropriate model provider."""
    if is_demo or provider_name in ("deterministic", "fixture"):
        return DeterministicFixtureProvider()

    if provider_name == "ollama":
        return OllamaProvider(model_name=model_name)

    # Default fallback
    return DeterministicFixtureProvider()
