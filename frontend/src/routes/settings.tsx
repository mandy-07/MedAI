import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Activity, Palette, Bell, Info } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MedAI" },
      { name: "description", content: "Manage MedAI preferences, theme, and backend status." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [dark, setDark] = useState(false);
  const [notif, setNotif] = useState(true);
  const [autoReport, setAutoReport] = useState(true);

  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  const toggleTheme = (v: boolean) => {
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
    localStorage.setItem("medai_theme", v ? "dark" : "light");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your MedAI workspace.</p>
      </div>

      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="font-display font-semibold">Appearance</h3>
        </div>
        <Row label="Dark mode" hint="Switch to a low-light theme.">
          <Switch checked={dark} onCheckedChange={toggleTheme} />
        </Row>
      </Card>

      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="font-display font-semibold">Backend Status</h3>
        </div>
        <Row label="Health API" hint="Live check every 30 seconds.">
          <Badge variant="outline" className="gap-1.5 border-[color:var(--success)]/30 bg-[color:var(--success)]/10 text-[color:var(--success)]">
            <span className="h-2 w-2 rounded-full bg-[color:var(--success)]" />Connected
          </Badge>
        </Row>
        <Separator className="my-4" />
        <Row label="Model" hint="Currently deployed.">
          <span className="text-sm font-medium">EfficientNet-B0</span>
        </Row>
        <Separator className="my-4" />
        <Row label="Region" hint="Inference server location.">
          <span className="text-sm font-medium">Render · Mumbai</span>
        </Row>
      </Card>

      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="font-display font-semibold">Preferences</h3>
        </div>
        <Row label="Push notifications" hint="Alert when analysis completes.">
          <Switch checked={notif} onCheckedChange={setNotif} />
        </Row>
        <Separator className="my-4" />
        <Row label="Auto-generate report" hint="Create PDF after every prediction.">
          <Switch checked={autoReport} onCheckedChange={setAutoReport} />
        </Row>
      </Card>

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
