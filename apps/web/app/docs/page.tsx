import React from "react";
import Link from "next/link";
import { BookOpen, Terminal, Shield, Cpu, Layers, CheckCircle2, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function DocsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12 flex-1 w-full">
      {/* Title */}
      <div className="space-y-2 border-b border-border/80 pb-6">
        <Badge variant="cyan" className="font-mono text-xs">
          OFFICIAL DOCUMENTATION
        </Badge>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-foreground">
          BugBounty Hunter Documentation
        </h1>
        <p className="text-sm text-foreground-secondary max-w-2xl">
          Complete guide to the autonomous bug reproduction engine, the Reproduction Ladder, sandbox isolation guarantees, and local open-weight model setup.
        </p>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a href="#quickstart" className="p-4 rounded border border-border bg-surface hover:border-accent transition-colors block">
          <Terminal className="w-5 h-5 text-accent mb-2" />
          <h3 className="font-mono text-xs font-bold text-foreground">Quickstart Guide</h3>
          <p className="text-[11px] text-foreground-muted mt-1">Run in 2 minutes using local fixture repo</p>
        </a>

        <a href="#methodology" className="p-4 rounded border border-border bg-surface hover:border-accent transition-colors block">
          <Layers className="w-5 h-5 text-accent-cyan mb-2" />
          <h3 className="font-mono text-xs font-bold text-foreground">Reproduction Ladder</h3>
          <p className="text-[11px] text-foreground-muted mt-1">Bounded investigation state machine</p>
        </a>

        <a href="#security" className="p-4 rounded border border-border bg-surface hover:border-accent transition-colors block">
          <Shield className="w-5 h-5 text-warning mb-2" />
          <h3 className="font-mono text-xs font-bold text-foreground">Sandbox Security</h3>
          <p className="text-[11px] text-foreground-muted mt-1">No-network, read-only container limits</p>
        </a>
      </div>

      {/* 1. Quickstart */}
      <section id="quickstart" className="space-y-4">
        <h2 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
          <Terminal className="w-5 h-5 text-accent" />
          Quickstart: Testing With Bundled Fixture
        </h2>
        <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
          BugBounty Hunter includes a controlled sample repository located at <code className="bg-surface px-1.5 py-0.5 rounded border border-border text-accent">fixtures/sample-buggy-repo</code> containing a genuine, verified edge-case crash (Issue #42: unhandled <code className="text-accent">struct.error</code> in <code className="text-accent">parse_chunk_header</code>).
        </p>

        <div className="p-4 rounded bg-background border border-border font-mono text-xs space-y-2 text-foreground-secondary">
          <div className="text-foreground-muted"># 1. Run the Python backend API</div>
          <div className="text-accent">uvicorn app.main:app --port 8000</div>
          <div className="text-foreground-muted pt-2"># 2. Run the Next.js frontend</div>
          <div className="text-accent">npm --prefix apps/web run dev</div>
          <div className="text-foreground-muted pt-2"># 3. Launch reproduction via API or UI</div>
          <div>Navigate to http://localhost:3000/investigations/new and click &quot;Load Sample Buggy Fixture&quot;.</div>
        </div>
      </section>

      {/* 2. The Reproduction Ladder */}
      <section id="methodology" className="space-y-4">
        <h2 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
          <Layers className="w-5 h-5 text-accent-cyan" />
          The Reproduction Ladder States
        </h2>
        <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
          The engine transitions sequentially through explicit, bounded states:
        </p>

        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 rounded border border-border bg-surface">
            <span className="text-accent font-bold">1. VALIDATING &bull; </span>
            <span className="text-foreground">SSRF check, URL restriction validation, and report parsing.</span>
          </div>
          <div className="p-3 rounded border border-border bg-surface">
            <span className="text-accent font-bold">2. PREPARING &bull; </span>
            <span className="text-foreground">Pins commit SHA, prepares isolated directory, and executes existing baseline test suite.</span>
          </div>
          <div className="p-3 rounded border border-border bg-surface">
            <span className="text-accent font-bold">3. ANALYZING &bull; </span>
            <span className="text-foreground">Deterministic AST and keyword search to identify primary target modules.</span>
          </div>
          <div className="p-3 rounded border border-border bg-surface">
            <span className="text-accent font-bold">4. HYPOTHESIZING &bull; </span>
            <span className="text-foreground">Formulates 1-3 testable failure hypotheses with confidence estimates.</span>
          </div>
          <div className="p-3 rounded border border-border bg-surface">
            <span className="text-accent font-bold">5. GENERATING_TEST &bull; </span>
            <span className="text-foreground">Synthesizes candidate pytest file within bounded path and size constraints.</span>
          </div>
          <div className="p-3 rounded border border-border bg-surface">
            <span className="text-accent font-bold">6. EXECUTING_TEST &bull; </span>
            <span className="text-foreground">Executes candidate in container or isolated process. Records exit codes, durations, and output.</span>
          </div>
          <div className="p-3 rounded border border-border bg-surface">
            <span className="text-accent font-bold">7. EVALUATING_EVIDENCE &bull; </span>
            <span className="text-foreground">Validates if failure matches reported bug symptoms. Assigns REPRODUCED, NOT_REPRODUCED, or INCONCLUSIVE.</span>
          </div>
          <div className="p-3 rounded border border-border bg-surface">
            <span className="text-accent font-bold">8. REPORTING &bull; </span>
            <span className="text-foreground">Generates JSON manifest, Markdown report, and downloadable ZIP Proof Pack.</span>
          </div>
        </div>
      </section>

      {/* 3. Sandbox Security */}
      <section id="security" className="space-y-4">
        <h2 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-warning" />
          Sandbox Security Guarantees
        </h2>
        <div className="p-5 rounded-lg border border-border bg-surface/50 space-y-3 text-xs text-foreground-secondary leading-relaxed">
          <p>
            BugBounty Hunter treats all target repositories, issues, README instructions, and test code as untrusted input.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-[11px]">
            <li><strong>Network Disabled:</strong> Docker execution passes <code className="text-accent">--network none</code> to prevent outbound connections or data exfiltration.</li>
            <li><strong>Credential Isolation:</strong> Host environment variables, API tokens, and SSH keys are explicitly purged from sandbox runners.</li>
            <li><strong>Secret Redaction:</strong> Captured stdout, stderr, and command traces pass through automated secret redaction before storage or display.</li>
            <li><strong>Time & Resource Budgets:</strong> Strict per-test execution timeouts (default 30s) and memory caps (512MB) prevent runaway processes.</li>
            <li><strong>Path Traversal Protection:</strong> All relative file paths are verified against directory escape attempts using realpath canonicalization.</li>
          </ul>
        </div>
      </section>

      {/* 4. Local Ollama Setup */}
      <section className="space-y-4">
        <h2 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
          <Cpu className="w-5 h-5 text-accent" />
          Local Ollama Model Configuration
        </h2>
        <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
          To run open-weight inference locally on your own machine:
        </p>

        <div className="p-4 rounded bg-background border border-border font-mono text-xs space-y-2 text-foreground-secondary">
          <div className="text-foreground-muted"># 1. Start Ollama</div>
          <div className="text-accent">ollama serve</div>
          <div className="text-foreground-muted pt-2"># 2. Pull recommended coding model</div>
          <div className="text-accent">ollama pull qwen2.5-coder:7b</div>
          <div className="text-foreground-muted pt-2"># 3. BugBounty Hunter connects automatically at http://localhost:11434</div>
        </div>
      </section>
    </div>
  );
}
