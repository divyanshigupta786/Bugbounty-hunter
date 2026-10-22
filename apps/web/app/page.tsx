import React from "react";
import Link from "next/link";
import {
  Terminal,
  Shield,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileCode,
  ArrowRight,
  Cpu,
  Layers,
  Download,
  Play,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HeroScene } from "@/components/three/HeroScene";

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2">
              <Badge variant="success" className="font-mono text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                V1.0 PUBLIC RELEASE
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                OPEN-WEIGHT AI &bull; OLLAMA READY
              </Badge>
            </div>

            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl md:text-6xl tracking-tight text-foreground leading-[1.1]">
              Stop Guessing. <br />
              <span className="text-accent underline decoration-accent/30 decoration-wavy">
                Start Reproducing.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-foreground-secondary leading-relaxed max-w-2xl">
              An open-source AI investigation agent that turns vague bug reports into reproducible tests, execution evidence, and verifiable Proof Packs.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/investigations/new">
                <Button size="lg" variant="primary" className="font-mono font-bold">
                  Start an Investigation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="font-mono">
                  <Play className="w-4 h-4 mr-2 text-accent" />
                  Explore Demo
                </Button>
              </Link>
            </div>

            {/* Credibility highlights */}
            <div className="pt-6 border-t border-border/40 grid grid-cols-3 gap-4 text-xs font-mono text-foreground-muted">
              <div>
                <span className="text-foreground font-bold block text-sm">Honest Verdicts</span>
                REPRODUCED &bull; INCONCLUSIVE
              </div>
              <div>
                <span className="text-foreground font-bold block text-sm">Disposable Sandboxes</span>
                Zero network &bull; Confined
              </div>
              <div>
                <span className="text-foreground font-bold block text-sm">Portable Artifacts</span>
                Proof Pack ZIP &bull; Markdown
              </div>
            </div>
          </div>

          {/* Right Hero Three.js Visual Scene */}
          <div className="lg:col-span-5 relative">
            <div className="p-2 rounded-2xl border border-border/80 bg-surface/50 backdrop-blur-sm shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-background-secondary/60 text-xs font-mono text-foreground-muted">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-error/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-warning/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-accent/70" />
                </div>
                <span>TOPOLOGY_INSPECTOR</span>
              </div>
              <HeroScene />
            </div>
          </div>
        </div>
      </section>

      {/* The Reproduction Ladder Section */}
      <section id="ladder" className="py-20 border-b border-border/80 bg-background-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge variant="cyan" className="font-mono text-xs">
              CORE METHODOLOGY
            </Badge>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground">
              The Reproduction Ladder
            </h2>
            <p className="text-sm sm:text-base text-foreground-secondary leading-relaxed">
              The agent escalates through bounded investigation steps. It performs inexpensive static checks first and proceeds to test execution only when justified.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:border-accent/40 transition-colors">
              <CardHeader>
                <div className="w-8 h-8 rounded bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-2 font-mono font-bold text-xs">
                  01
                </div>
                <CardTitle className="text-sm font-bold font-mono">1. Baseline & Invariant Check</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-foreground-secondary space-y-2">
                <p>
                  Before generating new tests, the agent pins the commit and executes the existing test suite. If the baseline is broken, it refuses to misclassify environment failures as bug proof.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-accent/40 transition-colors">
              <CardHeader>
                <div className="w-8 h-8 rounded bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan mb-2 font-mono font-bold text-xs">
                  02
                </div>
                <CardTitle className="text-sm font-bold font-mono">2. Hypothesis & AST Synthesis</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-foreground-secondary space-y-2">
                <p>
                  Analyzes issue text and symbol definitions to formulate 1-3 testable hypotheses. Generates minimal, targeted pytest candidates within strict path and size limits.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-accent/40 transition-colors">
              <CardHeader>
                <div className="w-8 h-8 rounded bg-[#C8FF4D]/10 border border-[#C8FF4D]/20 flex items-center justify-center text-[#C8FF4D] mb-2 font-mono font-bold text-xs">
                  03
                </div>
                <CardTitle className="text-sm font-bold font-mono">3. Isolated Execution & Verdict</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-foreground-secondary space-y-2">
                <p>
                  Executes candidates in a container with network disabled, non-root user, and resource limits. Captures actual exit codes, assertions, and sanitized traces into a Proof Pack.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Honest Verdicts Section */}
      <section className="py-20 border-b border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="max-w-3xl space-y-3">
            <Badge variant="warning" className="font-mono text-xs">
              INTEGRITY FIRST
            </Badge>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground">
              Honest Verdicts, Never Guesses
            </h2>
            <p className="text-sm sm:text-base text-foreground-secondary leading-relaxed">
              Unlike chat interfaces that hallucinate certainty, BugBounty Hunter uses deterministic verification checks. A setup error is never reported as proof that a bug does not exist.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border border-[#C8FF4D]/30 bg-surface/80 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <span className="font-mono font-bold text-sm text-foreground">REPRODUCED</span>
              </div>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                The observed failure matches the reported defect and is backed by exit codes, traceback assertions, and repeatable replay commands.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-surface/80 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-foreground-secondary" />
                <span className="font-mono font-bold text-sm text-foreground">NOT REPRODUCED</span>
              </div>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                The investigation executed candidate edge cases and passed cleanly under the tested conditions without observing the reported defect.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-warning/30 bg-surface/80 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <span className="font-mono font-bold text-sm text-foreground">INCONCLUSIVE</span>
              </div>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                The environment failed, baseline tests did not pass, execution timed out, or evidence was insufficient to confirm the result.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Proof Pack Preview Section */}
      <section id="proof-pack" className="py-20 border-b border-border/80 bg-background-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="cyan" className="font-mono text-xs">
                PORTABLE EVIDENCE
              </Badge>
              <h2 className="font-heading font-bold text-3xl text-foreground">
                The Proof Pack
              </h2>
              <p className="text-sm text-foreground-secondary">
                Every completed investigation produces an evidence-backed bundle you can download, replay, and attach to GitHub PRs.
              </p>
            </div>

            <Link href="/investigations/demo-inv-42/report">
              <Button variant="outline" className="font-mono text-xs">
                <Download className="w-3.5 h-3.5 mr-2" />
                View Sample Proof Pack
              </Button>
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-surface p-6 font-mono text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80 text-foreground-muted">
              <span>proof_pack.json (Schema v1.0.0)</span>
              <span className="text-accent">VERDICT: REPRODUCED</span>
            </div>
            <pre className="text-foreground-secondary overflow-x-auto text-[11px] leading-relaxed">
{`{
  "schemaVersion": "1.0.0",
  "investigationId": "demo-inv-42",
  "verdict": "REPRODUCED",
  "repository": {
    "url": "fixture://sample-buggy-repo",
    "commitSha": "fixture-v0.1.0",
    "testFramework": "pytest"
  },
  "reproductionTest": {
    "filePath": "tests/test_reproduction_candidate.py",
    "replayCommand": "pytest tests/test_reproduction_candidate.py -v",
    "expectedFailureTrace": "struct.error: unpack requires a buffer of 8 bytes"
  },
  "executionEvidence": {
    "lastExitCode": 1,
    "executionDurationMs": 820
  }
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-foreground">
            Ready to reproduce your first defect?
          </h2>
          <p className="text-sm sm:text-base text-foreground-secondary max-w-xl mx-auto">
            Run against your own Python repositories or test our controlled fixture library immediately.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/investigations/new">
              <Button size="lg" variant="primary" className="font-mono font-bold">
                Launch New Investigation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="secondary" className="font-mono">
                Read Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
