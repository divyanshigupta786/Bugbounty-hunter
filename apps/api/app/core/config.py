from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from pathlib import Path


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "BugBounty Hunter API"
    ENVIRONMENT: str = "development"

    # Database: SQLite for local / fallback, PostgreSQL supported via standard DSN
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./data/bugbounty.db",
        description="Async SQLAlchemy database connection string",
    )

    # Base storage directory for checked-out repositories, sandboxes, and proof packs
    DATA_DIR: Path = Field(default=Path("./data"))

    # Model inference settings
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    DEFAULT_MODEL_NAME: str = "qwen2.5-coder:7b"
    MODEL_TIMEOUT_SECONDS: int = 45

    # Sandbox execution limits
    SANDBOX_BACKEND: str = "auto"  # 'auto', 'docker', or 'isolated_process'
    MAX_ATTEMPTS: int = 3
    PER_TEST_TIMEOUT_SECONDS: int = 30
    MAX_INVESTIGATION_TIMEOUT_SECONDS: int = 300
    MEMORY_LIMIT_MB: int = 512

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]


settings = Settings()
# Ensure data directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
(settings.DATA_DIR / "sandboxes").mkdir(parents=True, exist_ok=True)
(settings.DATA_DIR / "artifacts").mkdir(parents=True, exist_ok=True)
(settings.DATA_DIR / "repos").mkdir(parents=True, exist_ok=True)
