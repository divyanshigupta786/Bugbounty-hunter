"use client";

import React, { useState } from "react";
import { Cpu, Shield, Clock, Server, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [modelName, setModelName] = useState("qwen2.5-coder:7b");
  const [timeout, setTimeoutSec] = useState("30");
  const [sandboxType, setSandboxType] = useState("auto");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 flex-1 w-full">
      <div className="space-y-1 border-b border-border/80 pb-6">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground">
          System & Engine Settings
        </h1>
        <p className="text-xs sm:text-sm text-foreground-secondary">
          Configure open-weight AI model inference, execution timeouts, and sandbox backend policies.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Model Provider Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Cpu className="w-4 h-4 text-accent" />
              Open-Weight AI Model Inference
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-foreground-muted mb-1.5">
                Ollama Endpoint URL
              </label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent text-xs"
              />
              <span className="text-[10px] text-foreground-muted mt-1 block">
                Local inference endpoint. If unreachable, the engine gracefully uses the deterministic AST analyzer.
              </span>
            </div>

            <div>
              <label className="block text-foreground-muted mb-1.5">
                Model Identifier
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="qwen2.5-coder:7b, deepseek-coder:6.7b, etc."
                className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sandbox & Resource Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent-cyan" />
              Sandbox & Safety Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-foreground-muted mb-1.5">Sandbox Backend</label>
              <select
                value={sandboxType}
                onChange={(e) => setSandboxType(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent text-xs"
              >
                <option value="auto">Auto (Docker when available, else Confined Subprocess)</option>
                <option value="docker">Docker Only (Enforce disposable container)</option>
                <option value="isolated_process">Isolated Subprocess Only</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-foreground-muted mb-1.5">Per-Test Timeout (seconds)</label>
                <input
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeoutSec(e.target.value)}
                  min="5"
                  max="120"
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent text-xs"
                />
              </div>

              <div>
                <label className="block text-foreground-muted mb-1.5">Memory Ceiling</label>
                <input
                  type="text"
                  disabled
                  value="512 MB (Strict Cgroup / Job Limit)"
                  className="w-full px-3 py-2 bg-background/50 border border-border rounded text-foreground-muted text-xs cursor-not-allowed"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-4">
          <div className="text-xs font-mono text-accent">
            {saved && (
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Settings updated successfully
              </span>
            )}
          </div>

          <Button type="submit" variant="primary" className="font-mono text-xs font-bold">
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
