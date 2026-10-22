import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    String,
    Text,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class InvestigationModel(Base):
    __tablename__ = "investigations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    bug_title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    expected_behavior: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    actual_behavior: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reproduction_steps: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    environment_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    repository_url: Mapped[str] = mapped_column(String(512), nullable=False)
    commit_sha: Mapped[str] = mapped_column(String(64), default="HEAD", nullable=False)
    branch: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    state: Mapped[str] = mapped_column(String(32), default="CREATED", nullable=False)
    verdict: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    attempt_budget: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    time_budget_seconds: Mapped[int] = mapped_column(Integer, default=300, nullable=False)
    model_provider: Mapped[str] = mapped_column(String(64), default="ollama", nullable=False)
    model_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    proof_pack_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    events: Mapped[List["InvestigationEventModel"]] = relationship(
        "InvestigationEventModel", back_populates="investigation", cascade="all, delete-orphan", order_by="InvestigationEventModel.sequence_number"
    )
    hypotheses: Mapped[List["HypothesisModel"]] = relationship(
        "HypothesisModel", back_populates="investigation", cascade="all, delete-orphan", order_by="HypothesisModel.order_index"
    )
    attempts: Mapped[List["ExecutionAttemptModel"]] = relationship(
        "ExecutionAttemptModel", back_populates="investigation", cascade="all, delete-orphan", order_by="ExecutionAttemptModel.attempt_number"
    )
    artifacts: Mapped[List["EvidenceArtifactModel"]] = relationship(
        "EvidenceArtifactModel", back_populates="investigation", cascade="all, delete-orphan"
    )


class InvestigationEventModel(Base):
    __tablename__ = "investigation_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    state: Mapped[str] = mapped_column(String(32), nullable=False)
    action: Mapped[str] = mapped_column(String(128), nullable=False)
    tool: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    relevant_files: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)
    duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    evidence_ref_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    is_error: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    investigation: Mapped["InvestigationModel"] = relationship("InvestigationModel", back_populates="events")


class HypothesisModel(Base):
    __tablename__ = "hypotheses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    target_file: Mapped[str] = mapped_column(String(255), nullable=False)
    target_symbol: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    suspected_cause: Mapped[str] = mapped_column(Text, nullable=False)
    verification_strategy: Mapped[str] = mapped_column(Text, nullable=False)
    supporting_evidence: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)
    contradictory_evidence: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)
    confidence_estimate: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    verified_state: Mapped[str] = mapped_column(String(32), default="UNTESTED", nullable=False)

    investigation: Mapped["InvestigationModel"] = relationship("InvestigationModel", back_populates="hypotheses")


class ExecutionAttemptModel(Base):
    __tablename__ = "execution_attempts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False)
    test_file_path: Mapped[str] = mapped_column(String(255), nullable=False)
    test_source_code: Mapped[str] = mapped_column(Text, nullable=False)
    test_command: Mapped[str] = mapped_column(String(512), nullable=False)
    exit_code: Mapped[int] = mapped_column(Integer, nullable=False)
    stdout: Mapped[str] = mapped_column(Text, default="", nullable=False)
    stderr: Mapped[str] = mapped_column(Text, default="", nullable=False)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reproduced_failure: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    failure_assertion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    environment_info: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    investigation: Mapped["InvestigationModel"] = relationship("InvestigationModel", back_populates="attempts")


class EvidenceArtifactModel(Base):
    __tablename__ = "evidence_artifacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(128), default="text/plain", nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    download_url: Mapped[str] = mapped_column(String(512), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    investigation: Mapped["InvestigationModel"] = relationship("InvestigationModel", back_populates="artifacts")
