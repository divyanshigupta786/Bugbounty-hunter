import pytest
from pathlib import Path
from app.core.security import redact_sensitive_text, validate_repository_url, safe_join_path


def test_secret_redaction():
    log_with_secrets = (
        "Connected to database with password='super_secret_password_123'. "
        "Authorization: Bearer my_personal_access_token_abc_xyz_789. "
        "GitHub token is ghp_123456789012345678901234567890123456."
    )
    sanitized = redact_sensitive_text(log_with_secrets)
    assert "super_secret_password_123" not in sanitized
    assert "my_personal_access_token_abc_xyz_789" not in sanitized
    assert "ghp_123456789012345678901234567890123456" not in sanitized
    assert "[REDACTED_SECRET]" in sanitized


def test_ssrf_protection_rejects_private_ips():
    bad_urls = [
        "https://127.0.0.1/evil/repo.git",
        "https://localhost/repo.git",
        "https://169.254.169.254/latest/meta-data",
        "https://192.168.1.1/internal.git",
        "https://10.0.0.5/private.git",
        "ftp://github.com/user/repo",
    ]
    for url in bad_urls:
        valid, _ = validate_repository_url(url, allow_local_fixture=False)
        assert not valid, f"Expected {url} to be rejected"


def test_ssrf_protection_allows_valid_urls():
    valid_urls = [
        "https://github.com/psf/requests.git",
        "https://gitlab.com/test-org/test-project",
    ]
    for url in valid_urls:
        valid, msg = validate_repository_url(url, allow_local_fixture=False)
        assert valid, f"Expected {url} to be accepted, got: {msg}"


def test_path_traversal_prevention(tmp_path: Path):
    base_dir = tmp_path / "sandbox"
    base_dir.mkdir()

    # Valid relative path
    valid_path = safe_join_path(base_dir, "tests/test_candidate.py")
    assert str(valid_path).startswith(str(base_dir))

    # Path traversal attempt
    with pytest.raises(ValueError, match="Path traversal detected"):
        safe_join_path(base_dir, "../../../etc/passwd")

    with pytest.raises(ValueError, match="Path traversal detected"):
        safe_join_path(base_dir, "..\\..\\Windows\\System32")
