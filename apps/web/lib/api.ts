import {
  InvestigationCreateRequest,
  InvestigationSummary,
  InvestigationDetail,
  ProofPack,
} from "@bugbounty/shared-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function fetchInvestigations(search?: string, state?: string): Promise<InvestigationSummary[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (state) params.set("state", state);

  try {
    const res = await fetch(`${API_BASE}/api/v1/investigations?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Failed to fetch investigations from API, falling back to local demo state", err);
    return getFallbackInvestigations();
  }
}

export async function fetchInvestigation(id: string): Promise<InvestigationDetail> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/investigations/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Failed to fetch investigation ${id}, returning fallback demo`, err);
    return getFallbackInvestigationDetail(id);
  }
}

export async function createInvestigation(data: InvestigationCreateRequest): Promise<InvestigationSummary> {
  const res = await fetch(`${API_BASE}/api/v1/investigations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Failed to create investigation (${res.status})`);
  }
  return await res.json();
}

export async function cancelInvestigation(id: string): Promise<void> {
  await fetch(`${API_BASE}/api/v1/investigations/${id}/cancel`, {
    method: "POST",
  });
}

export async function retryInvestigation(id: string): Promise<InvestigationSummary> {
  const res = await fetch(`${API_BASE}/api/v1/investigations/${id}/retry`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Retry failed");
  return await res.json();
}

export async function fetchModelsStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/models`, { cache: "no-store" });
    if (!res.ok) throw new Error("Models probe failed");
    return await res.json();
  } catch {
    return {
      providers: [
        { id: "ollama", name: "Ollama (Local Inference)", online: false, endpoint: "http://localhost:11434" },
        { id: "deterministic", name: "Deterministic Engine", online: true, endpoint: "local" },
      ],
      models: [
        { id: "deterministic-fixture", name: "Deterministic Fixture Engine", provider: "deterministic", status: "ready" }
      ],
      default: "deterministic-fixture"
    };
  }
}

// Fallback demo fixtures for seamless offline/standalone exploration
function getFallbackInvestigations(): InvestigationSummary[] {
  return [
    {
      id: "demo-inv-42",
      bugTitle: "parse_chunk_header crashes with struct.error on truncated chunk data",
      repositoryUrl: "fixture://sample-buggy-repo",
      commitSha: "fixture-v0.1.0",
      state: "COMPLETED",
      verdict: "REPRODUCED",
      confidenceScore: 0.96,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      durationMs: 3420,
      isDemo: true,
    },
    {
      id: "demo-inv-43",
      bugTitle: "calculate_aspect_ratio ZeroDivisionError on height 0",
      repositoryUrl: "fixture://sample-buggy-repo",
      commitSha: "fixture-v0.1.0",
      state: "COMPLETED",
      verdict: "REPRODUCED",
      confidenceScore: 0.94,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      durationMs: 2980,
      isDemo: true,
    },
  ];
}

function getFallbackInvestigationDetail(id: string): InvestigationDetail {
  return {
    id: id || "demo-inv-42",
    bugTitle: "parse_chunk_header crashes with struct.error on truncated chunk data",
    description: "When uploading an image with a truncated trailing chunk (< 8 bytes), parse_chunk_header causes an unhandled struct.error ('unpack requires a buffer of 8 bytes') instead of raising ImageValidationError.",
    expectedBehavior: "Should raise ImageValidationError('Truncated chunk header')",
    actualBehavior: "struct.error: unpack requires a buffer of 8 bytes",
    repositoryUrl: "fixture://sample-buggy-repo",
    commitSha: "fixture-v0.1.0",
    state: "COMPLETED",
    verdict: "REPRODUCED",
    confidenceScore: 0.96,
    attemptBudget: 3,
    timeBudgetSeconds: 300,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    durationMs: 3420,
    isDemo: true,
    events: [
      {
        id: "ev-1",
        investigationId: id,
        sequenceNumber: 1,
        state: "VALIDATING",
        action: "Input Validation",
        message: "Validated repository path and report constraints.",
        tool: "SSRFValidator",
        createdAt: new Date().toISOString(),
      },
      {
        id: "ev-2",
        investigationId: id,
        sequenceNumber: 2,
        state: "PREPARING",
        action: "Repository Prepared",
        message: "Pinned environment to commit fixture-v0.1.0. Baseline suite verified: 5/5 tests passed.",
        tool: "GitManager",
        createdAt: new Date().toISOString(),
      },
      {
        id: "ev-3",
        investigationId: id,
        sequenceNumber: 3,
        state: "ANALYZING",
        action: "Static Code Analysis",
        message: "Identified target source file 'pixelflow/validator.py'.",
        tool: "DeterministicCodeSearch",
        relevantFiles: ["pixelflow/validator.py"],
        createdAt: new Date().toISOString(),
      },
      {
        id: "ev-4",
        investigationId: id,
        sequenceNumber: 4,
        state: "HYPOTHESIZING",
        action: "Formulated Hypotheses",
        message: "Hypothesis: Buffer Underrun in parse_chunk_header (Missing length check len(data) >= 8).",
        tool: "ModelProvider",
        createdAt: new Date().toISOString(),
      },
      {
        id: "ev-5",
        investigationId: id,
        sequenceNumber: 5,
        state: "GENERATING_TEST",
        action: "Generated Candidate Test",
        message: "Synthesized targeted pytest reproduction asserting ImageValidationError on short byte payload.",
        tool: "PytestSynthesizer",
        relevantFiles: ["tests/test_reproduction_candidate.py"],
        createdAt: new Date().toISOString(),
      },
      {
        id: "ev-6",
        investigationId: id,
        sequenceNumber: 6,
        state: "EXECUTING_TEST",
        action: "Executed Test Candidate",
        message: "Sandbox execution failed with exit code 1. Observed traceback matching reported bug: struct.error.",
        tool: "SandboxRunner",
        durationMs: 820,
        createdAt: new Date().toISOString(),
      },
      {
        id: "ev-7",
        investigationId: id,
        sequenceNumber: 7,
        state: "EVALUATING_EVIDENCE",
        action: "Evidence Evaluation",
        message: "Execution evidence confirmed: struct.error uncaught. Verdict validated as REPRODUCED.",
        tool: "EvidenceEvaluator",
        createdAt: new Date().toISOString(),
      },
      {
        id: "ev-8",
        investigationId: id,
        sequenceNumber: 8,
        state: "COMPLETED",
        action: "Proof Pack Generated",
        message: "Portable Proof Pack packaged with replay instructions.",
        tool: "ProofPackBuilder",
        durationMs: 3420,
        createdAt: new Date().toISOString(),
      },
    ],
    hypotheses: [
      {
        id: "hyp-1",
        investigationId: id,
        orderIndex: 1,
        title: "Buffer Underrun in parse_chunk_header",
        description: "parse_chunk_header attempts to unpack 8 bytes without validating len(data) >= 8.",
        targetFile: "pixelflow/validator.py",
        targetSymbol: "parse_chunk_header",
        suspectedCause: "Missing length check before struct.unpack.",
        verificationStrategy: "Pass 5-byte payload and assert ImageValidationError.",
        confidenceEstimate: 0.92,
        verifiedState: "CONFIRMED",
      },
    ],
    attempts: [
      {
        id: "att-1",
        investigationId: id,
        attemptNumber: 1,
        testFilePath: "tests/test_reproduction_candidate.py",
        testSourceCode: `import pytest\nfrom pixelflow import parse_chunk_header, ImageValidationError\n\ndef test_reproduce_truncated_chunk_header_crash():\n    truncated_payload = b"SHORT"\n    with pytest.raises(ImageValidationError):\n        parse_chunk_header(truncated_payload)`,
        testCommand: "pytest tests/test_reproduction_candidate.py -v",
        exitCode: 1,
        stdout: "FAILED tests/test_reproduction_candidate.py::test_reproduce_truncated_chunk_header_crash - struct.error: unpack requires a buffer of 8 bytes",
        stderr: "",
        durationMs: 820,
        reproducedFailure: true,
        environmentInfo: {
          runner: "isolated_process",
          python_version: "3.14.7",
          os: "Windows",
        },
        createdAt: new Date().toISOString(),
      },
    ],
    artifacts: [
      {
        id: "art-1",
        investigationId: id,
        fileName: "proof_pack.zip",
        mimeType: "application/zip",
        sizeBytes: 4210,
        sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        description: "Complete Proof Pack archive (JSON, report, test script, and replay runner)",
        downloadUrl: `/api/v1/investigations/${id}/artifacts/proof_pack.zip`,
        createdAt: new Date().toISOString(),
      },
    ],
    proofPack: {
      schemaVersion: "1.0.0",
      investigationId: id,
      generatedAt: new Date().toISOString(),
      verdict: "REPRODUCED",
      verdictExplanation: "Execution confirmed the reported bug: parse_chunk_header failed with an unhandled struct.error ('unpack requires a buffer of 8 bytes') instead of raising the expected ImageValidationError.",
      repository: {
        url: "fixture://sample-buggy-repo",
        commitSha: "fixture-v0.1.0",
        branch: "main",
        language: "python",
        testFramework: "pytest",
      },
      originalReport: {
        title: "parse_chunk_header crashes with struct.error on truncated chunk data",
        description: "When uploading an image with a truncated trailing chunk, parse_chunk_header causes an unhandled struct.error ('unpack requires a buffer of 8 bytes') instead of raising ImageValidationError.",
        expected: "Should raise ImageValidationError",
        actual: "Unhandled struct.error: unpack requires a buffer of 8 bytes",
        environment: "Standard Python 3.x pytest",
      },
      environment: {
        runner: "isolated_process",
        pythonVersion: "3.14.7",
        pytestVersion: ">=7.0.0",
        os: "Windows/Linux",
        memoryLimitMb: 512,
        timeoutSeconds: 30,
      },
      reproductionLadderSteps: [
        { step: "Input Validation", outcome: "Success", evidenceNotes: "URL and parameter constraints validated" },
        { step: "Baseline Verification", outcome: "Success", evidenceNotes: "Existing suite passed cleanly (5/5)" },
        { step: "Static Analysis", outcome: "Success", evidenceNotes: "Targeted pixelflow/validator.py" },
        { step: "Candidate Execution", outcome: "Success", evidenceNotes: "Exit code 1, struct.error matched bug report" },
      ],
      hypotheses: [
        {
          id: "hyp-1",
          investigationId: id,
          orderIndex: 1,
          title: "Buffer Underrun in parse_chunk_header",
          description: "parse_chunk_header attempts to unpack 8 bytes without validating len(data) >= 8.",
          targetFile: "pixelflow/validator.py",
          targetSymbol: "parse_chunk_header",
          suspectedCause: "Missing length check before struct.unpack.",
          verificationStrategy: "Pass 5-byte payload and assert ImageValidationError.",
          confidenceEstimate: 0.92,
          verifiedState: "CONFIRMED",
        },
      ],
      reproductionTest: {
        filePath: "tests/test_reproduction_candidate.py",
        sourceCode: `import pytest\nfrom pixelflow import parse_chunk_header, ImageValidationError\n\ndef test_reproduce_truncated_chunk_header_crash():\n    truncated_payload = b"SHORT"\n    with pytest.raises(ImageValidationError):\n        parse_chunk_header(truncated_payload)`,
        replayCommand: "pytest tests/test_reproduction_candidate.py -v",
        expectedFailureTrace: "struct.error: unpack requires a buffer of 8 bytes",
      },
      executionEvidence: {
        totalAttempts: 1,
        lastExitCode: 1,
        testOutputSanitized: "FAILED tests/test_reproduction_candidate.py::test_reproduce_truncated_chunk_header_crash - struct.error: unpack requires a buffer of 8 bytes",
        capturedAssertions: ["struct.error: unpack requires a buffer of 8 bytes"],
        executionDurationMs: 820,
      },
      replayInstructions: [
        "1. Clone or navigate to the repository at commit fixture-v0.1.0",
        "2. Install dependencies: pip install -e . pytest",
        "3. Run: pytest tests/test_reproduction_candidate.py -v",
        "4. Observe unhandled struct.error reproducing the defect.",
      ],
      limitations: [
        "Reproduced under isolated test runner constraints.",
        "Assumes deterministic runtime environment.",
      ],
    },
  };
}
