import json
import httpx
from typing import List, Dict, Any, Optional
from app.providers.base import (
    BaseModelProvider,
    HypothesisResult,
    TestCandidateResult,
    EvaluationResult,
)
from app.providers.deterministic import DeterministicFixtureProvider
from app.core.config import settings


class OllamaProvider(BaseModelProvider):
    """
    Connects to local Ollama inference server for open-weight models (e.g. Qwen2.5-Coder, DeepSeek-Coder, Llama 3).
    Includes structured JSON prompting and fallback to deterministic engine on connection refusal.
    """

    def __init__(self, base_url: Optional[str] = None, model_name: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model_name = model_name or settings.DEFAULT_MODEL_NAME
        self.fallback = DeterministicFixtureProvider()

    async def is_available(self) -> bool:
        """Check if Ollama server is responsive."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                return res.status_code == 200
        except Exception:
            return False

    async def generate_hypotheses(
        self,
        bug_title: str,
        description: str,
        expected_behavior: Optional[str],
        actual_behavior: Optional[str],
        relevant_code: List[Dict[str, Any]],
        existing_test_files: List[str],
    ) -> List[HypothesisResult]:
        if not await self.is_available():
            return await self.fallback.generate_hypotheses(
                bug_title, description, expected_behavior, actual_behavior, relevant_code, existing_test_files
            )

        prompt = (
            f"You are an expert bug investigator. Analyze this bug report and relevant code:\n"
            f"Title: {bug_title}\n"
            f"Description: {description}\n"
            f"Expected: {expected_behavior}\n"
            f"Actual: {actual_behavior}\n\n"
            f"Relevant code:\n{json.dumps(relevant_code[:2], indent=2)}\n\n"
            f"Return a JSON array of 1-3 hypotheses. Each object must have keys: "
            f"'title', 'description', 'target_file', 'target_symbol', 'suspected_cause', 'verification_strategy', 'confidence_estimate' (0.0 to 1.0)."
        )

        try:
            async with httpx.AsyncClient(timeout=settings.MODEL_TIMEOUT_SECONDS) as client:
                res = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model_name,
                        "prompt": prompt,
                        "format": "json",
                        "stream": False,
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    parsed = json.loads(data.get("response", "[]"))
                    if isinstance(parsed, dict) and "hypotheses" in parsed:
                        parsed = parsed["hypotheses"]
                    if isinstance(parsed, list) and len(parsed) > 0:
                        return [HypothesisResult(**item) for item in parsed]
        except Exception:
            pass

        return await self.fallback.generate_hypotheses(
            bug_title, description, expected_behavior, actual_behavior, relevant_code, existing_test_files
        )

    async def generate_test_candidate(
        self,
        hypothesis: HypothesisResult,
        relevant_code: List[Dict[str, Any]],
        existing_test_files: List[str],
        attempt_number: int,
        previous_error: Optional[str] = None,
    ) -> TestCandidateResult:
        if not await self.is_available():
            return await self.fallback.generate_test_candidate(
                hypothesis, relevant_code, existing_test_files, attempt_number, previous_error
            )

        prompt = (
            f"You are an automated bug reproducer. Formulate a minimal pytest test to reproduce this hypothesis:\n"
            f"Hypothesis: {hypothesis.title}\n"
            f"Target file: {hypothesis.target_file}\n"
            f"Target symbol: {hypothesis.target_symbol}\n"
            f"Suspected cause: {hypothesis.suspected_cause}\n"
            f"Attempt: {attempt_number}\n"
            f"Previous error (if any): {previous_error or 'None'}\n\n"
            f"Return a JSON object with: 'test_file_path', 'test_source_code', 'replay_command', 'expected_failure_description'."
        )

        try:
            async with httpx.AsyncClient(timeout=settings.MODEL_TIMEOUT_SECONDS) as client:
                res = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model_name,
                        "prompt": prompt,
                        "format": "json",
                        "stream": False,
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    parsed = json.loads(data.get("response", "{}"))
                    if "test_source_code" in parsed and "pytest" in parsed["test_source_code"]:
                        return TestCandidateResult(**parsed)
        except Exception:
            pass

        return await self.fallback.generate_test_candidate(
            hypothesis, relevant_code, existing_test_files, attempt_number, previous_error
        )

    async def evaluate_verdict(
        self,
        test_source: str,
        test_command: str,
        exit_code: int,
        stdout: str,
        stderr: str,
        bug_title: str,
        description: str,
        actual_behavior: Optional[str],
        baseline_passed: bool,
    ) -> EvaluationResult:
        # Deterministic evaluation check is primary to prevent hallucination
        return await self.fallback.evaluate_verdict(
            test_source, test_command, exit_code, stdout, stderr, bug_title, description, actual_behavior, baseline_passed
        )
