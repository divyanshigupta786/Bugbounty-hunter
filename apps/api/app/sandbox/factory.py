import shutil
import subprocess
from app.sandbox.base import BaseSandbox
from app.sandbox.isolated_process import IsolatedProcessSandbox
from app.sandbox.docker_runner import DockerSandbox
from app.core.config import settings


def is_docker_active() -> bool:
    """Check if Docker CLI is installed and Docker daemon responds."""
    if not shutil.which("docker"):
        return False
    try:
        res = subprocess.run(
            ["docker", "info"],
            capture_output=True,
            timeout=2,
            text=True,
        )
        return res.returncode == 0
    except Exception:
        return False


def get_sandbox(preference: str = "auto") -> BaseSandbox:
    """
    Factory returning appropriate sandbox implementation.
    Respects config settings: 'auto', 'docker', or 'isolated_process'.
    """
    selected = preference if preference != "auto" else settings.SANDBOX_BACKEND

    if selected == "docker":
        if is_docker_active():
            return DockerSandbox()
        # Fallback if explicitly requested but daemon down
        return IsolatedProcessSandbox()

    if selected == "auto":
        if is_docker_active():
            return DockerSandbox()
        return IsolatedProcessSandbox()

    return IsolatedProcessSandbox()
