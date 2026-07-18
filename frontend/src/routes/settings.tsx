import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Activity, Palette, Bell, Info, Loader2 } from "lucide-react";
import { fetchHealth } from "@/lib/api";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MedAI" },
      { name: "description", content: "Manage MedAI preferences, theme, and backend status." },
    ],
  }),
  component: SettingsPage,
});

type BackendStatus = "checking" | "online" | "offline";

function SettingsPage() {
  // ── Dark mode ──────────────────────────────────────────────
  const [dark, setDark] = useState(() => {
    // Read persisted preference on first render
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("medai_theme");
      return saved ? saved === "dark" : document.documentElement.classList.contains("dark");
    }
    return false;
  });

  const toggleTheme = (v: boolean) => {
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
    localStorage.setItem("medai_theme", v ? "dark" : "light");
  };

  // ── Preferences (persisted) ────────────────────────────────
  const [notif, setNotif] = useState(() => {
    const v = localStorage.getItem("medai_notif");
    return v === null ? true : v === "true";
  });

  const [autoReport, setAutoReport] = useState(() => {
    const v = localStorage.getItem("medai_auto_report");
    return v === null ? false : v === "true";
  });

  const toggleNotif = (v: boolean) => {
    setNotif(v);
    localStorage.setItem("medai_notif", String(v));
  };

  const toggleAutoReport = (v: boolean) => {
    setAutoReport(v);
    localStorage.setItem("medai_auto_report", String(v));
  };

  // ── Real backend health check ──────────────────────────────
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [modelName, setModelName] = useState<string>("EfficientNet-B0");

  const checkHealth = async () => {
    setBackendStatus("checking");
    try {
      const h = await fetchHealth();
      setBackendStatus(h.status === "healthy" ? "online" : "offline");
      if ((h as any).model) setModelName((h as any).model);
    } catch {
      setBackendStatus("offline");
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your MedAI workspace.</p>
      </div>

      {/* Appearance */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="font-display font-semibold">Appearance</h3>
        </div>
        <Row label="Dark mode" hint="Switch to a low-light theme.">
          <Switch checked={dark} onCheckedChange={toggleTheme} />
        </Row>
      </Card>

      {/* Backend Status */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="font-display font-semibold">Backend Status</h3>
          <button
            onClick={checkHealth}
            className="ml-auto text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition"
          >
            Refresh
          </button>
        </div>
        <Row label="Health API" hint="Live check every 30 seconds.">
          {backendStatus === "checking" ? (
            <Badge variant="outline" className="gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Checking…
            </Badge>
          ) : backendStatus === "online" ? (
            <Badge variant="outline" className="gap-1.5 border-[color:var(--success)]/30 bg-[color:var(--success)]/10 text-[color:var(--success)]">
              <span className="h-2 w-2 rounded-full bg-[color:var(--success)]" />Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1.5 border-destructive/30 bg-destructive/10 text-destructive">
              <span className="h-2 w-2 rounded-full bg-destructive" />Offline
            </Badge>
          )}
        </Row>
        <Separator className="my-4" />
        <Row label="Model" hint="Currently deployed.">
          <span className="text-sm font-medium">{modelName}</span>
        </Row>
        <Separator className="my-4" />
        <Row label="API Docs" hint="Interactive Swagger documentation.">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-primary underline underline-offset-2 hover:opacity-80 transition"
          >
            Open Swagger UI ↗
          </a>
        </Row>
      </Card>

      {/* Preferences */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="font-display font-semibold">Preferences</h3>
        </div>
        <Row label="Push notifications" hint="Alert when analysis completes.">
          <Switch checked={notif} onCheckedChange={toggleNotif} />
        </Row>
        <Separator className="my-4" />
        <Row label="Auto-generate report" hint="Create PDF after every prediction.">
          <Switch checked={autoReport} onCheckedChange={toggleAutoReport} />
        </Row>
      </Card>

      {/* Version */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <Info className="h-4 w-4 text-primary" />
          <h3 className="font-display font-semibold">Version</h3>
        </div>
        <Row label="MedAI Frontend" hint="Build date · 2026-07-18"><span className="text-sm font-medium">v1.0.0</span></Row>
        <Separator className="my-4" />
        <Row label="Backend API" hint="FastAPI · PyTorch"><span className="text-sm font-medium">v1.0.0</span></Row>
      </Card>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label className="text-sm">{label}</Label>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}
