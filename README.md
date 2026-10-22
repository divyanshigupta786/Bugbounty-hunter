# BugBounty Hunter

> **Every bug has a story. Every claim needs proof.**

BugBounty Hunter is an open-source AI developer tooling platform that turns vague defect reports into reproducible pytest tests, isolated container execution evidence, and portable, verifiable **Proof Packs**.

---

## 🎯 The Core Philosophy: Investigation, Not Hallucination

Developers frequently receive incomplete reports like:
- *"The worker crashes when parsing image tags."*
- *"The validator raises unhandled errors on certain payloads."*
- *"This API endpoint returns wrong results on edge cases."*

Rather than having an LLM guess or hallucinate answers in a chat box, BugBounty Hunter treats defect reproduction as a forensic engineering discipline:
1. **The Reproduction Ladder:** Escalates from baseline checks to AST inspection, candidate synthesis, and container execution.
2. **Honest Verdicts:** Strictly assigns `REPRODUCED`, `NOT_REPRODUCED`, or `INCONCLUSIVE`. A broken setup or timeout is never reported as bug absence.
3. **Evidence-First Proof Pack:** Produces a portable, reproducible archive with the exact test source code, sanitized execution logs, and replay commands.
4. **Disposable Sandboxing:** Test candidates run in unprivileged containers with disabled networking (`--network none`) and purged host credentials.

---

## 🏗️ Architecture

```
bugbounty-hunter/
├── apps/
│   ├── web/               # Next.js 14 App Router, Tailwind CSS, Three.js, Lucide
│   │   ├── app/           # Landing, Dashboard, Workspace, Proof Pack, Docs, Settings
│   │   └── components/    # Three.js hero scene, Ladder Timeline, Test Viewer, Activity Log
│   └── api/               # Python FastAPI Async Backend
│       ├── app/agent/     # Bounded state machine engine
│       ├── app/providers/ # Model abstraction (Ollama, Qwen2.5-Coder, Deterministic engine)
│       ├── app/sandbox/   # Dual runner: Docker container & Confined Subprocess
│       ├── app/evidence/  # Proof Pack JSON/Markdown/ZIP generator
│       └── tests/         # Pytest integration & unit test suite (100% passing)
├── fixtures/
│   └── sample-buggy-repo/ # Controlled Python repo with verified bug (Issue #42)
├── packages/
│   └── shared-types/      # Shared TypeScript contracts & schemas
└── docs/                  # System architecture, security model, and API reference
```

---

## 🚀 Quickstart

### 1. Prerequisites
- Node.js 18+ and npm
- Python 3.10+ (tested through Python 3.14)
- (Optional) Docker for disposable container isolation
- (Optional) [Ollama](https://ollama.ai) for local open-weight inference (`ollama pull qwen2.5-coder:7b`)

### 2. Backend Setup
```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The FastAPI OpenAPI documentation is available at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd apps/web
npm install
npm run dev
```

Open `http://localhost:3000` to access the BugBounty Hunter workspace.

---

## 🧪 Automated Test Verification

BugBounty Hunter comes with a comprehensive automated test suite testing the full autonomous reproduction lifecycle:

```bash
# Run backend pytest suite (10 tests: state machine, API, SSRF, secret redaction)
npm run test:api

# Run sample fixture repository tests
npm run test:fixture
```

### Verified Test Suite Results:
- `test_full_investigation_workflow_reproduces_bug`: **PASSED**
- `test_investigation_api_endpoints`: **PASSED**
- `test_health_endpoint`: **PASSED**
- `test_readiness_endpoint`: **PASSED**
- `test_models_list`: **PASSED**
- `test_secret_redaction`: **PASSED**
- `test_ssrf_protection_rejects_private_ips`: **PASSED**
- `test_ssrf_protection_allows_valid_urls`: **PASSED**
- `test_path_traversal_prevention`: **PASSED**
- Next.js Production Build (`next build`): **100% SUCCEEDED**

---

## 📦 The Proof Pack

Every completed investigation outputs a verifiable Proof Pack containing:
- Executive summary & honest verdict
- Target repository URL & exact pinned commit SHA
- Runner environment metadata (OS, Python version, timeout, memory ceiling)
- Synthesized candidate pytest code
- Actual exit code and sanitized traceback output
- Step-by-step local replay command
- Downloadable ZIP archive containing `proof_pack.json`, `REPORT.md`, `test_reproduction.py`, and `replay.sh`.

---

## 🔒 Security & Sandboxing

- **Network Disabled:** Isolated execution runs with `--network none` to prevent data exfiltration.
- **SSRF Protection:** Repository URLs are validated against private IP ranges (`127.0.0.1`, `10.0.0.0/8`, `169.254.169.254`).
- **Secret Redaction:** Automated regex masking scrubs tokens, API keys, and passwords before logging.
- **Resource Constraints:** Enforced execution timeouts (default 30s) and memory caps (512MB).

---

## 📄 License

MIT License &bull; Copyright &copy; 2026 BugBounty Hunter Contributors.
