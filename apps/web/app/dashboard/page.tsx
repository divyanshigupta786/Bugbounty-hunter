"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Terminal,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { InvestigationSummary } from "@bugbounty/shared-types";
import { fetchInvestigations } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDate, formatDuration } from "@/lib/utils";

export default function DashboardPage() {
  const [investigations, setInvestigations] = useState<InvestigationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterVerdict, setFilterVerdict] = useState<string>("ALL");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchInvestigations(search || undefined);
        setInvestigations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [search]);

  const filtered = investigations.filter((inv) => {
    if (filterVerdict === "ALL") return true;
    return inv.verdict === filterVerdict;
  });

  const reproducedCount = investigations.filter((i) => i.verdict === "REPRODUCED").length;
  const inconclusiveCount = investigations.filter((i) => i.verdict === "INCONCLUSIVE").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1 w-full">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
            Investigation Workspace
          </h1>
          <p className="text-xs sm:text-sm text-foreground-secondary mt-1">
            Real-time bug reproduction traces, sandbox telemetry, and evidence packs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadData} className="font-mono text-xs">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link href="/investigations/new">
            <Button size="sm" variant="primary" className="font-mono text-xs font-bold">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              New Investigation
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-surface/50">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-mono text-foreground-muted uppercase">Total Investigations</span>
            <div className="text-xl font-bold font-mono text-foreground">{investigations.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-surface/50">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-mono text-foreground-muted uppercase">Reproduced Bugs</span>
            <div className="text-xl font-bold font-mono text-accent">{reproducedCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-surface/50">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-mono text-foreground-muted uppercase">Inconclusive / Setup</span>
            <div className="text-xl font-bold font-mono text-warning">{inconclusiveCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-surface/50">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-mono text-foreground-muted uppercase">Active Sandbox</span>
            <div className="text-xl font-bold font-mono text-accent-cyan">Process / Docker</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search bug title or repo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono">
          <span className="text-foreground-muted">Filter:</span>
          {["ALL", "REPRODUCED", "NOT_REPRODUCED", "INCONCLUSIVE"].map((v) => (
            <button
              key={v}
              onClick={() => setFilterVerdict(v)}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterVerdict === v
                  ? "bg-accent text-background font-bold"
                  : "bg-surface text-foreground-secondary hover:text-foreground border border-border"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Investigations Table / Cards */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-lg bg-surface/20 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-surface border border-border flex items-center justify-center text-foreground-muted">
            <Terminal className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">No investigations found</h3>
            <p className="text-xs text-foreground-muted">
              Get started by launching an investigation on our sample buggy repository.
            </p>
          </div>
          <Link href="/investigations/new">
            <Button size="sm" variant="primary" className="font-mono text-xs">
              Launch Sample Buggy Repo Test
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => (
            <div
              key={inv.id}
              className="p-4 rounded-lg border border-border bg-surface hover:border-border/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] text-foreground-muted">#{inv.id.slice(0, 8)}</span>
                  {inv.isDemo && (
                    <Badge variant="outline" className="text-[9px] py-0">
                      DEMO FIXTURE
                    </Badge>
                  )}
                  {inv.verdict === "REPRODUCED" && (
                    <Badge variant="success" className="text-[10px]">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      REPRODUCED
                    </Badge>
                  )}
                  {inv.verdict === "NOT_REPRODUCED" && (
                    <Badge variant="default" className="text-[10px]">
                      NOT REPRODUCED
                    </Badge>
                  )}
                  {inv.verdict === "INCONCLUSIVE" && (
                    <Badge variant="warning" className="text-[10px]">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      INCONCLUSIVE
                    </Badge>
                  )}
                  {!inv.verdict && (
                    <Badge variant="cyan" className="text-[10px] animate-pulse">
                      {inv.state}
                    </Badge>
                  )}
                </div>

                <Link href={`/investigations/${inv.id}`} className="block group">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                    {inv.bugTitle}
                  </h3>
                </Link>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-foreground-muted">
                  <span>Repo: <span className="text-foreground-secondary">{inv.repositoryUrl}</span></span>
                  <span>Commit: <span className="text-foreground-secondary">{inv.commitSha.slice(0, 10)}</span></span>
                  {inv.durationMs && <span>Duration: {formatDuration(inv.durationMs)}</span>}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[11px] font-mono text-foreground-muted hidden sm:inline">
                  {formatDate(inv.createdAt)}
                </span>
                <Link href={`/investigations/${inv.id}`}>
                  <Button size="sm" variant="secondary" className="font-mono text-xs">
                    Workspace
                    <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
