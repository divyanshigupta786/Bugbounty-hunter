import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "cyan" | "outline";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-surface text-foreground-secondary border-border",
    success: "bg-[#C8FF4D]/10 text-[#C8FF4D] border-[#C8FF4D]/30",
    cyan: "bg-[#50E6FF]/10 text-[#50E6FF] border-[#50E6FF]/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    error: "bg-error/10 text-error border-error/30",
    outline: "bg-transparent text-foreground-muted border-border",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
