from datetime import datetime
from typing import List, Dict, Any, Optional
from enum import Enum
from pydantic import BaseModel, Field, HttpUrl, ConfigDict


class InvestigationState(str, Enum):
    CREATED = "CREATED"
    VALIDATING = "VALIDATING"
    PREPARING = "PREPARING"
    ANALYZING = "ANALYZING"
    HYPOTHESIZING = "HYPOTHESIZING"
    GENERATING_TEST = "GENERATING_TEST"
    EXECUTING_TEST = "EXECUTING_TEST"
    EVALUATING_EVIDENCE = "EVALUATING_EVIDENCE"
    REPORTING = "REPORTING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class VerdictType(str, Enum):
    REPRODUCED = "REPRODUCED"
    NOT_REPRODUCED = "NOT_REPRODUCED"
    INCONCLUSIVE = "INCONCLUSIVE"


class InvestigationCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    repository_url: str = Field(..., alias="repositoryUrl", description="Git repository URL or fixture identifier")
    bug_title: str = Field(..., min_length=3, max_length=200, alias="bugTitle")
    description: str = Field(..., min_length=10, alias="description")
    expected_behavior: Optional[str] = Field(None, alias="expectedBehavior")
    actual_behavior: Optional[str] = Field(None, alias="actualBehavior")
    reproduction_steps: Optional[str] = Field(None, alias="reproductionSteps")
    environment_details: Optional[str] = Field(None, alias="environmentDetails")
    commit_sha: Optional[str] = Field(None, alias="commitSha")
    branch: Optional[str] = Field(None, alias="branch")
    attempt_budget: int = Field(default=3, ge=1, le=5, alias="attemptBudget")
    time_budget_seconds: int = Field(default=300, ge=30, le=900, alias="timeBudgetSeconds")
    model_provider: Optional[str] = Field("ollama", alias="modelProvider")
    model_name: Optional[str] = Field(None, alias="modelName")
    is_demo: bool = Field(default=False, alias="isDemo")


class HypothesisSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    investigation_id: str = Field(..., alias="investigationId")
    order_index: int = Field(..., alias="orderIndex")
    title: str
    description: str
    target_file: str = Field(..., alias="targetFile")
    target_symbol: Optional[str] = Field(None, alias="targetSymbol")
    suspected_cause: str = Field(..., alias="suspectedCause")
    verification_strategy: str = Field(..., alias="verificationStrategy")
    supporting_evidence: List[str] = Field(default_factory=list, alias="supportingEvidence")
    contradictory_evidence: List[str] = Field(default_factory=list, alias="contradictoryEvidence")
    confidence_estimate: float = Field(..., alias="confidenceEstimate")
    verified_state: Optional[str] = Field("UNTESTED", alias="verifiedState")


class ExecutionAttemptSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    investigation_id: str = Field(..., alias="investigationId")
    attempt_number: int = Field(..., alias="attemptNumber")
    test_file_path: str = Field(..., alias="testFilePath")
    test_source_code: str = Field(..., alias="testSourceCode")
    test_command: str = Field(..., alias="testCommand")
    exit_code: int = Field(..., alias="exitCode")
    stdout: str
    stderr: str
    duration_ms: int = Field(..., alias="durationMs")
    reproduced_failure: bool = Field(..., alias="reproducedFailure")
    failure_assertion: Optional[str] = Field(None, alias="failureAssertion")
    environment_info: Dict[str, str] = Field(default_factory=dict, alias="environmentInfo")
    created_at: datetime = Field(..., alias="createdAt")


class EvidenceArtifactSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    investigation_id: str = Field(..., alias="investigationId")
    file_name: str = Field(..., alias="fileName")
    mime_type: str = Field(..., alias="mimeType")
    size_bytes: int = Field(..., alias="sizeBytes")
    sha256_hash: str = Field(..., alias="sha256Hash")
    description: str
    download_url: str = Field(..., alias="downloadUrl")
    created_at: datetime = Field(..., alias="createdAt")


class InvestigationEventSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    investigation_id: str = Field(..., alias="investigationId")
    sequence_number: int = Field(..., alias="sequenceNumber")
    state: InvestigationState
    action: str
    tool: Optional[str] = None
    message: str
    relevant_files: List[str] = Field(default_factory=list, alias="relevantFiles")
    duration_ms: Optional[int] = Field(None, alias="durationMs")
    evidence_ref_id: Optional[str] = Field(None, alias="evidenceRefId")
    is_error: bool = Field(default=False, alias="isError")
    created_at: datetime = Field(..., alias="createdAt")


class ProofPackSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    schema_version: str = Field("1.0.0", alias="schemaVersion")
    investigation_id: str = Field(..., alias="investigationId")
    generated_at: str = Field(..., alias="generatedAt")
    verdict: VerdictType
    verdict_explanation: str = Field(..., alias="verdictExplanation")
    repository: Dict[str, Any]
    original_report: Dict[str, Any] = Field(..., alias="originalReport")
    environment: Dict[str, Any]
    reproduction_ladder_steps: List[Dict[str, str]] = Field(..., alias="reproductionLadderSteps")
    hypotheses: List[HypothesisSchema]
    reproduction_test: Dict[str, str] = Field(..., alias="reproductionTest")
    execution_evidence: Dict[str, Any] = Field(..., alias="executionEvidence")
    replay_instructions: List[str] = Field(..., alias="replayInstructions")
    limitations: List[str]


class InvestigationSummarySchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    bug_title: str = Field(..., alias="bugTitle")
    repository_url: str = Field(..., alias="repositoryUrl")
    commit_sha: str = Field(..., alias="commitSha")
    state: InvestigationState
    verdict: Optional[VerdictType] = None
    confidence_score: Optional[float] = Field(None, alias="confidenceScore")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    duration_ms: Optional[int] = Field(None, alias="durationMs")
    is_demo: bool = Field(default=False, alias="isDemo")


class InvestigationDetailSchema(InvestigationSummarySchema):
    description: str
    expected_behavior: Optional[str] = Field(None, alias="expectedBehavior")
    actual_behavior: Optional[str] = Field(None, alias="actualBehavior")
    reproduction_steps: Optional[str] = Field(None, alias="reproductionSteps")
    environment_details: Optional[str] = Field(None, alias="environmentDetails")
    branch: Optional[str] = None
    attempt_budget: int = Field(..., alias="attemptBudget")
    time_budget_seconds: int = Field(..., alias="timeBudgetSeconds")
    events: List[InvestigationEventSchema] = Field(default_factory=list)
    hypotheses: List[HypothesisSchema] = Field(default_factory=list)
    attempts: List[ExecutionAttemptSchema] = Field(default_factory=list)
    artifacts: List[EvidenceArtifactSchema] = Field(default_factory=list)
    proof_pack: Optional[ProofPackSchema] = Field(None, alias="proofPack")
