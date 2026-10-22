"use client";

import React from "react";
import { CheckCircle2, Circle, AlertCircle, Clock, Loader2 } from "lucide-react";
import { InvestigationState } from "@bugbounty/shared-types";
import { cn } from "@/lib/utils";

interface TimelineProps {
  currentState: InvestigationState;
  events?: Array<{
    state: InvestigationState;
    action: string;
    durationMs?: number;
    isError?: boolean;
  }>;
}

const LADDER_STAGES = [
  { key: "VALIDATING", label: "Input & Security Validation" },
  { key: "PREPARING", label: "Repository & Baseline Check" },
  { key: "ANALYZING", label: "Static Code Analysis" },
  { key: "HYPOTHESIZING", label: "Hypothesis Formulation" },
  { key: "GENERATING_TEST", label: "Candidate Test Synthesis" },
  { key: "EXECUTING_TEST", label: "Isolated Sandbox Execution" },
  { key: "EVALUATING_EVIDENCE", label: "Execution Evidence Evaluation" },
  { key: "REPORTING", label: "Proof Pack Packaging" },
  { key: "COMPLETED", label: "Investigation Finalized" },
];

export function Timeline({ currentState, events = [] }: TimelineProps) {
  const currentIndex = LADDER_STAGES.findIndex((s) => s.key === currentState);
  const isFailed = currentState === "FAILED";
  const isCancelled = currentState === "CANCELLED";

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent" />
          The Reproduction Ladder
        </h3>
        <span className="text-xs font-mono text-foreground-muted">
          State: <span className="text-accent">{currentState}</span>
        </span>
      </div>

      <div className="space-y-3">
        {LADDER_STAGES.map((stage, idx) => {
          const isCurrent = stage.key === currentState;
          const isPassed = currentIndex > idx || currentState === "COMPLETED";
          const stageEvents = events.filter((e) => e.state === stage.key);
          const hasError = stageEvents.some((e) => e.isError) || (isCurrent && isFailed);

          return (
            <div key={stage.key} className="flex items-start gap-3 group">
              {/* Status Indicator Icon */}
              <div className="mt-0.5">
                {hasError ? (
                  <AlertCircle className="w-4 h-4 text-error" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-accent animate-spin" />
                ) : isPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-[#C8FF4D]" />
                ) : (
                  <Circle className="w-4 h-4 text-foreground-muted/40" />
                )}
              </div>

              {/* Stage Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-mono font-medium transition-colors",
                      isCurrent
                        ? "text-accent font-semibold"
                        : isPassed
                        ? "text-foreground"
                        : "text-foreground-muted"
                    )}
                  >
                    {idx + 1}. {stage.label}
                  </span>
                  {stageEvents.length > 0 && stageEvents[0].durationMs && (
                    <span className="text-[10px] font-mono text-foreground-muted">
                      {stageEvents[0].durationMs}ms
                    </span>
                  )}
                </div>

                {/* Sub-action notes if available */}
                {stageEvents.length > 0 && (
                  <p className="text-[11px] text-foreground-secondary truncate mt-0.5 font-mono">
                    {stageEvents[stageEvents.length - 1].action}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
