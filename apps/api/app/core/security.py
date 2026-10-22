import re
import ipaddress
from urllib.parse import urlparse
from pathlib import Path
from typing import Tuple

# Pattern matching potential API keys, auth tokens, and secret strings
SENSITIVE_PATTERNS = [
    re.compile(r"(?i)(api[_-]?key|secret|token|password|passwd|authorization)\s*[:=]\s*['\"]?([a-zA-Z0-9_\-\.]{8,})['\"]?"),
    re.compile(r"(?i)bearer\s+([a-zA-Z0-9_\-\.]{16,})"),
    re.compile(r"ghp_[a-zA-Z0-9]{36}"),
    re.compile(r"github_pat_[a-zA-Z0-9_]{82}"),
]


def redact_sensitive_text(text: str) -> str:
    """Sanitize execution logs, commands, and outputs by redacting secrets."""
    if not text:
        return ""
    sanitized = text
    # 1. Bearer authorization tokens (with or without Authorization: prefix)
    sanitized = re.sub(
        r"(?i)\b(authorization\s*:\s*)?bearer\s+[a-zA-Z0-9_\-\.]{8,}",
        r"Authorization: Bearer [REDACTED_SECRET]",
        sanitized,
    )
    # 2. Key-value secret assignments: e.g. password='...', token=...
    sanitized = re.sub(
        r"(?i)\b(api[_-]?key|secret|token|password|passwd)\s*([:=])\s*['\"]?([a-zA-Z0-9_\-\.]{6,})['\"]?",
        r"\1\2[REDACTED_SECRET]",
        sanitized,
    )
    # 3. GitHub PAT tokens
    sanitized = re.sub(r"ghp_[a-zA-Z0-9]{36}", "[REDACTED_SECRET]", sanitized)
    sanitized = re.sub(r"github_pat_[a-zA-Z0-9_]{82}", "[REDACTED_SECRET]", sanitized)
    return sanitized


def validate_repository_url(url: str, allow_local_fixture: bool = True) -> Tuple[bool, str]:
    """
    Validate repository URL for SSRF protection and schema correctness.
    Allows file:// or local fixture paths only if allow_local_fixture is True.
    """
    if not url or not isinstance(url, str):
        return False, "Repository URL must be provided"

    clean_url = url.strip()

    # Local fixture repo support
    if allow_local_fixture and (clean_url.startswith("fixture://") or "sample-buggy-repo" in clean_url):
        return True, "Valid local fixture repository"

    parsed = urlparse(clean_url)
    if parsed.scheme not in ("https", "git"):
        return False, "Repository URL must use https or git scheme"

    hostname = parsed.hostname
    if not hostname:
        return False, "Invalid repository URL hostname"

    # Reject localhost, loopback, private ranges, metadata endpoints
    blocked_hostnames = {
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
        "::1",
        "metadata.google.internal",
        "169.254.169.254",
    }
    if hostname.lower() in blocked_hostnames:
        return False, f"Host {hostname} is restricted (SSRF protection)"

    # Check for private IP address resolution
    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_link_local:
            return False, f"IP address {hostname} is within a private network"
    except ValueError:
        # Not a raw IP address; hostname domain is permitted
        pass

    return True, "Valid repository URL"


def safe_join_path(base_dir: Path, relative_path: str) -> Path:
    """
    Safely resolve a relative path under base_dir, preventing path traversal attacks.
    Raises ValueError if the path escapes base_dir.
    """
    clean_rel = Path(relative_path).as_posix().lstrip("/\\")
    resolved = (base_dir / clean_rel).resolve()
    base_resolved = base_dir.resolve()

    if not str(resolved).startswith(str(base_resolved)):
        raise ValueError(f"Path traversal detected: {relative_path} attempts to escape {base_dir}")

    return resolved
