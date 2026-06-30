import type { ReactNode } from "react";

export function PageHeader({
  title, subtitle, actions,
}: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card-surface p-5 ${className}`}>{children}</div>;
}

export function RiskBadge({ risk }: { risk: "Low" | "Moderate" | "High" }) {
  const map = {
    Low: "bg-success-soft text-success border-success/20",
    Moderate: "bg-warning-soft text-warning border-warning/20",
    High: "bg-destructive-soft text-destructive border-destructive/20",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${map[risk]}`}>
      <span className="size-1.5 rounded-full bg-current" /> {risk} Risk
    </span>
  );
}

export function DiseaseBadge({ name }: { name: string }) {
  const isNormal = name === "Normal";
  return (
    <span className={`inline-flex items-center text-[11.5px] font-medium px-2 py-0.5 rounded-md ${
      isNormal ? "bg-success-soft text-success" : "bg-primary-soft text-primary"
    }`}>
      {name}
    </span>
  );
}
