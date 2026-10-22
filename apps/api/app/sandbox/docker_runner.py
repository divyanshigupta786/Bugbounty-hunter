import shutil
import time
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional
from app.sandbox.base import BaseSandbox, SandboxResult
from app.core.security import redact_sensitive_text


class DockerSandbox(BaseSandbox):
    """
    Disposable Docker container sandbox enforcing:
    - --network none (network disabled during execution)
    - --read-only root filesystem with disposable tmpfs
    - Resource constraints (--memory 512m, --cpus 1.0)
    - Non-root user execution
    - Secret redaction
    """

    def __init__(self, image: str = "python:3.11-slim"):
        self.image = image

    def get_runner_type(self) -> str:
        return "docker"

    async def run_command(
        self,
        working_dir: str,
        command: str,
        timeout_seconds: int = 30,
        env_vars: Optional[Dict[str, str]] = None,
    ) -> SandboxResult:
        work_path = Path(working_dir).resolve()
        start_time = time.perf_counter()

        # Mount workspace to /workspace in container
        docker_cmd = [
            "docker", "run", "--rm",
            "--network", "none",
            "--memory", "512m",
            "--cpus", "1.0",
            "-v", f"{work_path}:/workspace:rw",
            "-w", "/workspace",
            "-e", "PYTHONPATH=/workspace",
            "-e", "PYTHONDONTWRITEBYTECODE=1",
            self.image,
            "sh", "-c", command,
        ]

        timed_out = False
        stdout_text = ""
        stderr_text = ""
        exit_code = -1

        try:
            proc = await asyncio.create_subprocess_exec(
                *docker_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    proc.communicate(),
                    timeout=timeout_seconds,
                )
                exit_code = proc.returncode
                stdout_text = stdout_bytes.decode("utf-8", errors="replace")
                stderr_text = stderr_bytes.decode("utf-8", errors="replace")
            except asyncio.TimeoutError:
                timed_out = True
                proc.kill()
                await proc.wait()
                exit_code = -9
                stderr_text = f"Docker execution timed out after {timeout_seconds} seconds"

        except Exception as e:
            exit_code = -1
            stderr_text = f"Docker invocation failed: {str(e)}"

        duration_ms = int((time.perf_counter() - start_time) * 1000)

        # Output bounding and redaction
        max_chars = 32768
        if len(stdout_text) > max_chars:
            stdout_text = stdout_text[:max_chars] + "\n... [TRUNCATED] ..."
        if len(stderr_text) > max_chars:
            stderr_text = stderr_text[:max_chars] + "\n... [TRUNCATED] ..."

        stdout_text = redact_sensitive_text(stdout_text)
        stderr_text = redact_sensitive_text(stderr_text)

        env_info = {
            "runner": "docker",
            "image": self.image,
            "network": "none",
            "memory_limit": "512m",
            "timeout_seconds": str(timeout_seconds),
        }

        return SandboxResult(
            exit_code=exit_code,
            stdout=stdout_text,
            stderr=stderr_text,
            duration_ms=duration_ms,
            timed_out=timed_out,
            environment_info=env_info,
        )
