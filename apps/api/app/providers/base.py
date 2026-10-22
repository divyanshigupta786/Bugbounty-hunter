from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class HypothesisResult(BaseModel):
    title: str
    description: str
    target_file: str
    target_symbol: Optional[str] = None
    suspected_cause: str
    verification_strategy: str
    confidence_estimate: float = Field(default=0.7, ge=0.0, le=1.0)


class TestCandidateResult(BaseModel):
    test_file_path: str
    test_source_code: str
    replay_command: str
    expected_failure_description: str


class EvaluationResult(BaseModel):
    verdict: str  # 'REPRODUCED', 'NOT_REPRODUCED', 'INCONCLUSIVE'
    explanation: str
    confidence_score: float
    matched_assertion: Optional[str] = None
    limitations: List[str] = Field(default_factory=list)


class BaseModelProvider(ABC):
    """Abstract interface for AI Model Providers (Ollama, OpenAI, Deterministic)."""

    @abstractmethod
    async def generate_hypotheses(
        self,
        bug_title: str,
        description: str,
        expected_behavior: Optional[str],
        actual_behavior: Optional[str],
        relevant_code: List[Dict[str, Any]],
        existing_test_files: List[str],
    ) -> List[HypothesisResult]:
        """Generate 1-3 testable hypotheses for the bug."""
        pass

    @abstractmethod
    async def generate_test_candidate(
        self,
        hypothesis: HypothesisResult,
        relevant_code: List[Dict[str, Any]],
        existing_test_files: List[str],
        attempt_number: int,
        previous_error: Optional[str] = None,
    ) -> TestCandidateResult:
        """Generate a pytest reproduction test candidate."""
        pass

    @abstractmethod
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
        """Evaluate actual execution evidence and return honest verdict."""
        pass
