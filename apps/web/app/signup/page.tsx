"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Terminal, Lock, Mail, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "/dashboard";
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 flex-1 flex flex-col justify-center w-full">
      <Card>
        <CardHeader className="text-center space-y-1 pb-4">
          <div className="w-10 h-10 mx-auto rounded bg-surface border border-border flex items-center justify-center text-accent mb-2">
            <Terminal className="w-5 h-5" />
          </div>
          <CardTitle className="text-lg font-heading font-bold">Create BugBounty Account</CardTitle>
          <p className="text-xs text-foreground-muted">
            Start autonomous defect reproduction with verifiable proof packs.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-foreground-muted mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-foreground-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-foreground-muted mb-1.5">Developer Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-foreground-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@example.com"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-foreground-muted mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-foreground-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent text-xs"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full font-mono text-xs font-bold py-2.5 mt-2">
              Create Account <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </form>

          <div className="text-center mt-6 pt-4 border-t border-border/60 text-xs font-mono text-foreground-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
