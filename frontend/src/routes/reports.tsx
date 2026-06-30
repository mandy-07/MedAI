import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Eye, Printer, Trash2, FileText, X } from "lucide-react";
import { Card, PageHeader, DiseaseBadge, RiskBadge } from "@/components/PageHeader";
import { PREDICTIONS, type Prediction } from "@/lib/mock-data";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Medical Reports — MedAI" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const [preview, setPreview] = useState<Prediction | null>(null);
  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader title="Medical Reports" subtitle="Generated AI medical reports" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {PREDICTIONS.slice(0, 12).map((p) => (
          <div key={p.id} className="card-surface hover-lift overflow-hidden flex flex-col">
            <div className="aspect-[4/3] bg-gradient-to-br from-secondary to-muted relative grid place-items-center">
              <div className="absolute inset-3 rounded-md border-2 border-dashed border-border opacity-50" />
              <FileText className="size-10 text-muted-foreground" />
              <div className="absolute top-2 right-2"><RiskBadge risk={p.risk} /></div>
            </div>
            <div className="p-4 flex flex-col gap-2 flex-1">
              <div>
                <div className="text-sm font-semibold truncate">{p.patient}</div>
                <div className="text-[11px] text-muted-foreground">{p.patientId} · {new Date(p.date).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center justify-between">
                <DiseaseBadge name={p.diagnosis} />
                <span className="text-xs font-medium tabular-nums">{(p.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="grid grid-cols-4 gap-1 mt-auto pt-2">
                <Btn onClick={() => setPreview(p)} title="Preview"><Eye className="size-3.5" /></Btn>
                <Btn title="Download"><Download className="size-3.5" /></Btn>
                <Btn title="Print"><Printer className="size-3.5" /></Btn>
                <Btn title="Delete" danger><Trash2 className="size-3.5" /></Btn>
              </div>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4 animate-fade-in" onClick={() => setPreview(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl shadow-elevated max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
              <h3 className="font-semibold">Medical Report — {preview.id}</h3>
              <button onClick={() => setPreview(null)} className="size-8 grid place-items-center rounded-md hover:bg-secondary"><X className="size-4" /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <div className="text-xs text-muted-foreground">Patient</div>
                  <div className="font-semibold">{preview.patient}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Report ID</div>
                  <div className="font-mono text-xs">{preview.id}</div>
                </div>
              </div>
              <Row label="Patient ID" value={preview.patientId} />
              <Row label="Age / Gender" value={`${preview.age}y / ${preview.gender}`} />
              <Row label="Date" value={new Date(preview.date).toLocaleString()} />
              <Row label="Diagnosis" value={preview.diagnosis} />
              <Row label="Confidence" value={`${(preview.confidence * 100).toFixed(2)}%`} />
              <Row label="Risk Level" value={preview.risk} />
              <div>
                <div className="text-xs text-muted-foreground mb-2">AI Findings</div>
                <p className="leading-relaxed">
                  The chest X-ray demonstrates findings consistent with <strong>{preview.diagnosis}</strong>.
                  Model confidence is {(preview.confidence * 100).toFixed(1)}%. Recommend clinical correlation
                  and further investigation as indicated. This AI output is decision-support and is not a
                  substitute for a qualified radiologist's review.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-medium text-sm">{value}</span>
    </div>
  );
}

function Btn({ children, onClick, title, danger }: { children: React.ReactNode; onClick?: () => void; title: string; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title} className={`h-8 rounded-md grid place-items-center text-xs font-medium transition ${danger ? "bg-destructive-soft text-destructive hover:bg-destructive hover:text-destructive-foreground" : "bg-secondary hover:bg-primary-soft hover:text-primary"}`}>
      {children}
    </button>
  );
}
