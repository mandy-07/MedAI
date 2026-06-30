import { createFileRoute } from "@tanstack/react-router";
import {
  Moon,
  Sun,
  Monitor,
  CheckCircle2,
  Info,
  Cpu,
  Database,
  BrainCircuit,
} from "lucide-react";
import { Card, PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — MedAI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <PageHeader
        title="Settings"
        subtitle="Configure MedAI appearance, backend services, and application information."
      />

      {/* Appearance */}
      <Card>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Sun className="size-4 text-primary" />
          Appearance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: "light",
              label: "Light",
              description: "Use light theme",
              icon: Sun,
            },
            {
              id: "dark",
              label: "Dark",
              description: "Use dark theme",
              icon: Moon,
            },
            {
              id: "system",
              label: "System",
              description: "Match device settings",
              icon: Monitor,
            },
          ].map((theme) => (
            <button
              key={theme.id}
              className="card-surface p-4 hover-lift text-left flex items-center gap-3 transition-all"
            >
              <div className="size-10 rounded-lg bg-primary-soft text-primary grid place-items-center">
                <theme.icon className="size-5" />
              </div>

              <div>
                <div className="text-sm font-semibold">{theme.label}</div>
                <div className="text-xs text-muted-foreground">
                  {theme.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Backend Status */}
      <Card>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="size-4 text-success" />
          Backend Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              name: "FastAPI Backend",
              icon: Cpu,
            },
            {
              name: "MongoDB Database",
              icon: Database,
            },
            {
              name: "Deep Learning Model",
              icon: BrainCircuit,
            },
            {
              name: "Grad-CAM Service",
              icon: Cpu,
            },
            {
              name: "Groq AI Assistant",
              icon: BrainCircuit,
            },
          ].map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between rounded-xl bg-secondary/50 border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <service.icon className="size-4 text-primary" />

                <span className="text-sm font-medium">{service.name}</span>
              </div>

              <span className="inline-flex items-center gap-2 text-success text-xs font-semibold">
                <span className="size-2 rounded-full bg-success animate-pulse"></span>
                Online
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* User Preferences */}
      <Card>
        <h3 className="text-sm font-semibold mb-4">
          User Preferences
        </h3>

        <div className="space-y-3">
          <Preference
            title="Enable Smooth Animations"
            subtitle="Use animated transitions throughout the application."
          />

          <Preference
            title="Show Confidence Scores"
            subtitle="Display confidence percentages for every prediction."
          />

          <Preference
            title="Display Grad-CAM Heatmaps"
            subtitle="Automatically show explainability visualizations."
          />

          <Preference
            title="Save Prediction History"
            subtitle="Store previous analyses for future reference."
          />
        </div>
      </Card>

      {/* Version Information */}
      <Card>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Info className="size-4 text-primary" />
          Version Information
        </h3>

        <div className="space-y-2 text-sm">
          <InfoRow title="Application" value="MedAI v1.0.0" />
          <InfoRow title="Prediction Engine" value="Deep Learning Model v1.0" />
          <InfoRow title="Explainability" value="Grad-CAM v2.1" />
          <InfoRow title="Frontend" value="React + TypeScript + Vite" />
          <InfoRow title="Backend" value="FastAPI + PyTorch" />
        </div>
      </Card>

      {/* System Information */}
      <Card>
        <h3 className="text-sm font-semibold mb-4">
          System Information
        </h3>

        <div className="space-y-2 text-sm">
          <InfoRow title="Developer" value="Mandeep" />
          <InfoRow title="Program" value="B.Tech Software Engineering" />
          <InfoRow title="University" value="Delhi Technological University" />
          <InfoRow title="Academic Session" value="2023 – 2027" />
          <InfoRow title="Project" value="MedAI – AI Chest X-ray Diagnosis System" />
        </div>
      </Card>
    </div>
  );
}

function Preference({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-4 cursor-pointer hover:bg-secondary/60 transition-colors">
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>

      <input
        type="checkbox"
        defaultChecked
        className="size-4 accent-[var(--primary)]"
      />
    </label>
  );
}

function InfoRow({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-none">
      <span className="text-muted-foreground">{title}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}