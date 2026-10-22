"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Terminal, Shield, Cpu, BookOpen, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchModelsStatus } from "@/lib/api";

export function Navbar() {
  const [modelStatus, setModelStatus] = useState<string>("detecting");

  useEffect(() => {
    fetchModelsStatus()
      .then((data) => {
        const isOllamaOnline = data.providers?.some(
          (p: { id: string; online: boolean }) => p.id === "ollama" && p.online
        );
        setModelStatus(isOllamaOnline ? "Ollama Ready" : "Deterministic Mode");
      })
      .catch(() => setModelStatus("Deterministic Mode"));
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded bg-surface border border-border flex items-center justify-center text-accent group-hover:border-accent transition-colors">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-sm tracking-wider text-foreground uppercase">
              BugBounty<span className="text-accent">Hunter</span>
            </span>
            <span className="text-[10px] font-mono text-foreground-muted tracking-tight">
              AI REPRODUCTION ENGINE
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="text-foreground-secondary hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link href="/#ladder" className="text-foreground-secondary hover:text-foreground transition-colors">
            Reproduction Ladder
          </Link>
          <Link href="/#proof-pack" className="text-foreground-secondary hover:text-foreground transition-colors">
            Proof Pack
          </Link>
          <Link href="/docs" className="text-foreground-secondary hover:text-foreground transition-colors flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Docs
          </Link>
          <Link href="/settings" className="text-foreground-secondary hover:text-foreground transition-colors">
            Settings
          </Link>
        </nav>

        {/* Right CTA and Model Status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono">
            <Badge variant="cyan" className="text-[11px] py-0.5">
              <Cpu className="w-3 h-3 mr-1 text-accent-cyan" />
              {modelStatus}
            </Badge>
          </div>

          <Link href="/investigations/new">
            <Button size="sm" variant="primary" className="font-mono text-xs font-bold">
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              New Investigation
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
