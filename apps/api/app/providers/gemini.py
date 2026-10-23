import os
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


class GeminiProvider(BaseModelProvider):
    """
    Connects to Google Gemini API for fast, high-quality reasoning and test synthesis.
    Defaults to gemini-2.5-flash or gemini-1.5-pro with structured JSON responses.
    Falls back gracefully to the deterministic engine when no API key is set or on network failure.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
    ):
        self.api_key = api_key or getattr(settings, "GEMINI_API_KEY", None) or os.environ.get("GEMINI_API_KEY")
        self.model_name = model_name or getattr(settings, "GEMINI_DEFAULT_MODEL", "gemini-2.5-flash")
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.fallback = DeterministicFixtureProvider()

    async def is_available(self) -> bool:
        """Check if Gemini API key is configured."""
        return bool(self.api_key and len(self.api_key.strip()) > 10)

    async def _call_gemini(self, prompt: str) -> Optional[str]:
        """Make an authenticated call to the Gemini generateContent REST endpoint."""
        if not await self.is_available():
            return None

        endpoint = f"{self.base_url}/{self.model_name}:generateContent?key={self.api_key}"
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.2,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=settings.MODEL_TIMEOUT_SECONDS) as client:
                res = await client.post(endpoint, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
        except Exception:
            pass

        return None

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
            "You are an expert bug reproduction engineer. Analyze the following reported issue and repository code snippet:\n"
            f"Bug Title: {bug_title}\n"
            f"Description: {description}\n"
            f"Expected Behavior: {expected_behavior or 'N/A'}\n"
            f"Actual Behavior: {actual_behavior or 'N/A'}\n\n"
            f"Relevant Code Files:\n{json.dumps(relevant_code[:2], indent=2)}\n\n"
            "Return a JSON array of 1 to 3 concrete reproduction hypotheses. Each object MUST contain:\n"
            "- 'title': brief hypothesis name\n"
            "- 'description': root cause theory\n"
            "- 'target_file': file path to target for testing\n"
            "- 'target_symbol': function, class, or method name causing failure\n"
            "- 'suspected_cause': technical explanation of defect mechanism\n"
            "- 'verification_strategy': how a test can reproduce this reliably\n"
            "- 'confidence_estimate': float between 0.0 and 1.0"
        )

        response_text = await self._call_gemini(prompt)
        if response_text:
            try:
                parsed = json.loads(response_text)
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
            "You are an automated pytest reproduction test synthesizer. Formulate a minimal, self-contained pytest test file "
            "designed to reproduce the reported bug under test.\n"
            f"Hypothesis: {hypothesis.title}\n"
            f"Target file: {hypothesis.target_file}\n"
            f"Target symbol: {hypothesis.target_symbol or 'unknown'}\n"
            f"Suspected cause: {hypothesis.suspected_cause}\n"
            f"Attempt Number: {attempt_number}\n"
            f"Previous error in prior attempt (if any): {previous_error or 'None'}\n\n"
            "Return a JSON object with exactly these keys:\n"
            "- 'test_file_path': e.g. 'tests/test_reproduce_0.py'\n"
            "- 'test_source_code': full runnable python code using `import pytest` and asserting expected failure\n"
            "- 'replay_command': command to execute e.g. 'pytest tests/test_reproduce_0.py -v'\n"
            "- 'expected_failure_description': what failure this test is designed to trigger"
        )

        response_text = await self._call_gemini(prompt)
        if response_text:
            try:
                parsed = json.loads(response_text)
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
        # Grounded forensic evaluation: always evaluate using deterministic verification
        # to ensure zero LLM hallucination in verdict determination
        return await self.fallback.evaluate_verdict(
            test_source,
            test_command,
            exit_code,
            stdout,
            stderr,
            bug_title,
            description,
            actual_behavior,
            baseline_passed,
        )
