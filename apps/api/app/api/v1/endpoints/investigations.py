import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse, FileResponse, Response
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.db.models import (
    InvestigationModel,
    InvestigationEventModel,
    HypothesisModel,
    ExecutionAttemptModel,
    EvidenceArtifactModel,
)
from app.schemas.investigation import (
    InvestigationCreateRequest,
    InvestigationSummarySchema,
    InvestigationDetailSchema,
    ProofPackSchema,
)
from app.agent.engine import engine
from app.services.event_bus import event_bus
from app.evidence.collector import ProofPackBuilder
from app.core.config import settings

router = APIRouter()


@router.post("", response_model=InvestigationSummarySchema, status_code=status.HTTP_201_CREATED)
async def create_investigation(
    req: InvestigationCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create and start a new investigation."""
    inv = InvestigationModel(
        bug_title=req.bug_title,
        description=req.description,
        expected_behavior=req.expected_behavior,
        actual_behavior=req.actual_behavior,
        reproduction_steps=req.reproduction_steps,
        environment_details=req.environment_details,
        repository_url=req.repository_url,
        commit_sha=req.commit_sha or "HEAD",
        branch=req.branch,
        attempt_budget=req.attempt_budget,
        time_budget_seconds=req.time_budget_seconds,
        model_provider=req.model_provider or "ollama",
        model_name=req.model_name,
        is_demo=req.is_demo,
        state="CREATED",
    )
    db.add(inv)
    await db.commit()
    await db.refresh(inv)

    # Spawn background task for investigation engine
    asyncio.create_task(engine.run(inv.id))

    return inv


@router.get("", response_model=List[InvestigationSummarySchema])
async def list_investigations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    state: Optional[str] = None,
    verdict: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all investigations with filtering and search."""
    stmt = select(InvestigationModel).order_by(desc(InvestigationModel.created_at)).offset(skip).limit(limit)
    if state:
        stmt = stmt.where(InvestigationModel.state == state)
    if verdict:
        stmt = stmt.where(InvestigationModel.verdict == verdict)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(InvestigationModel.bug_title.ilike(pattern) | InvestigationModel.repository_url.ilike(pattern))

    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/{investigation_id}", response_model=InvestigationDetailSchema)
async def get_investigation(
    investigation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get full details of an investigation including events, hypotheses, attempts, and artifacts."""
    stmt = (
        select(InvestigationModel)
        .where(InvestigationModel.id == investigation_id)
        .options(
            selectinload(InvestigationModel.events),
            selectinload(InvestigationModel.hypotheses),
            selectinload(InvestigationModel.attempts),
            selectinload(InvestigationModel.artifacts),
        )
    )
    res = await db.execute(stmt)
    inv = res.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    detail = InvestigationDetailSchema.model_validate(inv)
    if inv.proof_pack_json:
        detail.proof_pack = ProofPackSchema.model_validate(inv.proof_pack_json)
    return detail


@router.get("/{investigation_id}/events")
async def stream_investigation_events(investigation_id: str):
    """Stream real-time Server-Sent Events (SSE) for timeline activity."""
    queue = await event_bus.subscribe(investigation_id)

    async def event_generator():
        try:
            # Yield initial connection heartbeat
            yield "data: {\"type\": \"connected\"}\n\n"
            while True:
                msg = await queue.get()
                yield msg
        except asyncio.CancelledError:
            pass
        finally:
            await event_bus.unsubscribe(investigation_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/{investigation_id}/cancel")
async def cancel_investigation(
    investigation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Cancel an ongoing investigation and safely terminate child sandbox processes."""
    inv = await db.get(InvestigationModel, investigation_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    if inv.state in ("COMPLETED", "FAILED", "CANCELLED"):
        return {"status": "already_finished", "state": inv.state}

    engine.request_cancellation(investigation_id)
    return {"status": "cancellation_requested", "id": investigation_id}


@router.post("/{investigation_id}/retry", response_model=InvestigationSummarySchema)
async def retry_investigation(
    investigation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retry an investigation from scratch while preserving prior history."""
    inv = await db.get(InvestigationModel, investigation_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # Create new retry investigation record
    retry_inv = InvestigationModel(
        bug_title=f"{inv.bug_title} (Retry)",
        description=inv.description,
        expected_behavior=inv.expected_behavior,
        actual_behavior=inv.actual_behavior,
        reproduction_steps=inv.reproduction_steps,
        environment_details=inv.environment_details,
        repository_url=inv.repository_url,
        commit_sha=inv.commit_sha,
        branch=inv.branch,
        attempt_budget=inv.attempt_budget,
        time_budget_seconds=inv.time_budget_seconds,
        model_provider=inv.model_provider,
        model_name=inv.model_name,
        is_demo=inv.is_demo,
        state="CREATED",
    )
    db.add(retry_inv)
    await db.commit()
    await db.refresh(retry_inv)

    asyncio.create_task(engine.run(retry_inv.id))
    return retry_inv


@router.get("/{investigation_id}/report")
async def get_report(
    investigation_id: str,
    format: str = Query("json", pattern="^(json|markdown)$"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve Proof Pack report formatted as JSON or Markdown."""
    inv = await db.get(InvestigationModel, investigation_id)
    if not inv or not inv.proof_pack_json:
        raise HTTPException(status_code=404, detail="Proof Pack report not ready or not found")

    if format == "markdown":
        md = ProofPackBuilder.generate_markdown_report(inv.proof_pack_json)
        return Response(content=md, media_type="text/markdown")

    return inv.proof_pack_json


@router.get("/{investigation_id}/artifacts/{file_name}")
async def download_artifact(
    investigation_id: str,
    file_name: str,
):
    """Download evidence artifact file (e.g. proof_pack.zip)."""
    # Safe path resolution
    safe_name = Path(file_name).name
    file_path = settings.DATA_DIR / "artifacts" / investigation_id / safe_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Artifact file not found")

    return FileResponse(
        path=str(file_path),
        filename=safe_name,
        media_type="application/octet-stream" if safe_name.endswith(".zip") else "text/plain",
    )


@router.delete("/{investigation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_investigation(
    investigation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete an investigation record and clean up associated artifacts."""
    inv = await db.get(InvestigationModel, investigation_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    await db.delete(inv)
    await db.commit()
    return None
