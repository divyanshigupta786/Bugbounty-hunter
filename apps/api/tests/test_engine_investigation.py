import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy import select
from app.db.session import async_session_maker
from app.db.models import InvestigationModel, InvestigationEventModel, ExecutionAttemptModel
from app.agent.engine import engine


@pytest.mark.asyncio
async def test_full_investigation_workflow_reproduces_bug():
    """Verify end-to-end bug reproduction against sample-buggy-repo fixture."""
    # 1. Create investigation record in DB
    async with async_session_maker() as session:
        inv = InvestigationModel(
            bug_title="parse_chunk_header crashes with struct.error on truncated chunk data",
            description=(
                "When uploading an image with a truncated trailing chunk, parse_chunk_header causes "
                "an unhandled struct.error ('unpack requires a buffer of 8 bytes') instead of raising "
                "ImageValidationError."
            ),
            expected_behavior="Should raise ImageValidationError",
            actual_behavior="Unhandled struct.error: unpack requires a buffer of 8 bytes",
            repository_url="sample-buggy-repo",
            is_demo=True,
            state="CREATED",
        )
        session.add(inv)
        await session.commit()
        await session.refresh(inv)
        inv_id = inv.id

    # 2. Run the investigation engine
    await engine.run(inv_id)

    # 3. Verify final state and honest verdict
    async with async_session_maker() as session:
        completed_inv = await session.get(InvestigationModel, inv_id)
        assert completed_inv.state == "COMPLETED"
        assert completed_inv.verdict == "REPRODUCED"
        assert completed_inv.confidence_score is not None
        assert completed_inv.confidence_score > 0.8
        assert completed_inv.proof_pack_json is not None

        # Verify Proof Pack contents
        pp = completed_inv.proof_pack_json
        assert pp["schemaVersion"] == "1.0.0"
        assert pp["verdict"] == "REPRODUCED"
        assert len(pp["hypotheses"]) >= 1
        assert "struct.error" in pp["verdictExplanation"]
        assert len(pp["reproductionLadderSteps"]) >= 5
        assert len(pp["replayInstructions"]) >= 3

        # Verify execution attempts were recorded
        attempts_stmt = select(ExecutionAttemptModel).where(ExecutionAttemptModel.investigation_id == inv_id)
        attempts = (await session.execute(attempts_stmt)).scalars().all()
        assert len(attempts) >= 1
        last_att = attempts[-1]
        assert last_att.exit_code != 0
        assert "test_reproduce" in last_att.test_source_code
        assert "struct.error" in last_att.stdout or "struct.error" in last_att.stderr

        # Verify events progression
        events_stmt = select(InvestigationEventModel).where(InvestigationEventModel.investigation_id == inv_id)
        events = (await session.execute(events_stmt)).scalars().all()
        event_states = [e.state for e in events]
        assert "VALIDATING" in event_states
        assert "PREPARING" in event_states
        assert "ANALYZING" in event_states
        assert "HYPOTHESIZING" in event_states
        assert "GENERATING_TEST" in event_states
        assert "EXECUTING_TEST" in event_states
        assert "EVALUATING_EVIDENCE" in event_states
        assert "COMPLETED" in event_states


@pytest.mark.asyncio
async def test_investigation_api_endpoints(client: AsyncClient):
    """Test API endpoints for investigation lifecycle: creation, retrieval, report export."""
    payload = {
        "repositoryUrl": "sample-buggy-repo",
        "bugTitle": "calculate_aspect_ratio ZeroDivisionError on height 0",
        "description": "calculate_aspect_ratio does not validate non-zero height and raises ZeroDivisionError.",
        "expectedBehavior": "Raises ValueError('Height must be greater than zero')",
        "actualBehavior": "ZeroDivisionError: division by zero",
        "isDemo": True,
    }

    # Create investigation
    create_res = await client.post("/api/v1/investigations", json=payload)
    assert create_res.status_code == 201
    inv_data = create_res.json()
    inv_id = inv_data["id"]
    assert inv_data["state"] == "CREATED"

    # Wait briefly for background execution to complete
    for _ in range(20):
        await asyncio.sleep(0.5)
        detail_res = await client.get(f"/api/v1/investigations/{inv_id}")
        if detail_res.status_code == 200:
            d = detail_res.json()
            if d["state"] in ("COMPLETED", "FAILED"):
                break

    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["state"] == "COMPLETED"
    assert detail["verdict"] == "REPRODUCED"

    # Test report export in Markdown format
    report_res = await client.get(f"/api/v1/investigations/{inv_id}/report?format=markdown")
    assert report_res.status_code == 200
    assert "Proof Pack" in report_res.text
    assert "REPRODUCED" in report_res.text
