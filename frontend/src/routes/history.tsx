import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Download, Eye, FileText, Brain, Trash2 } from "lucide-react";
import { Card, PageHeader, DiseaseBadge, RiskBadge } from "@/components/PageHeader";
import { PREDICTIONS, DISEASES } from "@/lib/mock-data";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Prediction History — MedAI" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("All");

  const filtered = PREDICTIONS.filter((p) => {
    if (filter !== "All" && p.diagnosis !== filter) return false;
    if (q && !`${p.patient} ${p.patientId} ${p.diagnosis}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader
        title="Prediction History"
        subtitle={`${filtered.length} predictions`}
        actions={
          <button className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover text-sm font-medium inline-flex items-center gap-2">
            <Download className="size-4" /> Export CSV
          </button>
        }
      />

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by patient, ID or diagnosis..."
              className="w-full pl-9 h-10 rounded-lg bg-secondary/60 outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["All", ...DISEASES].map((d) => (
              <button key={d} onClick={() => setFilter(d)}
                className={`px-3 h-10 rounded-lg text-xs font-medium transition ${filter === d ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-muted text-muted-foreground"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/40">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Diagnosis</th>
                <th className="py-3 px-4 w-48">Confidence</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                  <td className="py-3 px-4 text-muted-foreground tabular-nums text-xs">{new Date(p.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium">{p.patient}</div>
                    <div className="text-[11px] text-muted-foreground">{p.patientId} · {p.age}y · {p.gender}</div>
                  </td>
                  <td className="py-3 px-4"><DiseaseBadge name={p.diagnosis} /></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full gradient-primary" style={{ width: `${p.confidence * 100}%` }} />
                      </div>
                      <span className="tabular-nums text-xs font-medium w-10 text-right">{(p.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4"><RiskBadge risk={p.risk} /></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn title="View"><Eye className="size-3.5" /></IconBtn>
                      <IconBtn title="Report"><FileText className="size-3.5" /></IconBtn>
                      <IconBtn title="Explainable AI"><Brain className="size-3.5" /></IconBtn>
                      <IconBtn title="Delete" danger><Trash2 className="size-3.5" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function IconBtn({ children, danger, title }: { children: React.ReactNode; danger?: boolean; title: string }) {
  return (
    <button title={title} className={`size-8 grid place-items-center rounded-md hover:bg-secondary transition ${danger ? "text-destructive hover:bg-destructive-soft" : "text-muted-foreground hover:text-foreground"}`}>
      {children}
    </button>
  );
}
