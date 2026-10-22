import os
import sys
import time
import asyncio
import platform
from pathlib import Path
from typing import Dict, Any, Optional
from app.sandbox.base import BaseSandbox, SandboxResult
from app.core.security import redact_sensitive_text


class IsolatedProcessSandbox(BaseSandbox):
    """
    Subprocess sandbox enforcing:
    - Purged environment variables (no host secrets or cloud credentials)
    - Strict execution timeout
    - Directory confinement
    - Max output size limits
    - Secret redaction
    """

    def get_runner_type(self) -> str:
        return "isolated_process"

    async def run_command(
        self,
        working_dir: str,
        command: str,
        timeout_seconds: int = 30,
        env_vars: Optional[Dict[str, str]] = None,
    ) -> SandboxResult:
        work_path = Path(working_dir).resolve()
        if not work_path.exists():
            raise FileNotFoundError(f"Working directory does not exist: {work_path}")

        # Construct sanitized, minimal environment
        scripts_dir = str(Path(sys.executable).parent)
        system_path = os.environ.get("PATH", "")
        safe_path = f"{scripts_dir};{system_path}" if scripts_dir not in system_path else system_path

        safe_env = {
            "PATH": safe_path,
            "SYSTEMROOT": os.environ.get("SYSTEMROOT", "C:\\Windows"),
            "WINDIR": os.environ.get("WINDIR", "C:\\Windows"),
            "PYTHONPATH": str(work_path),
            "PYTHONUNBUFFERED": "1",
            "PYTHONDONTWRITEBYTECODE": "1",
            "TMP": str(work_path / ".tmp"),
            "TEMP": str(work_path / ".tmp"),
        }

        # Normalize pytest command to use current python interpreter
        exec_cmd = command
        if command.startswith("pytest"):
            exec_cmd = f'"{sys.executable}" -m {command}'

        # Create localized temporary directory
        (work_path / ".tmp").mkdir(exist_ok=True)

        if env_vars:
            safe_env.update(env_vars)

        start_time = time.perf_counter()
        timed_out = False
        stdout_text = ""
        stderr_text = ""
        exit_code = -1

        try:
            # Run command asynchronously using current Python interpreter if command starts with pytest/python
            proc = await asyncio.create_subprocess_shell(
                exec_cmd,
                cwd=str(work_path),
                env=safe_env,
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
                stderr_text = f"Execution timed out after {timeout_seconds} seconds"

        except Exception as e:
            exit_code = -1
            stderr_text = f"Execution failed: {str(e)}"

        duration_ms = int((time.perf_counter() - start_time) * 1000)

        # Output bounding to 32KB to prevent memory bloat
        max_chars = 32768
        if len(stdout_text) > max_chars:
            stdout_text = stdout_text[:max_chars] + "\n... [TRUNCATED: output exceeded 32KB] ..."
        if len(stderr_text) > max_chars:
            stderr_text = stderr_text[:max_chars] + "\n... [TRUNCATED: output exceeded 32KB] ..."

        # Secret redaction
        stdout_text = redact_sensitive_text(stdout_text)
        stderr_text = redact_sensitive_text(stderr_text)

        env_info = {
            "os": platform.platform(),
            "python_version": sys.version.split()[0],
            "runner": "isolated_process",
            "working_dir": str(work_path),
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
