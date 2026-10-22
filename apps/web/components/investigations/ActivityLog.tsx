import React from "react";
import { Terminal, Shield, Cpu, FileCode, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { InvestigationEvent } from "@bugbounty/shared-types";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface ActivityLogProps {
  events: InvestigationEvent[];
}

export function ActivityLog({ events }: ActivityLogProps) {
  const getToolIcon = (tool?: string) => {
    switch (tool?.toLowerCase()) {
      case "ssrfvalidator":
      case "security":
        return <Shield className="w-3.5 h-3.5 text-accent-cyan" />;
      case "modelprovider":
      case "ollamaprovider":
        return <Cpu className="w-3.5 h-3.5 text-accent" />;
      case "pytestsynthesizer":
      case "deterministiccodesearch":
        return <FileCode className="w-3.5 h-3.5 text-accent-cyan" />;
      case "sandboxrunner":
        return <Terminal className="w-3.5 h-3.5 text-accent" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-foreground-muted" />;
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Terminal className="w-4 h-4 text-accent" />
          Agent Investigation Trace
        </h3>
        <span className="text-xs font-mono text-foreground-muted">
          {events.length} event{events.length === 1 ? "" : "s"} logged
        </span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {events.map((ev) => (
          <div
            key={ev.id || ev.sequenceNumber}
            className={`p-3 rounded border text-xs font-mono transition-colors ${
              ev.isError
                ? "bg-error/10 border-error/30 text-error"
                : "bg-background/60 border-border/60 text-foreground-secondary hover:border-border"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-foreground-muted text-[10px]">#{ev.sequenceNumber}</span>
                {getToolIcon(ev.tool)}
                <span className="font-semibold text-foreground truncate">{ev.action}</span>
                {ev.tool && (
                  <Badge variant="outline" className="text-[9px] py-0 px-1.5">
                    {ev.tool}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 text-[10px] text-foreground-muted">
                {ev.durationMs && <span>{ev.durationMs}ms</span>}
                <span>{formatDate(ev.createdAt)}</span>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-foreground-secondary mb-1">
              {ev.message}
            </p>

            {ev.relevantFiles && ev.relevantFiles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-border/30">
                {ev.relevantFiles.map((f, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-surface px-1.5 py-0.5 rounded text-foreground-muted border border-border/40"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
