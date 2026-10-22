"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Terminal,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  StopCircle,
  Download,
  FileText,
  GitBranch,
  Shield,
  Layers,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { InvestigationDetail } from "@bugbounty/shared-types";
import { fetchInvestigation, cancelInvestigation, retryInvestigation } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timeline } from "@/components/investigations/Timeline";
import { HypothesisCard } from "@/components/investigations/HypothesisCard";
import { TestViewer } from "@/components/investigations/TestViewer";
import { ActivityLog } from "@/components/investigations/ActivityLog";
import { formatDuration, formatDate } from "@/lib/utils";

export default function InvestigationWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<InvestigationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Poll investigation state and listen to live events
  useEffect(() => {
    let isMounted = true;
    let timer: NodeJS.Timeout;

    const poll = async () => {
      try {
        const detail = await fetchInvestigation(id);
        if (isMounted) {
          setData(detail);
          setIsLoading(false);
        }
        // If investigation is still active, poll every 2 seconds
        if (detail && !["COMPLETED", "FAILED", "CANCELLED"].includes(detail.state)) {
          timer = setTimeout(poll, 2000);
        }
      } catch (err) {
        console.error("Failed to load investigation:", err);
      }
    };

    poll();

    // Listen to real-time Server-Sent Events (SSE)
    const eventSource = new EventSource(`/api/v1/investigations/${id}/events`);
    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.state && isMounted) {
          setData((prev) => {
            if (!prev) return prev;
            const existingEvents = prev.events || [];
            const isDuplicate = existingEvents.some((e) => e.sequenceNumber === parsed.sequenceNumber);
            const updatedEvents = isDuplicate ? existingEvents : [...existingEvents, parsed];
            return {
              ...prev,
              state: parsed.state,
              events: updatedEvents,
            };
          });
        }
      } catch {
        // Heartbeat or connection message
      }
    };

    return () => {
      isMounted = false;
      clearTimeout(timer);
      eventSource.close();
    };
  }, [id]);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await cancelInvestigation(id);
      const updated = await fetchInvestigation(id);
      setData(updated);
    } catch (err) {
      console.error("Cancel error:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const retryResult = await retryInvestigation(id);
      router.push(`/investigations/${retryResult.id}`);
    } catch (err) {
      console.error("Retry error:", err);
      setIsRetrying(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex-1 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs text-foreground-muted">
          Loading investigation topology #{id?.slice(0, 8)}...
        </span>
      </div>
    );
  }

  const isTerminal = ["COMPLETED", "FAILED", "CANCELLED"].includes(data.state);
  const lastAttempt = data.attempts && data.attempts.length > 0 ? data.attempts[data.attempts.length - 1] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1 w-full">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-foreground-muted hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-foreground-muted">Investigation #{data.id.slice(0, 8)}</span>
              {data.isDemo && (
                <Badge variant="outline" className="text-[9px] py-0">
                  DEMO MODE
                </Badge>
              )}
            </div>
            <h1 className="font-heading font-bold text-lg sm:text-xl text-foreground truncate max-w-xl">
              {data.bugTitle}
            </h1>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isTerminal && (
            <Button
              size="sm"
              variant="danger"
              onClick={handleCancel}
              isLoading={isCancelling}
              className="font-mono text-xs"
            >
              <StopCircle className="w-3.5 h-3.5 mr-1" />
              Cancel
            </Button>
          )}

          {isTerminal && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              isLoading={isRetrying}
              className="font-mono text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Retry Run
            </Button>
          )}

          {data.proofPack && (
            <Link href={`/investigations/${data.id}/report`}>
              <Button size="sm" variant="primary" className="font-mono text-xs font-bold">
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Proof Pack Report
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Status & Verdict Header Card */}
      <div className="p-4 rounded-lg border border-border bg-surface flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className="text-[10px] font-mono text-foreground-muted block uppercase">Verdict</span>
            <div className="mt-1">
              {data.verdict === "REPRODUCED" && (
                <Badge variant="success" className="text-xs font-bold py-1 px-3">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  REPRODUCED
                </Badge>
              )}
              {data.verdict === "NOT_REPRODUCED" && (
                <Badge variant="default" className="text-xs font-bold py-1 px-3">
                  NOT REPRODUCED
                </Badge>
              )}
              {data.verdict === "INCONCLUSIVE" && (
                <Badge variant="warning" className="text-xs font-bold py-1 px-3">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  INCONCLUSIVE
                </Badge>
              )}
              {!data.verdict && (
                <Badge variant="cyan" className="text-xs font-bold py-1 px-3 animate-pulse">
                  {data.state}
                </Badge>
              )}
            </div>
          </div>

          <div className="border-l border-border/80 pl-4 space-y-0.5 font-mono text-xs">
            <span className="text-[10px] text-foreground-muted block uppercase">Repository Target</span>
            <div className="text-foreground truncate max-w-xs">{data.repositoryUrl}</div>
          </div>

          <div className="border-l border-border/80 pl-4 space-y-0.5 font-mono text-xs">
            <span className="text-[10px] text-foreground-muted block uppercase">Commit SHA</span>
            <div className="text-accent">{data.commitSha.slice(0, 10)}</div>
          </div>

          <div className="border-l border-border/80 pl-4 space-y-0.5 font-mono text-xs">
            <span className="text-[10px] text-foreground-muted block uppercase">Elapsed Time</span>
            <div className="text-foreground">{formatDuration(data.durationMs)}</div>
          </div>
        </div>

        {/* Evidence Artifacts badge */}
        {data.artifacts && data.artifacts.length > 0 && (
          <div className="flex items-center gap-2">
            <a
              href={data.artifacts[0].downloadUrl}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-background hover:border-accent text-xs font-mono text-foreground transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              Download proof_pack.zip
            </a>
          </div>
        )}
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Code, Hypotheses, Test Candidate (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active / Last Test Candidate Execution */}
          {lastAttempt ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-accent" />
                  Candidate Reproduction Test
                </h3>
                <span className="text-xs font-mono text-foreground-muted">
                  Attempt #{lastAttempt.attemptNumber} of {data.attemptBudget}
                </span>
              </div>
              <TestViewer
                testFilePath={lastAttempt.testFilePath}
                testSourceCode={lastAttempt.testSourceCode}
                replayCommand={lastAttempt.testCommand}
                exitCode={lastAttempt.exitCode}
                stdout={lastAttempt.stdout}
                stderr={lastAttempt.stderr}
                durationMs={lastAttempt.durationMs}
              />
            </div>
          ) : (
            <div className="p-8 border border-dashed border-border rounded-lg bg-surface/30 text-center space-y-2">
              <Terminal className="w-8 h-8 mx-auto text-accent-cyan animate-pulse" />
              <h4 className="text-xs font-mono text-foreground">Awaiting Test Synthesis</h4>
              <p className="text-[11px] text-foreground-muted">
                The agent is currently formulating hypotheses and analyzing relevant source files.
              </p>
            </div>
          )}

          {/* Formulated Hypotheses */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-cyan" />
              Formulated Hypotheses ({data.hypotheses?.length || 0})
            </h3>
            {data.hypotheses && data.hypotheses.length > 0 ? (
              <div className="space-y-3">
                {data.hypotheses.map((h, i) => (
                  <HypothesisCard key={h.id || i} hypothesis={h} isSelected={i === 0} />
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-foreground-muted">
                No hypotheses formulated yet.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Reproduction Ladder Timeline & Activity Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Reproduction Ladder Timeline */}
          <Timeline currentState={data.state} events={data.events} />

          {/* Real-time Activity Trace */}
          <ActivityLog events={data.events || []} />
        </div>
      </div>
    </div>
  );
}
