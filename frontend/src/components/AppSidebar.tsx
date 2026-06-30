import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Stethoscope, History, FileText, Brain,
  Bot, BarChart3, Settings, Info, Activity, CircleDot,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/new-diagnosis", label: "New Diagnosis", icon: Stethoscope },
  { to: "/history", label: "Prediction History", icon: History },
  { to: "/reports", label: "Medical Reports", icon: FileText },
  { to: "/explainable-ai", label: "Explainable AI", icon: Brain },
  { to: "/assistant", label: "AI Assistant", icon: Bot },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/about", label: "About", icon: Info },
] as const;

const STATUS = [
  { label: "Backend Connected", ok: true },
  { label: "Deep Learning Model", ok: true },
  { label: "Database Connected", ok: true },
  { label: "AI Assistant Ready", ok: true },
  { label: "System Healthy", ok: true },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden lg:flex h-screen sticky top-0 w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="px-5 pt-6 pb-5">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl gradient-primary grid place-items-center shadow-glow">
            <Activity className="size-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-semibold text-sidebar-foreground leading-tight">MedAI</div>
            <div className="text-[11px] text-sidebar-muted">Radiology Suite</div>
          </div>
        </Link>
      </div>

      <div className="px-3 pb-3">
        <div className="text-[10px] uppercase tracking-wider text-sidebar-muted px-3 pb-2 font-semibold">
          Navigation
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={[
                  "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                  active
                    ? "bg-sidebar-active text-sidebar-active-foreground font-medium"
                    : "text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground",
                ].join(" ")}
              >
                <Icon className="size-[18px]" strokeWidth={active ? 2.25 : 1.75} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-3">
        <div className="card-surface p-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="size-2 rounded-full bg-success animate-pulse-glow" />
            <span className="text-xs font-semibold text-foreground">System Status</span>
          </div>
          <div className="space-y-1.5">
            {STATUS.map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
                <CircleDot className="size-3 text-success" />
                <span className="truncate">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
