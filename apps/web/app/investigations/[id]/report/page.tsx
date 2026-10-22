"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FileText,
  Download,
  Copy,
  Check,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Play,
  Terminal,
  Shield,
  Layers,
} from "lucide-react";
import { InvestigationDetail } from "@bugbounty/shared-types";
import { fetchInvestigation } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default function ProofPackReportPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<InvestigationDetail | null>(null);
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  useEffect(() => {
    fetchInvestigation(id).then(setData).catch(console.error);
  }, [id]);

  if (!data || !data.proofPack) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono text-foreground-muted">Generating Proof Pack Report...</p>
      </div>
    );
  }

  const pp = data.proofPack;

  const copyMarkdown = async () => {
    try {
      const res = await fetch(`/api/v1/investigations/${id}/report?format=markdown`);
      const mdText = res.ok ? await res.text() : JSON.stringify(pp, null, 2);
      await navigator.clipboard.writeText(mdText);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    } catch {
      await navigator.clipboard.writeText(JSON.stringify(pp, null, 2));
    }
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(pp, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1 w-full">
      {/* Top Navigation & Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="flex items-center gap-3">
          <Link href={`/investigations/${id}`} className="text-foreground-muted hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-foreground-muted">PROOF PACK v{pp.schemaVersion}</span>
              {pp.verdict === "REPRODUCED" ? (
                <Badge variant="success" className="text-[10px]">REPRODUCED</Badge>
              ) : (
                <Badge variant="warning" className="text-[10px]">{pp.verdict}</Badge>
              )}
            </div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-foreground mt-0.5">
              Investigation Report & Evidence Pack
            </h1>
          </div>
        </div>

        {/* Download & Copy Buttons */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={copyMarkdown} className="font-mono text-xs">
            {copiedMd ? <Check className="w-3.5 h-3.5 text-accent mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            Copy Markdown
          </Button>

          <Button size="sm" variant="outline" onClick={copyJson} className="font-mono text-xs">
            {copiedJson ? <Check className="w-3.5 h-3.5 text-accent mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            Copy JSON
          </Button>

          <a href={`/api/v1/investigations/${id}/artifacts/proof_pack.zip`} download>
            <Button size="sm" variant="primary" className="font-mono text-xs font-bold">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download ZIP
            </Button>
          </a>
        </div>
      </div>

      {/* 1. Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            1. Executive Summary & Verdict
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs leading-relaxed">
          <div className="p-4 rounded-lg bg-surface/50 border border-border/80">
            <p className="text-foreground font-mono text-xs">{pp.verdictExplanation}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2">
            <div>
              <span className="text-foreground-muted block text-[10px]">GENERATED</span>
              <span className="text-foreground">{formatDate(pp.generatedAt)}</span>
            </div>
            <div>
              <span className="text-foreground-muted block text-[10px]">TEST RUNNER</span>
              <span className="text-foreground capitalize">{pp.environment.runner}</span>
            </div>
            <div>
              <span className="text-foreground-muted block text-[10px]">TOTAL ATTEMPTS</span>
              <span className="text-foreground">{pp.executionEvidence.totalAttempts}</span>
            </div>
            <div>
              <span className="text-foreground-muted block text-[10px]">DURATION</span>
              <span className="text-foreground">{pp.executionEvidence.executionDurationMs}ms</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Target Repository & Environment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent-cyan" />
            2. Environment & Repository Manifest
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 bg-background/50 p-3 rounded border border-border/60">
              <span className="text-foreground-muted block font-semibold">Repository Target:</span>
              <div className="text-foreground">{pp.repository.url}</div>
              <div className="text-accent">Commit SHA: {pp.repository.commitSha}</div>
              <div className="text-foreground-muted">Framework: {pp.repository.testFramework} (Python {pp.environment.pythonVersion})</div>
            </div>

            <div className="space-y-1.5 bg-background/50 p-3 rounded border border-border/60">
              <span className="text-foreground-muted block font-semibold">Execution Isolation:</span>
              <div className="text-foreground">Sandbox: {pp.environment.runner}</div>
              <div className="text-foreground-muted">Operating System: {pp.environment.os}</div>
              <div className="text-foreground-muted">Network: None &bull; Timeout: {pp.environment.timeoutSeconds}s &bull; Mem: {pp.environment.memoryLimitMb}MB</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Generated Reproduction Test */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent" />
            3. Synthesized Reproduction Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs font-mono">
          <div className="flex items-center justify-between text-foreground-muted">
            <span>File: {pp.reproductionTest.filePath}</span>
          </div>
          <pre className="p-4 bg-background rounded border border-border text-foreground-secondary overflow-x-auto text-[11px] leading-relaxed">
            {pp.reproductionTest.sourceCode}
          </pre>
        </CardContent>
      </Card>

      {/* 4. Execution Evidence Output */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-warning" />
            4. Execution Evidence & Traceback Output
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <Badge variant="warning" className="text-[10px]">
              Exit Code: {pp.executionEvidence.lastExitCode}
            </Badge>
            {pp.executionEvidence.capturedAssertions.length > 0 && (
              <span className="text-accent truncate">
                Matched Assertion: {pp.executionEvidence.capturedAssertions[0]}
              </span>
            )}
          </div>
          <pre className="p-4 bg-background rounded border border-border text-foreground overflow-x-auto text-[11px] leading-relaxed whitespace-pre-wrap">
            {pp.executionEvidence.testOutputSanitized}
          </pre>
        </CardContent>
      </Card>

      {/* 5. Replay Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Play className="w-4 h-4 text-accent" />
            5. Replay Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs font-mono">
          <p className="text-foreground-secondary mb-2">
            Run these commands locally to reproduce the defect:
          </p>
          <div className="p-3 bg-background rounded border border-border space-y-1.5 text-accent">
            {pp.replayInstructions.map((step, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="text-foreground-muted select-none">&gt;</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 6. Scope & Limitations */}
      <div className="p-4 rounded-lg border border-border/80 bg-surface/30 text-xs font-mono text-foreground-muted space-y-1.5">
        <span className="font-semibold text-foreground uppercase block text-[10px]">
          Scope & Limitations
        </span>
        {pp.limitations.map((lim, i) => (
          <p key={i}>&bull; {lim}</p>
        ))}
      </div>
    </div>
  );
}
