"use client";

import React, { useState } from "react";
import { Copy, Check, Terminal, Play, FileCode, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TestViewerProps {
  testFilePath: string;
  testSourceCode: string;
  replayCommand: string;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  durationMs?: number;
}

export function TestViewer({
  testFilePath,
  testSourceCode,
  replayCommand,
  exitCode,
  stdout,
  stderr,
  durationMs,
}: TestViewerProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "output">("code");

  const copyCode = () => {
    navigator.clipboard.writeText(testSourceCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyCommand = () => {
    navigator.clipboard.writeText(replayCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const isSuccessExecution = exitCode !== undefined;
  const outputText = stdout || stderr || "No output recorded.";

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-background-secondary/80 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs text-foreground">
            <FileCode className="w-3.5 h-3.5 text-accent" />
            <span>{testFilePath}</span>
          </div>

          {exitCode !== undefined && (
            <Badge variant={exitCode === 0 ? "default" : "warning"} className="text-[10px]">
              {exitCode === 0 ? (
                <CheckCircle2 className="w-3 h-3 mr-1 text-[#C8FF4D]" />
              ) : (
                <XCircle className="w-3 h-3 mr-1 text-warning" />
              )}
              Exit: {exitCode} {durationMs ? `(${durationMs}ms)` : ""}
            </Badge>
          )}
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2">
          <div className="flex rounded border border-border p-0.5 bg-background text-xs font-mono">
            <button
              onClick={() => setActiveTab("code")}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === "code" ? "bg-surface text-accent font-semibold" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              Test Source
            </button>
            <button
              onClick={() => setActiveTab("output")}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === "output" ? "bg-surface text-accent font-semibold" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              Execution Log
            </button>
          </div>

          <Button size="sm" variant="outline" onClick={copyCode} className="h-7 text-xs font-mono">
            {copiedCode ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Main Content: Code or Logs */}
      <div className="p-4 bg-background font-mono text-xs overflow-x-auto min-h-[220px] max-h-[360px]">
        {activeTab === "code" ? (
          <pre className="text-foreground-secondary leading-relaxed">
            {testSourceCode.split("\n").map((line, idx) => (
              <div key={idx} className="flex">
                <span className="select-none text-foreground-muted/40 w-8 inline-block text-right pr-3">
                  {idx + 1}
                </span>
                <span className={line.startsWith("def ") ? "text-accent font-semibold" : line.startsWith("import ") ? "text-accent-cyan" : ""}>
                  {line}
                </span>
              </div>
            ))}
          </pre>
        ) : (
          <pre className="text-foreground leading-relaxed whitespace-pre-wrap font-mono">
            {outputText}
          </pre>
        )}
      </div>

      {/* Replay command bar */}
      <div className="px-4 py-3 bg-background-secondary border-t border-border/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Play className="w-3.5 h-3.5 text-accent flex-shrink-0" />
          <span className="text-[11px] font-mono text-foreground-muted flex-shrink-0">Replay:</span>
          <code className="text-xs font-mono text-accent truncate bg-background px-2 py-1 rounded border border-border/50">
            {replayCommand}
          </code>
        </div>
        <Button size="sm" variant="secondary" onClick={copyCommand} className="h-7 text-xs font-mono flex-shrink-0">
          {copiedCmd ? <Check className="w-3.5 h-3.5 text-accent mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
          Copy Command
        </Button>
      </div>
    </div>
  );
}
