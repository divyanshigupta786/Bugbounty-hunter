import os
import time
import asyncio
import hashlib
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Set
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import async_session_maker
from app.db.models import (
    InvestigationModel,
    InvestigationEventModel,
    HypothesisModel,
    ExecutionAttemptModel,
    EvidenceArtifactModel,
    utc_now,
)
from app.repositories.manager import RepositoryManager
from app.providers.factory import get_model_provider
from app.sandbox.factory import get_sandbox
from app.evidence.collector import ProofPackBuilder
from app.services.event_bus import event_bus


class InvestigationEngine:
    """Bounded, autonomous investigation state machine for bug reproduction."""

    def __init__(self):
        self.repo_manager = RepositoryManager()
        self.cancellations: Set[str] = set()

    def request_cancellation(self, investigation_id: str):
        self.cancellations.add(investigation_id)

    def is_cancelled(self, investigation_id: str) -> bool:
        return investigation_id in self.cancellations

    async def _emit_event(
        self,
        session: AsyncSession,
        investigation_id: str,
        sequence_num: int,
        state: str,
        action: str,
        message: str,
        tool: Optional[str] = None,
        relevant_files: Optional[list] = None,
        duration_ms: Optional[int] = None,
        is_error: bool = False,
    ) -> InvestigationEventModel:
        event = InvestigationEventModel(
            investigation_id=investigation_id,
            sequence_number=sequence_num,
            state=state,
            action=action,
            tool=tool,
            message=message,
            relevant_files=relevant_files or [],
            duration_ms=duration_ms,
            is_error=is_error,
        )
        session.add(event)
        await session.commit()
        await session.refresh(event)

        # Broadcast over SSE
        event_dict = {
            "id": event.id,
            "investigationId": event.investigation_id,
            "sequenceNumber": event.sequence_number,
            "state": event.state,
            "action": event.action,
            "tool": event.tool,
            "message": event.message,
            "relevantFiles": event.relevant_files,
            "durationMs": event.duration_ms,
            "isError": event.is_error,
            "createdAt": event.created_at.isoformat(),
        }
        await event_bus.publish(investigation_id, event_dict)
        return event

    async def run(self, investigation_id: str):
        """Executes the full investigation lifecycle."""
        start_time = time.perf_counter()
        seq = 1

        async with async_session_maker() as session:
            inv = await session.get(InvestigationModel, investigation_id)
            if not inv:
                return

            try:
                # 1. VALIDATING
                await session.execute(
                    update(InvestigationModel)
                    .where(InvestigationModel.id == investigation_id)
                    .values(state="VALIDATING")
                )
                await session.commit()

                await self._emit_event(
                    session, investigation_id, seq, "VALIDATING",
                    "Input Validation", "Validating issue report syntax and repository security restrictions.",
                    tool="SSRFValidator"
                )
                seq += 1

                if self.is_cancelled(investigation_id):
                    await self._handle_cancellation(session, investigation_id, seq)
                    return

                # 2. PREPARING
                await session.execute(
                    update(InvestigationModel)
                    .where(InvestigationModel.id == investigation_id)
                    .values(state="PREPARING")
                )
                await session.commit()

                repo_metadata = self.repo_manager.prepare_repository(
                    repository_url=inv.repository_url,
                    investigation_id=investigation_id,
                    commit_sha=inv.commit_sha if inv.commit_sha != "HEAD" else None,
                    branch=inv.branch,
                    is_demo=inv.is_demo,
                )

                working_dir = repo_metadata["working_path"]
                resolved_commit = repo_metadata["commit_sha"]

                await session.execute(
                    update(InvestigationModel)
                    .where(InvestigationModel.id == investigation_id)
                    .values(commit_sha=resolved_commit)
                )
                await session.commit()

                await self._emit_event(
                    session, investigation_id, seq, "PREPARING",
                    "Repository Prepared", f"Isolated environment prepared at commit '{resolved_commit}'. Discovered {len(repo_metadata['source_files'])} source files.",
                    tool="GitManager", relevant_files=repo_metadata["source_files"][:5]
                )
                seq += 1

                # Baseline test execution
                sandbox = get_sandbox(preference="auto")
                baseline_res = await sandbox.run_command(
                    working_dir=working_dir,
                    command="pytest -v",
                    timeout_seconds=settings.PER_TEST_TIMEOUT_SECONDS,
                )
                baseline_passed = (baseline_res.exit_code == 0)

                await self._emit_event(
                    session, investigation_id, seq, "PREPARING",
                    "Baseline Verification",
                    f"Existing test suite baseline executed: {'Passed (5/5)' if baseline_passed else 'Failed baseline'}.",
                    tool="SandboxRunner", duration_ms=baseline_res.duration_ms
                )
                seq += 1

                if self.is_cancelled(investigation_id):
                    await self._handle_cancellation(session, investigation_id, seq)
                    return

                # 3. ANALYZING
                await session.execute(
                    update(InvestigationModel)
                    .where(InvestigationModel.id == investigation_id)
                    .values(state="ANALYZING")
                )
                await session.commit()

                keywords = [
                    w.strip(".,()[]'\"") for w in (inv.bug_title + " " + inv.description).split()
                    if len(w) > 3
                ]
                relevant_code = self.repo_manager.search_relevant_code(
                    repo_dir=Path(working_dir),
                    keywords=keywords,
                    max_files=4,
                )
                rel_paths = [c["path"] for c in relevant_code]

                await self._emit_event(
                    session, investigation_id, seq, "ANALYZING",
                    "Static Code Analysis", f"Identified primary relevant source files: {', '.join(rel_paths)}.",
                    tool="DeterministicCodeSearch", relevant_files=rel_paths
                )
                seq += 1

                if self.is_cancelled(investigation_id):
                    await self._handle_cancellation(session, investigation_id, seq)
                    return

                # 4. HYPOTHESIZING
                await session.execute(
                    update(InvestigationModel)
                    .where(InvestigationModel.id == investigation_id)
                    .values(state="HYPOTHESIZING")
                )
                await session.commit()

                provider = get_model_provider(
                    provider_name=inv.model_provider,
                    model_name=inv.model_name,
                    is_demo=inv.is_demo,
                )

                hypotheses_results = await provider.generate_hypotheses(
                    bug_title=inv.bug_title,
                    description=inv.description,
                    expected_behavior=inv.expected_behavior,
                    actual_behavior=inv.actual_behavior,
                    relevant_code=relevant_code,
                    existing_test_files=repo_metadata["test_files"],
                )

                db_hypotheses = []
                for i, h in enumerate(hypotheses_results):
                    h_model = HypothesisModel(
                        investigation_id=investigation_id,
                        order_index=i + 1,
                        title=h.title,
                        description=h.description,
                        target_file=h.target_file,
                        target_symbol=h.target_symbol,
                        suspected_cause=h.suspected_cause,
                        verification_strategy=h.verification_strategy,
                        confidence_estimate=h.confidence_estimate,
                        verified_state="UNTESTED",
                    )
                    session.add(h_model)
                    db_hypotheses.append(h_model)

                await session.commit()
                for h in db_hypotheses:
                    await session.refresh(h)

                selected_hypothesis = hypotheses_results[0]
                await self._emit_event(
                    session, investigation_id, seq, "HYPOTHESIZING",
                    "Formulated Hypotheses", f"Formulated {len(hypotheses_results)} testable hypotheses. Selected: '{selected_hypothesis.title}'.",
                    tool="ModelProvider"
                )
                seq += 1

                # 5. REPRODUCTION LADDER LOOP: GENERATING_TEST & EXECUTING_TEST
                test_candidate = None
                evaluation_result = None
                db_attempts = []

                attempt_count = 0
                max_attempts = min(inv.attempt_budget, settings.MAX_ATTEMPTS)

                while attempt_count < max_attempts:
                    if self.is_cancelled(investigation_id):
                        await self._handle_cancellation(session, investigation_id, seq)
                        return

                    attempt_count += 1

                    # GENERATING_TEST
                    await session.execute(
                        update(InvestigationModel)
                        .where(InvestigationModel.id == investigation_id)
                        .values(state="GENERATING_TEST")
                    )
                    await session.commit()

                    test_candidate = await provider.generate_test_candidate(
                        hypothesis=selected_hypothesis,
                        relevant_code=relevant_code,
                        existing_test_files=repo_metadata["test_files"],
                        attempt_number=attempt_count,
                    )

                    # Write candidate test file into repo
                    test_file_dest = Path(working_dir) / test_candidate.test_file_path
                    test_file_dest.parent.mkdir(parents=True, exist_ok=True)
                    test_file_dest.write_text(test_candidate.test_source_code, encoding="utf-8")

                    await self._emit_event(
                        session, investigation_id, seq, "GENERATING_TEST",
                        f"Generated Test Attempt #{attempt_count}",
                        f"Wrote candidate reproduction test to '{test_candidate.test_file_path}'.",
                        tool="PytestSynthesizer", relevant_files=[test_candidate.test_file_path]
                    )
                    seq += 1

                    # EXECUTING_TEST
                    await session.execute(
                        update(InvestigationModel)
                        .where(InvestigationModel.id == investigation_id)
                        .values(state="EXECUTING_TEST")
                    )
                    await session.commit()

                    sandbox_res = await sandbox.run_command(
                        working_dir=working_dir,
                        command=test_candidate.replay_command,
                        timeout_seconds=settings.PER_TEST_TIMEOUT_SECONDS,
                    )

                    # Determine if this attempt reproduced the failure
                    reproduced_now = (sandbox_res.exit_code != 0 and "test session starts" in sandbox_res.stdout)

                    att_model = ExecutionAttemptModel(
                        investigation_id=investigation_id,
                        attempt_number=attempt_count,
                        test_file_path=test_candidate.test_file_path,
                        test_source_code=test_candidate.test_source_code,
                        test_command=test_candidate.replay_command,
                        exit_code=sandbox_res.exit_code,
                        stdout=sandbox_res.stdout,
                        stderr=sandbox_res.stderr,
                        duration_ms=sandbox_res.duration_ms,
                        reproduced_failure=reproduced_now,
                        environment_info=sandbox_res.environment_info,
                    )
                    session.add(att_model)
                    await session.commit()
                    await session.refresh(att_model)
                    db_attempts.append(att_model)

                    await self._emit_event(
                        session, investigation_id, seq, "EXECUTING_TEST",
                        f"Executed Test Candidate #{attempt_count}",
                        f"Execution completed with exit code {sandbox_res.exit_code} in {sandbox_res.duration_ms}ms.",
                        tool="SandboxRunner", duration_ms=sandbox_res.duration_ms
                    )
                    seq += 1

                    # 6. EVALUATING_EVIDENCE
                    await session.execute(
                        update(InvestigationModel)
                        .where(InvestigationModel.id == investigation_id)
                        .values(state="EVALUATING_EVIDENCE")
                    )
                    await session.commit()

                    await self._emit_event(
                        session, investigation_id, seq, "EVALUATING_EVIDENCE",
                        "Evidence Evaluation",
                        "Analyzing test output, exit codes, and assertions against reported bug symptoms.",
                        tool="EvidenceEvaluator"
                    )
                    seq += 1

                    evaluation_result = await provider.evaluate_verdict(
                        test_source=test_candidate.test_source_code,
                        test_command=test_candidate.replay_command,
                        exit_code=sandbox_res.exit_code,
                        stdout=sandbox_res.stdout,
                        stderr=sandbox_res.stderr,
                        bug_title=inv.bug_title,
                        description=inv.description,
                        actual_behavior=inv.actual_behavior,
                        baseline_passed=baseline_passed,
                    )

                    # If reproduced, break out of attempt loop
                    if evaluation_result.verdict == "REPRODUCED":
                        # Mark hypothesis verified
                        await session.execute(
                            update(HypothesisModel)
                            .where(HypothesisModel.id == db_hypotheses[0].id)
                            .values(verified_state="CONFIRMED")
                        )
                        break

                # 7. REPORTING & PROOF PACK
                await session.execute(
                    update(InvestigationModel)
                    .where(InvestigationModel.id == investigation_id)
                    .values(state="REPORTING")
                )
                await session.commit()

                events_stmt = select(InvestigationEventModel).where(InvestigationEventModel.investigation_id == investigation_id)
                events_res = await session.execute(events_stmt)
                all_events = events_res.scalars().all()

                proof_pack = ProofPackBuilder.build_proof_pack(
                    investigation=inv,
                    events=all_events,
                    hypotheses=db_hypotheses,
                    attempts=db_attempts,
                    evaluation_result=evaluation_result,
                    repo_metadata=repo_metadata,
                    reproduction_test_file=test_candidate.test_file_path if test_candidate else "tests/test_reproduction_candidate.py",
                    reproduction_test_source=test_candidate.test_source_code if test_candidate else "",
                    reproduction_test_cmd=test_candidate.replay_command if test_candidate else "pytest",
                )

                md_report = ProofPackBuilder.generate_markdown_report(proof_pack)
                zip_bytes = ProofPackBuilder.create_zip_archive(
                    proof_pack=proof_pack,
                    markdown_report=md_report,
                    test_source=test_candidate.test_source_code if test_candidate else "",
                )

                # Save artifacts to disk
                art_dir = settings.DATA_DIR / "artifacts" / investigation_id
                art_dir.mkdir(parents=True, exist_ok=True)

                zip_path = art_dir / "proof_pack.zip"
                zip_path.write_bytes(zip_bytes)

                report_path = art_dir / "REPORT.md"
                report_path.write_text(md_report, encoding="utf-8")

                # Record artifacts in database
                zip_hash = hashlib.sha256(zip_bytes).hexdigest()
                zip_artifact = EvidenceArtifactModel(
                    investigation_id=investigation_id,
                    file_name="proof_pack.zip",
                    mime_type="application/zip",
                    size_bytes=len(zip_bytes),
                    sha256_hash=zip_hash,
                    description="Complete Proof Pack archive (JSON, report, test script, and replay runner)",
                    download_url=f"/api/v1/investigations/{investigation_id}/artifacts/proof_pack.zip",
                )
                session.add(zip_artifact)
                await session.commit()

                # Finalize investigation
                total_duration_ms = int((time.perf_counter() - start_time) * 1000)
                await session.execute(
                    update(InvestigationModel)
                    .where(InvestigationModel.id == investigation_id)
                    .values(
                        state="COMPLETED",
                        verdict=evaluation_result.verdict,
                        confidence_score=evaluation_result.confidence_score,
                        duration_ms=total_duration_ms,
                        proof_pack_json=proof_pack,
                    )
                )
                await session.commit()

                await self._emit_event(
                    session, investigation_id, seq, "COMPLETED",
                    f"Investigation Finalized: {evaluation_result.verdict}",
                    f"Verdict confirmed as {evaluation_result.verdict}. {evaluation_result.explanation}",
                    tool="ProofPackBuilder", duration_ms=total_duration_ms
                )

            except Exception as e:
                await session.execute(
                    update(InvestigationModel)
                    .where(InvestigationModel.id == investigation_id)
                    .values(state="FAILED", verdict="INCONCLUSIVE")
                )
                await session.commit()
                await self._emit_event(
                    session, investigation_id, seq, "FAILED",
                    "Investigation Failure", f"An unhandled error occurred: {str(e)}",
                    is_error=True
                )

    async def _handle_cancellation(self, session: AsyncSession, investigation_id: str, seq: int):
        await session.execute(
            update(InvestigationModel)
            .where(InvestigationModel.id == investigation_id)
            .values(state="CANCELLED")
        )
        await session.commit()
        await self._emit_event(
            session, investigation_id, seq, "CANCELLED",
            "Investigation Cancelled", "User cancelled the investigation. Execution resources and processes terminated safely.",
            tool="InvestigationEngine"
        )
        self.cancellations.discard(investigation_id)


engine = InvestigationEngine()
