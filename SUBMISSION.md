*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady](https://dev.to/challenges/hacktoberfest-week3-2026-10-19)*

## What I Built

**BugBounty Hunter** is an autonomous open-source AI forensic investigation platform that transforms vague defect reports into verified pytest reproduction tests, isolated execution trace evidence, and tamper-evident **Proof Packs**.

### The Problem It Solves
Every open-source maintainer and security team knows the pain of receiving vague bug or bounty reports:
- *"The worker crashes when parsing certain image tags."*
- *"The payload validator raises unhandled exceptions on edge cases."*
- *"The API endpoint gives unexpected status codes under load."*

Maintainers usually waste hours setting up clean environments, reverse-engineering the reporter's context, writing pytest boilerplate, and determining whether the claim is legitimate or just a hallucinated exploit report.

### Who Gets to Be Lazier?
**Open-source maintainers, bug bounty triagers, and software engineers.**  
Instead of spending an entire afternoon reproducing issue reports by hand, developers can drop in a GitHub repository URL and the raw issue text. BugBounty Hunter methodically inspects the AST, constructs hypotheses, and synthesizes a verified test inside an isolated sandbox—leaving maintainers with a complete, reproducible **Proof Pack** with a single click.

---

## Demo

- **Live Frontend**: [https://bugbounty-hunter.vercel.app](https://bugbounty-hunter.vercel.app) *(or your deployed Vercel domain)*
- **API Documentation**: [https://bugbounty-api.onrender.com/docs](https://bugbounty-api.onrender.com/docs)
- **Sample Verified Target**: Comes with built-in fixture repository (`fixtures/sample-buggy-repo`) showcasing automated reproduction of Issue #42 with real execution traces and passing forensic reports.

---

## Code

{% github divyanshigupta786/Bugbounty-hunter %}

Full source code repository: [https://github.com/divyanshigupta786/Bugbounty-hunter](https://github.com/divyanshigupta786/Bugbounty-hunter)

---

## How I Built It

BugBounty Hunter is built specifically around the philosophy of **"Slow and Steady"** investigation rather than fast, hallucinated one-shot answers.

### Architecture Overview
- **Next.js 14 Frontend**: Interactive dashboard with Three.js visualization, real-time investigation timeline (Reproduction Ladder), interactive test code viewer, and Proof Pack download inspector.
- **FastAPI Async Engine**: Python backend implementing a bounded state machine that guards the forensic workflow.
- **Dual Sandbox Isolation**: Test candidates execute either in containerized environments (`--network none`) or confined subprocesses with purged credentials, strict timeouts (30s), memory limits (512MB), and automated secret redaction.

### Open-Source AI Stack
1. **Open-Weight Code Models via Ollama**: Powered locally by `qwen2.5-coder:7b` for precise code AST understanding and targeted hypothesis formulation.
2. **Cloud Acceleration**: Optional Google Gemini integration (`gemini-2.5-flash`) for instant hypothesis synthesis while retaining full offline, local capabilities.
3. **The 4-Step Reproduction Ladder**:
   - **Step 1: Baseline Verification**: Validates repository test suite hygiene prior to investigation.
   - **Step 2: AST & Target Discovery**: Pinpoints suspect functions and error signatures.
   - **Step 3: Candidate Synthesis**: Generates isolated pytest reproduction scripts.
   - **Step 4: Disposable Execution**: Runs candidate code in a network-disabled sandbox and captures exit codes, sanitized tracebacks, and stdout.
4. **Honest Verdicts**: The engine strictly assigns `REPRODUCED`, `NOT_REPRODUCED`, or `INCONCLUSIVE`. A failed environment setup or timeout is never mistaken for a bug's absence.

---

## Why Does Open Innovation Matter?

Open-source AI and open innovation were essential to making BugBounty Hunter possible:

1. **Security & Air-Gapped Codebases**: Companies and security bounty hunters cannot send confidential, unpatched 0-day vulnerability reports or proprietary codebases to black-box commercial APIs. Running open-weight models (like `qwen2.5-coder`) locally via Ollama guarantees that sensitive bug reports and source code never leave the developer's machine.
2. **Deterministic Reproducibility**: Closed APIs change their weights and system prompts unannounced, breaking agent determinism. Open-weight models ensure reproducible forensic pipelines where a bug investigation conducted today produces verifiable results months later.
3. **Inspectable Toolchains**: True security tooling requires an auditable chain of custody. Closed models cannot be verified down to the container execution boundary—open innovation allows every step from AST parsing to unprivileged sandbox execution to be transparent and trustworthy.

---

## The Lazy Payoff

- **Hours Saved per Issue**: Triage time drops from **45–90 minutes** of manual environment setup, script writing, and verification down to **under 2 minutes** of automated background execution.
- **Zero Boilerplate**: Generates ready-to-merge `test_reproduction.py` and `replay.sh` scripts directly attached to the output Proof Pack.
- **Noise Elimination**: Automatically weeds out bogus or hallucinated bug reports without human intervention, sparing maintainers burnout from low-effort submissions.

---

## Prize Categories

- **Primary**: Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady
- **Categories**:
  - Best Use of Open-Source AI / Open-Weight Models (Ollama & Qwen 2.5 Coder)
  - Developer Tools & Productivity
