from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class SandboxResult(BaseModel):
    exit_code: int
    stdout: str
    stderr: str
    duration_ms: int
    timed_out: bool = False
    environment_info: Dict[str, str] = Field(default_factory=dict)


class BaseSandbox(ABC):
    """Abstract interface for disposable, isolated test execution environments."""

    @abstractmethod
    async def run_command(
        self,
        working_dir: str,
        command: str,
        timeout_seconds: int = 30,
        env_vars: Optional[Dict[str, str]] = None,
    ) -> SandboxResult:
        """Executes a command inside the isolated environment and returns sanitized results."""
        pass

    @abstractmethod
    def get_runner_type(self) -> str:
        """Returns 'docker' or 'isolated_process'."""
        pass
