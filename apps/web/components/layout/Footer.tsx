import React from "react";
import Link from "next/link";
import { Terminal, Shield, GitBranch, FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/80 bg-background-secondary py-12 text-sm text-foreground-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-surface border border-border flex items-center justify-center text-accent">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <span className="font-heading font-bold text-sm tracking-wider text-foreground">
              BugBounty Hunter
            </span>
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Every bug has a story. Every claim needs proof. Autonomous bug reproduction and evidence generation for developers.
          </p>
          <div className="text-xs font-mono text-accent">
            MIT Licensed &bull; Open-Source AI Tooling
          </div>
        </div>

        <div>
          <h4 className="font-mono text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            Product
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Workspace Dashboard
              </Link>
            </li>
            <li>
              <Link href="/investigations/new" className="hover:text-foreground transition-colors">
                Start Investigation
              </Link>
            </li>
            <li>
              <Link href="/#ladder" className="hover:text-foreground transition-colors">
                The Reproduction Ladder
              </Link>
            </li>
            <li>
              <Link href="/#proof-pack" className="hover:text-foreground transition-colors">
                Proof Pack Specifications
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-mono text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            Resources & AI
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/docs" className="hover:text-foreground transition-colors">
                Documentation & Guides
              </Link>
            </li>
            <li>
              <Link href="/llms.txt" className="hover:text-foreground transition-colors">
                /llms.txt (AI Discovery)
              </Link>
            </li>
            <li>
              <Link href="/llms-full.txt" className="hover:text-foreground transition-colors">
                /llms-full.txt
              </Link>
            </li>
            <li>
              <a
                href="http://127.0.0.1:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors"
              >
                FastAPI OpenAPI Docs
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-mono text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            Security & Trust
          </h4>
          <p className="text-xs text-foreground-muted leading-relaxed mb-3">
            BugBounty Hunter operates exclusively on authorized repositories within isolated, unprivileged sandboxes with disabled networking.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-foreground font-mono">
            <Shield className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Isolated Runner Active</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 mt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between text-xs text-foreground-muted gap-4">
        <div>&copy; {new Date().getFullYear()} BugBounty Hunter Contributors.</div>
        <div className="flex items-center gap-6">
          <Link href="/docs#security" className="hover:text-foreground">Security Policy</Link>
          <Link href="/docs#contributing" className="hover:text-foreground">Contributing</Link>
          <Link href="/docs#limits" className="hover:text-foreground">Execution Limits</Link>
        </div>
      </div>
    </footer>
  );
}
