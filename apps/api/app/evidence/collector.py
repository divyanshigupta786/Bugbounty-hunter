import io
import zipfile
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.core.config import settings


class ProofPackBuilder:
    """Constructs portable, verifiable Proof Pack bundles (JSON, Markdown, and ZIP archive)."""

    @staticmethod
    def build_proof_pack(
        investigation: Any,
        events: List[Any],
        hypotheses: List[Any],
        attempts: List[Any],
        evaluation_result: Any,
        repo_metadata: Dict[str, Any],
        reproduction_test_file: str,
        reproduction_test_source: str,
        reproduction_test_cmd: str,
    ) -> Dict[str, Any]:
        last_attempt = attempts[-1] if attempts else None

        # Build ladder steps
        ladder_steps = []
        for ev in events:
            if ev.state in ("PREPARING", "ANALYZING", "HYPOTHESIZING", "GENERATING_TEST", "EXECUTING_TEST", "EVALUATING_EVIDENCE"):
                ladder_steps.append({
                    "step": ev.action,
                    "outcome": "Success" if not ev.is_error else "Failed",
                    "evidenceNotes": ev.message,
                })

        captured_assertions = []
        if evaluation_result.matched_assertion:
            captured_assertions.append(evaluation_result.matched_assertion)

        proof_pack = {
            "schemaVersion": "1.0.0",
            "investigationId": investigation.id,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "verdict": evaluation_result.verdict,
            "verdictExplanation": evaluation_result.explanation,
            "repository": {
                "url": investigation.repository_url,
                "commitSha": investigation.commit_sha,
                "branch": investigation.branch or "main",
                "language": repo_metadata.get("language", "python"),
                "testFramework": repo_metadata.get("test_framework", "pytest"),
            },
            "originalReport": {
                "title": investigation.bug_title,
                "description": investigation.description,
                "expected": investigation.expected_behavior or "Graceful error or expected output",
                "actual": investigation.actual_behavior or "Unexpected crash or defect",
                "environment": investigation.environment_details or "Standard Python environment",
            },
            "environment": {
                "runner": last_attempt.environment_info.get("runner", "isolated_process") if last_attempt and last_attempt.environment_info else "isolated_process",
                "pythonVersion": last_attempt.environment_info.get("python_version", "3.x") if last_attempt and last_attempt.environment_info else "3.x",
                "pytestVersion": ">=7.0.0",
                "os": last_attempt.environment_info.get("os", "Linux/Windows") if last_attempt and last_attempt.environment_info else "Unknown",
                "memoryLimitMb": settings.MEMORY_LIMIT_MB,
                "timeoutSeconds": settings.PER_TEST_TIMEOUT_SECONDS,
            },
            "reproductionLadderSteps": ladder_steps,
            "hypotheses": [
                {
                    "id": h.id,
                    "investigationId": h.investigation_id,
                    "orderIndex": h.order_index,
                    "title": h.title,
                    "description": h.description,
                    "targetFile": h.target_file,
                    "targetSymbol": h.target_symbol,
                    "suspectedCause": h.suspected_cause,
                    "verificationStrategy": h.verification_strategy,
                    "confidenceEstimate": h.confidence_estimate,
                    "verifiedState": h.verified_state,
                }
                for h in hypotheses
            ],
            "reproductionTest": {
                "filePath": reproduction_test_file,
                "sourceCode": reproduction_test_source,
                "replayCommand": reproduction_test_cmd,
                "expectedFailureTrace": captured_assertions[0] if captured_assertions else "Expected assertion failure",
            },
            "executionEvidence": {
                "totalAttempts": len(attempts),
                "lastExitCode": last_attempt.exit_code if last_attempt else 0,
                "testOutputSanitized": (last_attempt.stdout + "\n" + last_attempt.stderr).strip() if last_attempt else "",
                "capturedAssertions": captured_assertions,
                "executionDurationMs": last_attempt.duration_ms if last_attempt else 0,
            },
            "replayInstructions": [
                f"1. Clone or navigate to the repository at commit {investigation.commit_sha}",
                "2. Install dependencies: pip install -e . pytest",
                f"3. Create or save the test file at '{reproduction_test_file}'",
                f"4. Run: {reproduction_test_cmd}",
                "5. Observe the reproduced failure matching the evidence log.",
            ],
            "limitations": evaluation_result.limitations or [
                "Reproduced under isolated test runner constraints.",
                "Assumes deterministic runtime environment.",
            ],
        }

        return proof_pack

    @staticmethod
    def generate_markdown_report(proof_pack: Dict[str, Any]) -> str:
        """Converts Proof Pack data to an executive Markdown investigation report."""
        v = proof_pack["verdict"]
        badge = "🟢 REPRODUCED" if v == "REPRODUCED" else ("⚪ NOT REPRODUCED" if v == "NOT_REPRODUCED" else "🟡 INCONCLUSIVE")

        md = [
            f"# Proof Pack: Bug Reproduction Report",
            f"**Investigation ID:** `{proof_pack['investigationId']}`  ",
            f"**Verdict:** **{badge}**  ",
            f"**Generated:** {proof_pack['generatedAt']}  ",
            "",
            "## 1. Executive Summary",
            proof_pack["verdictExplanation"],
            "",
            "## 2. Target Repository",
            f"- **Repository URL:** `{proof_pack['repository']['url']}`",
            f"- **Commit SHA:** `{proof_pack['repository']['commitSha']}`",
            f"- **Language:** {proof_pack['repository']['language']}",
            f"- **Test Framework:** {proof_pack['repository']['testFramework']}",
            "",
            "## 3. Original Bug Report",
            f"**Title:** {proof_pack['originalReport']['title']}",
            "",
            f"**Description:**",
            proof_pack["originalReport"]["description"],
            "",
            f"- **Expected Behavior:** {proof_pack['originalReport']['expected']}",
            f"- **Actual Behavior:** {proof_pack['originalReport']['actual']}",
            "",
            "## 4. Hypotheses Evaluated",
        ]

        for h in proof_pack["hypotheses"]:
            state_icon = "✅" if h.get("verifiedState") == "CONFIRMED" else "🔍"
            md.append(f"### {state_icon} {h['title']}")
            md.append(f"- **Target:** `{h['targetFile']}` (Symbol: `{h.get('targetSymbol') or 'N/A'}`)")
            md.append(f"- **Cause:** {h['suspectedCause']}")
            md.append(f"- **Confidence Estimate:** {int(h['confidenceEstimate'] * 100)}%")
            md.append("")

        md.extend([
            "## 5. Candidate Reproduction Test",
            f"File: `{proof_pack['reproductionTest']['filePath']}`",
            "```python",
            proof_pack["reproductionTest"]["sourceCode"],
            "```",
            "",
            "## 6. Execution Evidence",
            f"- **Exit Code:** `{proof_pack['executionEvidence']['lastExitCode']}`",
            f"- **Execution Duration:** {proof_pack['executionEvidence']['executionDurationMs']}ms",
            "",
            "```text",
            proof_pack["executionEvidence"]["testOutputSanitized"][:2000],
            "```",
            "",
            "## 7. Replay Instructions",
        ])

        for instruction in proof_pack["replayInstructions"]:
            md.append(instruction)

        md.extend([
            "",
            "## 8. Limitations & Scope",
        ])
        for lim in proof_pack["limitations"]:
            md.append(f"- {lim}")

        md.append("\n---\n*Report generated by BugBounty Hunter - Autonomous AI Bug Reproduction Platform*")
        return "\n".join(md)

    @staticmethod
    def create_zip_archive(
        proof_pack: Dict[str, Any],
        markdown_report: str,
        test_source: str,
    ) -> bytes:
        """Packages the Proof Pack, test candidate, and logs into a downloadable ZIP."""
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("proof_pack.json", str(proof_pack))
            z.writestr("REPORT.md", markdown_report)
            z.writestr("test_reproduction.py", test_source)
            z.writestr("execution.log", proof_pack["executionEvidence"]["testOutputSanitized"])
            z.writestr("replay.sh", f"#!/bin/bash\n{proof_pack['reproductionTest']['replayCommand']}\n")
        return buf.getvalue()
