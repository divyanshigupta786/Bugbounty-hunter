"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Sparkles, Terminal, ArrowRight, AlertCircle, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createInvestigation } from "@/lib/api";

export default function NewInvestigationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    repositoryUrl: "sample-buggy-repo",
    bugTitle: "",
    description: "",
    expectedBehavior: "",
    actualBehavior: "",
    commitSha: "HEAD",
    branch: "main",
    attemptBudget: 3,
    timeBudgetSeconds: 300,
    modelProvider: "ollama",
    isDemo: false,
  });

  const loadSampleBug = () => {
    setFormData({
      repositoryUrl: "sample-buggy-repo",
      bugTitle: "parse_chunk_header crashes with unhandled struct.error on short/truncated chunk data",
      description: "When an image payload with a truncated chunk (less than 8 bytes) is parsed, parse_chunk_header fails with an unhandled struct.error ('unpack requires a buffer of 8 bytes') instead of raising ImageValidationError.",
      expectedBehavior: "Should gracefully catch unpack buffer failures and raise ImageValidationError('Truncated chunk header').",
      actualBehavior: "struct.error: unpack requires a buffer of 8 bytes causes unhandled process crash.",
      commitSha: "HEAD",
      branch: "main",
      attemptBudget: 3,
      timeBudgetSeconds: 300,
      modelProvider: "ollama",
      isDemo: true,
    });
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bugTitle || !formData.description) {
      setErrorMsg("Please provide a bug title and description.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const result = await createInvestigation(formData);
      router.push(`/investigations/${result.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start investigation");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 flex-1 w-full">
      {/* Page Title */}
      <div className="space-y-2 border-b border-border/80 pb-6">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
          Launch New Investigation
        </h1>
        <p className="text-xs sm:text-sm text-foreground-secondary">
          Configure target repository and issue report. The agent will execute candidate tests in an isolated sandbox.
        </p>
      </div>

      {/* Preset Banner */}
      <div className="p-4 rounded-lg border border-accent/30 bg-accent/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-accent">
            <Sparkles className="w-4 h-4" />
            CONTROLLED FIXTURE READY
          </div>
          <p className="text-xs text-foreground-secondary">
            Test the agent against our bundled fixture repository with deliberate edge-case bug (Issue #42).
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={loadSampleBug} className="font-mono text-xs flex-shrink-0">
          Load Sample Buggy Fixture
        </Button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded bg-error/10 border border-error/30 text-error text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <FileCode className="w-4 h-4 text-accent" />
              1. Target Repository
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-foreground-muted mb-1.5">
                Repository URL or Fixture Name
              </label>
              <input
                type="text"
                value={formData.repositoryUrl}
                onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
                placeholder="https://github.com/org/repo.git or sample-buggy-repo"
                required
                className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent text-xs"
              />
              <span className="text-[10px] text-foreground-muted mt-1 block">
                Use `sample-buggy-repo` to run against the verified local fixture without network access.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-foreground-muted mb-1.5">Commit SHA (optional)</label>
                <input
                  type="text"
                  value={formData.commitSha}
                  onChange={(e) => setFormData({ ...formData, commitSha: e.target.value })}
                  placeholder="HEAD or exact commit hash"
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent text-xs"
                />
              </div>

              <div>
                <label className="block text-foreground-muted mb-1.5">Branch</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="main"
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-accent-cyan" />
              2. Bug Report & Symptoms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-foreground-muted mb-1.5">Bug Title</label>
              <input
                type="text"
                value={formData.bugTitle}
                onChange={(e) => setFormData({ ...formData, bugTitle: e.target.value })}
                placeholder="e.g. parse_chunk_header crashes with struct.error on truncated data"
                required
                className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent text-xs"
              />
            </div>

            <div>
              <label className="block text-foreground-muted mb-1.5">Detailed Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what occurs, stack traces, input payloads, and unexpected behavior..."
                required
                className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent text-xs leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-foreground-muted mb-1.5">Expected Behavior</label>
                <input
                  type="text"
                  value={formData.expectedBehavior}
                  onChange={(e) => setFormData({ ...formData, expectedBehavior: e.target.value })}
                  placeholder="Graceful error or expected output"
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent text-xs"
                />
              </div>

              <div>
                <label className="block text-foreground-muted mb-1.5">Actual Behavior / Traceback</label>
                <input
                  type="text"
                  value={formData.actualBehavior}
                  onChange={(e) => setFormData({ ...formData, actualBehavior: e.target.value })}
                  placeholder="Crash, unhandled exception, or incorrect result"
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="p-4 rounded-lg border border-border/80 bg-surface/40 flex items-start gap-3">
          <Shield className="w-5 h-5 text-accent-cyan flex-shrink-0 mt-0.5" />
          <div className="text-xs text-foreground-secondary space-y-1">
            <span className="font-semibold text-foreground block font-mono">Sandbox Execution Policy</span>
            <p>
              Tests will be compiled and executed inside a disposable container or confined process with network disabled. Host secrets and credentials are completely purged.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="submit"
            size="lg"
            variant="primary"
            isLoading={isSubmitting}
            className="font-mono font-bold"
          >
            Start Autonomous Reproduction
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
}
