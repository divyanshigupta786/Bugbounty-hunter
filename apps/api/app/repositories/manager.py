import os
import shutil
import subprocess
import hashlib
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.core.security import safe_join_path, validate_repository_url


class RepositoryManager:
    """Manages cloning, checking out, and deterministic code retrieval of target repositories."""

    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or settings.DATA_DIR
        self.repos_dir = self.data_dir / "repos"
        self.repos_dir.mkdir(parents=True, exist_ok=True)

    def prepare_repository(
        self,
        repository_url: str,
        investigation_id: str,
        commit_sha: Optional[str] = None,
        branch: Optional[str] = None,
        is_demo: bool = False,
    ) -> Dict[str, Any]:
        """
        Prepares a working copy of the target repository in an isolated workspace.
        Supports:
          1. Local fixture repository (fixtures/sample-buggy-repo)
          2. Git remote repository (with SSRF verification)
        """
        valid, msg = validate_repository_url(repository_url, allow_local_fixture=True)
        if not valid:
            raise ValueError(f"Invalid repository URL: {msg}")

        target_dir = self.repos_dir / investigation_id
        if target_dir.exists():
            shutil.rmtree(target_dir, ignore_errors=True)

        target_dir.mkdir(parents=True, exist_ok=True)

        # Check if local fixture repository is requested
        is_fixture = (
            repository_url.startswith("fixture://")
            or "sample-buggy-repo" in repository_url
            or repository_url == "sample-buggy-repo"
        )

        resolved_commit = commit_sha or "HEAD"

        if is_fixture:
            fixture_source = Path("fixtures/sample-buggy-repo").resolve()
            if not fixture_source.exists():
                # Check relative to repo root
                alt_path = Path(__file__).resolve().parent.parent.parent.parent.parent / "fixtures" / "sample-buggy-repo"
                if alt_path.exists():
                    fixture_source = alt_path

            if not fixture_source.exists():
                raise FileNotFoundError(f"Fixture repository not found at {fixture_source}")

            # Copy fixture files to target directory
            shutil.copytree(fixture_source, target_dir, dirs_exist_ok=True)
            resolved_commit = "fixture-v0.1.0"
        else:
            # Clone Git repo using shallow clone
            cmd = ["git", "clone", "--depth", "1"]
            if branch:
                cmd.extend(["--branch", branch])
            cmd.extend([repository_url, str(target_dir)])

            try:
                subprocess.run(
                    cmd,
                    check=True,
                    capture_output=True,
                    timeout=60,
                    text=True,
                )
            except subprocess.CalledProcessError as e:
                raise RuntimeError(f"Git clone failed: {e.stderr.strip() or e.stdout.strip()}")

            if commit_sha and commit_sha != "HEAD":
                # Fetch and checkout specific commit
                try:
                    subprocess.run(
                        ["git", "checkout", commit_sha],
                        cwd=str(target_dir),
                        check=True,
                        capture_output=True,
                        timeout=30,
                        text=True,
                    )
                    resolved_commit = commit_sha
                except subprocess.CalledProcessError:
                    pass

        metadata = self._inspect_repository(target_dir)
        metadata["working_path"] = str(target_dir)
        metadata["commit_sha"] = resolved_commit
        metadata["is_fixture"] = is_fixture
        return metadata

    def _inspect_repository(self, repo_dir: Path) -> Dict[str, Any]:
        """Inspects project structure, language, test configuration and source files."""
        has_pyproject = (repo_dir / "pyproject.toml").exists()
        has_setup_py = (repo_dir / "setup.py").exists()
        has_pytest = (repo_dir / "pytest.ini").exists() or has_pyproject
        has_tests_dir = (repo_dir / "tests").exists() or (repo_dir / "test").exists()

        source_files = []
        test_files = []

        for root, dirs, files in os.walk(repo_dir):
            # Ignore hidden and cache directories
            dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ("__pycache__", "venv", "node_modules")]
            for file in files:
                if file.endswith(".py"):
                    rel_path = Path(root, file).relative_to(repo_dir).as_posix()
                    if rel_path.startswith("test") or "test_" in rel_path or "_test" in rel_path:
                        test_files.append(rel_path)
                    else:
                        source_files.append(rel_path)

        return {
            "language": "python",
            "test_framework": "pytest",
            "has_pyproject": has_pyproject,
            "has_setup_py": has_setup_py,
            "has_tests_dir": has_tests_dir,
            "source_files": sorted(source_files),
            "test_files": sorted(test_files),
        }

    def search_relevant_code(
        self,
        repo_dir: Path,
        keywords: List[str],
        max_files: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Deterministic search for source files containing relevant functions, classes, or keywords.
        Returns file content snippets and metadata.
        """
        relevant = []
        lowered_keywords = [k.lower() for k in keywords if len(k) > 2]

        for root, dirs, files in os.walk(repo_dir):
            dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ("__pycache__", "venv", "node_modules")]
            for file in files:
                if file.endswith(".py") and not file.startswith("test_"):
                    full_path = Path(root, file)
                    rel_path = full_path.relative_to(repo_dir).as_posix()
                    try:
                        content = full_path.read_text(encoding="utf-8", errors="replace")
                    except Exception:
                        continue

                    # Score relevance
                    score = 0
                    matched_terms = []
                    content_lower = content.lower()
                    for kw in lowered_keywords:
                        count = content_lower.count(kw)
                        if count > 0:
                            score += count
                            matched_terms.append(kw)

                    if score > 0 or len(relevant) < 2:
                        relevant.append({
                            "path": rel_path,
                            "score": score,
                            "matched_terms": matched_terms,
                            "content": content[:4000],  # bounded size
                            "line_count": len(content.splitlines()),
                        })

        relevant.sort(key=lambda x: x["score"], reverse=True)
        return relevant[:max_files]
