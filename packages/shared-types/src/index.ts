export type InvestigationState =
  | "CREATED"
  | "VALIDATING"
  | "PREPARING"
  | "ANALYZING"
  | "HYPOTHESIZING"
  | "GENERATING_TEST"
  | "EXECUTING_TEST"
  | "EVALUATING_EVIDENCE"
  | "REPORTING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type VerdictType = "REPRODUCED" | "NOT_REPRODUCED" | "INCONCLUSIVE";

export interface InvestigationCreateRequest {
  repositoryUrl: string;
  bugTitle: string;
  description: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  reproductionSteps?: string;
  environmentDetails?: string;
  commitSha?: string;
  branch?: string;
  attemptBudget?: number;
  timeBudgetSeconds?: number;
  modelProvider?: string;
  modelName?: string;
  isDemo?: boolean;
}

export interface InvestigationSummary {
  id: string;
  bugTitle: string;
  repositoryUrl: string;
  commitSha: string;
  state: InvestigationState;
  verdict: VerdictType | null;
  confidenceScore: number | null;
  createdAt: string;
  updatedAt: string;
  durationMs: number | null;
  isDemo: boolean;
}

export interface Hypothesis {
  id: string;
  investigationId: string;
  orderIndex: number;
  title: string;
  description: string;
  targetFile: string;
  targetSymbol?: string;
  suspectedCause: string;
  verificationStrategy: string;
  supportingEvidence?: string[];
  contradictoryEvidence?: string[];
  confidenceEstimate: number; // 0.0 - 1.0 (labeled clearly as estimate)
  verifiedState?: "CONFIRMED" | "REFUTED" | "UNTESTED";
}

export interface ExecutionAttempt {
  id: string;
  investigationId: string;
  attemptNumber: number;
  testFilePath: string;
  testSourceCode: string;
  testCommand: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  reproducedFailure: boolean;
  failureAssertion?: string;
  environmentInfo: Record<string, string>;
  createdAt: string;
}

export interface EvidenceArtifact {
  id: string;
  investigationId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  description: string;
  downloadUrl: string;
  createdAt: string;
}

export interface InvestigationEvent {
  id: string;
  investigationId: string;
  sequenceNumber: number;
  state: InvestigationState;
  action: string;
  tool?: string;
  message: string;
  relevantFiles?: string[];
  durationMs?: number;
  evidenceRefId?: string;
  isError?: boolean;
  createdAt: string;
}

export interface ProofPack {
  schemaVersion: "1.0.0";
  investigationId: string;
  generatedAt: string;
  verdict: VerdictType;
  verdictExplanation: string;
  repository: {
    url: string;
    commitSha: string;
    branch?: string;
    language: string;
    testFramework: string;
  };
  originalReport: {
    title: string;
    description: string;
    expected: string;
    actual: string;
    environment: string;
  };
  environment: {
    runner: "docker" | "isolated_process";
    pythonVersion: string;
    pytestVersion: string;
    os: string;
    memoryLimitMb: number;
    timeoutSeconds: number;
  };
  reproductionLadderSteps: Array<{
    step: string;
    outcome: string;
    evidenceNotes: string;
  }>;
  hypotheses: Hypothesis[];
  reproductionTest: {
    filePath: string;
    sourceCode: string;
    replayCommand: string;
    expectedFailureTrace: string;
  };
  executionEvidence: {
    totalAttempts: number;
    lastExitCode: number;
    testOutputSanitized: string;
    capturedAssertions: string[];
    executionDurationMs: number;
  };
  replayInstructions: string[];
  limitations: string[];
}

export interface InvestigationDetail extends InvestigationSummary {
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
  reproductionSteps?: string;
  environmentDetails?: string;
  branch?: string;
  attemptBudget: number;
  timeBudgetSeconds: number;
  events: InvestigationEvent[];
  hypotheses: Hypothesis[];
  attempts: ExecutionAttempt[];
  artifacts: EvidenceArtifact[];
  proofPack?: ProofPack;
}
