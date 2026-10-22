import React from "react";
import { Hypothesis } from "@bugbounty/shared-types";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, CheckCircle, FileCode } from "lucide-react";

interface HypothesisCardProps {
  hypothesis: Hypothesis;
  isSelected?: boolean;
}

export function HypothesisCard({ hypothesis, isSelected }: HypothesisCardProps) {
  const isConfirmed = hypothesis.verifiedState === "CONFIRMED";

  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${
        isSelected
          ? "border-accent bg-accent/5"
          : isConfirmed
          ? "border-[#C8FF4D]/40 bg-surface"
          : "border-border bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          {isConfirmed ? (
            <CheckCircle className="w-4 h-4 text-accent" />
          ) : (
            <HelpCircle className="w-4 h-4 text-accent-cyan" />
          )}
          <h4 className="text-sm font-semibold text-foreground tracking-tight">
            #{hypothesis.orderIndex} {hypothesis.title}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isConfirmed ? "success" : "cyan"} className="text-[10px]">
            {hypothesis.verifiedState || "UNTESTED"}
          </Badge>
          <span className="text-[11px] font-mono text-foreground-muted">
            Est. Conf: {Math.round(hypothesis.confidenceEstimate * 100)}%
          </span>
        </div>
      </div>

      <p className="text-xs text-foreground-secondary mb-3 leading-relaxed">
        {hypothesis.description}
      </p>

      <div className="space-y-1.5 text-xs font-mono bg-background/50 p-2.5 rounded border border-border/50">
        <div className="flex items-center gap-2 text-foreground-muted">
          <FileCode className="w-3.5 h-3.5 text-accent" />
          <span>
            Target: <span className="text-foreground">{hypothesis.targetFile}</span>
            {hypothesis.targetSymbol && ` (${hypothesis.targetSymbol})`}
          </span>
        </div>
        <div className="text-foreground-secondary text-[11px]">
          <span className="text-foreground-muted">Cause:</span> {hypothesis.suspectedCause}
        </div>
      </div>
    </div>
  );
}
