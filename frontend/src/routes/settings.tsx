import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sun, Monitor, CheckCircle2, Bell, Lock, User } from "lucide-react";
import { Card, PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — MedAI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <PageHeader title="Settings" subtitle="Manage preferences and system" />

      <Card>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><User className="size-4 text-primary" /> Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Full name" defaultValue="Dr. Mandeep" />
          <Input label="Email" defaultValue="mandeep@medai.dev" />
          <Input label="Role" defaultValue="Radiologist" />
          <Input label="Institution" defaultValue="Delhi Technological University" />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-3">Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
            { id: "system", label: "System", icon: Monitor },
          ].map((t) => (
            <button key={t.id} className="card-surface p-4 hover-lift text-left flex items-center gap-3">
              <div className="size-9 rounded-lg bg-primary-soft text-primary grid place-items-center"><t.icon className="size-4" /></div>
              <div>
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-[11px] text-muted-foreground">{t.id === "system" ? "Match device" : `${t.label} mode`}</div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> System Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {["Backend API", "PostgreSQL Database", "Deep Learning Model", "AI Gateway", "Grad-CAM Service"].map((s) => (
            <div key={s} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <span className="text-sm">{s}</span>
              <span className="text-[11px] font-medium text-success inline-flex items-center gap-1"><span className="size-1.5 rounded-full bg-success" /> Operational</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Bell className="size-4 text-primary" /> Notifications</h3>
        <div className="space-y-2">
          {["New high-risk diagnoses", "Weekly analytics summary", "Model updates"].map((n, i) => (
            <label key={n} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/40">
              <span className="text-sm">{n}</span>
              <input type="checkbox" defaultChecked={i < 2} className="size-4 accent-[var(--primary)]" />
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Lock className="size-4 text-muted-foreground" /> About</h3>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>MedAI v1.0.0 · Build 2026.06.30</div>
          <div>Engine: ChestNet-DL v1.0 · Grad-CAM v2.1</div>
          <div>© 2026 Mandeep · Delhi Technological University</div>
        </div>
      </Card>
    </div>
  );
}

function Input({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wide mb-1.5 block">{label}</span>
      <input defaultValue={defaultValue} className="w-full h-10 rounded-lg bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:bg-card" />
    </label>
  );
}
