import re
from typing import List, Dict, Any, Optional
from app.providers.base import (
    BaseModelProvider,
    HypothesisResult,
    TestCandidateResult,
    EvaluationResult,
)


class DeterministicFixtureProvider(BaseModelProvider):
    """
    Deterministic rule-based provider for offline mode, zero-dependency environments, and CI.
    Generates testable hypotheses and targeted pytest candidates by inspecting AST / tokens.
    """

    async def generate_hypotheses(
        self,
        bug_title: str,
        description: str,
        expected_behavior: Optional[str],
        actual_behavior: Optional[str],
        relevant_code: List[Dict[str, Any]],
        existing_test_files: List[str],
    ) -> List[HypothesisResult]:
        hypotheses = []
        combined_text = f"{bug_title} {description} {actual_behavior or ''}".lower()

        # Identify target files from relevant_code
        primary_file = relevant_code[0]["path"] if relevant_code else "pixelflow/validator.py"

        if "parse_chunk_header" in combined_text or "struct.error" in combined_text or "truncated" in combined_text or "short" in combined_text:
            hypotheses.append(
                HypothesisResult(
                    title="Buffer Underrun in parse_chunk_header",
                    description=(
                        "parse_chunk_header attempts to unpack 8 bytes without validating that "
                        "len(data) >= 8, raising raw struct.error when truncated input is provided."
                    ),
                    target_file=primary_file,
                    target_symbol="parse_chunk_header",
                    suspected_cause="Missing minimum length guard (len(data) < 8) before struct.unpack.",
                    verification_strategy="Invoke parse_chunk_header with byte buffers shorter than 8 bytes and assert ImageValidationError.",
                    confidence_estimate=0.92,
                )
            )
            hypotheses.append(
                HypothesisResult(
                    title="Type Discrepancy in Error Handling",
                    description="The function may not catch struct.error and wrap it into the project's ImageValidationError.",
                    target_file=primary_file,
                    target_symbol="parse_chunk_header",
                    suspected_cause="Uncaught struct.error escapes the validator boundary.",
                    verification_strategy="Check exception hierarchy when unpack fails.",
                    confidence_estimate=0.78,
                )
            )
        elif "aspect_ratio" in combined_text or "zerodivision" in combined_text or "height" in combined_text:
            hypotheses.append(
                HypothesisResult(
                    title="ZeroDivision in calculate_aspect_ratio",
                    description="calculate_aspect_ratio does not check if height == 0 or negative before division.",
                    target_file=primary_file,
                    target_symbol="calculate_aspect_ratio",
                    suspected_cause="Missing non-zero validation for height parameter.",
                    verification_strategy="Invoke calculate_aspect_ratio(1920, 0) and assert graceful ValueError.",
                    confidence_estimate=0.88,
                )
            )
        else:
            # General fallback hypothesis
            hypotheses.append(
                HypothesisResult(
                    title="Input Validation Failure on Edge Inputs",
                    description=f"Potential edge case validation defect in {primary_file}.",
                    target_file=primary_file,
                    target_symbol=None,
                    suspected_cause="Edge case inputs trigger unhandled exceptions.",
                    verification_strategy="Execute parameterized input permutations against exported functions.",
                    confidence_estimate=0.65,
                )
            )

        return hypotheses

    async def generate_test_candidate(
        self,
        hypothesis: HypothesisResult,
        relevant_code: List[Dict[str, Any]],
        existing_test_files: List[str],
        attempt_number: int,
        previous_error: Optional[str] = None,
    ) -> TestCandidateResult:
        test_path = "tests/test_reproduction_candidate.py"

        if hypothesis.target_symbol == "parse_chunk_header":
            test_code = (
                "import pytest\n"
                "from pixelflow import parse_chunk_header, ImageValidationError\n\n"
                "def test_reproduce_truncated_chunk_header_crash():\n"
                "    \"\"\"\n"
                "    Reproduction test for Issue #42: parse_chunk_header crash on truncated buffer.\n"
                "    Expected behavior: ImageValidationError is raised on invalid/short buffer.\n"
                "    Bug behavior: Crashes with struct.error or fails to validate.\n"
                "    \"\"\"\n"
                "    truncated_payload = b\"SHORT\"\n"
                "    # If the bug exists, this raises struct.error rather than ImageValidationError,\n"
                "    # causing this assertion to fail with struct.error!\n"
                "    with pytest.raises(ImageValidationError):\n"
                "        parse_chunk_header(truncated_payload)\n"
            )
            desc = "Test asserting parse_chunk_header gracefully raises ImageValidationError on truncated 5-byte buffer."
        elif hypothesis.target_symbol == "calculate_aspect_ratio":
            test_code = (
                "import pytest\n"
                "from pixelflow import calculate_aspect_ratio\n\n"
                "def test_reproduce_zero_height_aspect_ratio():\n"
                "    \"\"\"\n"
                "    Reproduction test: calculate_aspect_ratio with zero height.\n"
                "    Expected behavior: Raises ValueError.\n"
                "    Bug behavior: ZeroDivisionError.\n"
                "    \"\"\"\n"
                "    with pytest.raises(ValueError):\n"
                "        calculate_aspect_ratio(100, 0)\n"
            )
            desc = "Test asserting calculate_aspect_ratio raises ValueError on zero height."
        else:
            test_code = (
                "import pytest\n"
                "from pixelflow import validate_header, ImageValidationError\n\n"
                "def test_reproduce_generic_edge_case():\n"
                "    with pytest.raises(ImageValidationError):\n"
                "        validate_header(b\"x\")\n"
            )
            desc = "Generic validation edge case test."

        return TestCandidateResult(
            test_file_path=test_path,
            test_source_code=test_code,
            replay_command=f"pytest {test_path} -v",
            expected_failure_description=desc,
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
        output = f"{stdout}\n{stderr}"

        # Setup or baseline error check
        if not baseline_passed:
            return EvaluationResult(
                verdict="INCONCLUSIVE",
                explanation="The repository's baseline test suite was already failing before the reproduction test was executed.",
                confidence_score=0.2,
                limitations=["Baseline environment invalid"],
            )

        # Check for syntax error or test runner error
        if ("SyntaxError" in output or "ImportError" in output) and "pixelflow" not in output:
            return EvaluationResult(
                verdict="INCONCLUSIVE",
                explanation="The generated reproduction test encountered an environmental or syntax error.",
                confidence_score=0.3,
                limitations=["Candidate test syntax or collection failure"],
            )

        # Check for crash timeout
        if exit_code == -9 or "timed out" in output.lower():
            return EvaluationResult(
                verdict="INCONCLUSIVE",
                explanation="Test execution timed out before completing.",
                confidence_score=0.3,
                limitations=["Execution time budget exhausted"],
            )

        # Honest Verdict: check for failure matching reported bug
        # If pytest failed with struct.error or failed pytest.raises(ImageValidationError)
        if exit_code != 0:
            if "struct.error" in output:
                return EvaluationResult(
                    verdict="REPRODUCED",
                    explanation=(
                        "Execution confirmed the reported bug: parse_chunk_header failed with an unhandled "
                        "struct.error ('unpack requires a buffer of 8 bytes') instead of raising the expected ImageValidationError."
                    ),
                    confidence_score=0.96,
                    matched_assertion="struct.error: unpack requires a buffer of 8 bytes",
                    limitations=["Tested under Python 3.x pytest isolated environment"],
                )
            elif "ZeroDivisionError" in output:
                return EvaluationResult(
                    verdict="REPRODUCED",
                    explanation="Execution confirmed the reported bug: calculate_aspect_ratio raised ZeroDivisionError.",
                    confidence_score=0.95,
                    matched_assertion="ZeroDivisionError: division by zero",
                    limitations=["Tested under Python 3.x pytest isolated environment"],
                )
            else:
                # Test failed with another assertion
                first_failure = re.search(r"FAILED\s+([^\n]+)", output)
                failure_str = first_failure.group(1) if first_failure else "Assertion failure observed"
                return EvaluationResult(
                    verdict="REPRODUCED",
                    explanation=f"Reproduction test failed as expected, demonstrating anomalous behavior: {failure_str}.",
                    confidence_score=0.88,
                    matched_assertion=failure_str,
                    limitations=["Verified through automated test execution output"],
                )

        # Exit code was 0: test passed without reproducing the failure
        return EvaluationResult(
            verdict="NOT_REPRODUCED",
            explanation="The generated test executed and passed without observing the reported failure under tested conditions.",
            confidence_score=0.85,
            limitations=["The bug may depend on specific platform or unstated environment conditions."],
        )
