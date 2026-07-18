import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Download, Trash2, Eye, FileImage, X, Loader2, RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { fetchHistory, deleteHistoryItem, assetUrl } from "@/lib/api";
import type { HistoryItem } from "@/lib/types";
import { riskColor } from "@/lib/mock-data";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Prediction History — MedAI" },
      { name: "description", content: "Browse and manage previous chest X-ray analyses." },
    ],
  }),
  component: HistoryPage,
});

type RiskStr = "Low" | "Moderate" | "High" | "Critical";

function getRisk(item: HistoryItem): RiskStr {
  const r = item.prediction.risk_level as RiskStr;
  return ["Low", "Moderate", "High", "Critical"].includes(r) ? r : "Low";
}

function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHistory(200);
      setItems(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load history";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter((p) => {
    const matchQ = !q || p.patient.patient_name.toLowerCase().includes(q.toLowerCase());
    const matchF = filter === "all" || p.prediction.diagnosis === filter;
    return matchQ && matchF;
  }), [items, q, filter]);

  const remove = async (id: string) => {
    try {
      await deleteHistoryItem(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
      toast.success("Prediction removed");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const openReport = (item: HistoryItem) => {
    if (!item.report_path) { toast.error("No report available for this prediction"); return; }
    window.open(assetUrl(item.report_path), "_blank");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Prediction History</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${items.length} analyses saved to your workspace.`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="rounded-xl">
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by patient name" className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All diagnoses</SelectItem>
            <SelectItem value="Normal">Normal</SelectItem>
            <SelectItem value="Pneumonia">Pneumonia</SelectItem>
            <SelectItem value="Tuberculosis">Tuberculosis</SelectItem>
            <SelectItem value="Coronavirus Disease">Coronavirus Disease</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && !loading && (
        <Card className="p-12 text-center shadow-card border-destructive/30">
          <p className="font-medium text-destructive">Failed to load history</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={load}>Retry</Button>
        </Card>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Card className="p-12 text-center shadow-card">
          <FileImage className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">No predictions found</p>
          <p className="text-sm text-muted-foreground">
            {items.length === 0
              ? "Run your first analysis on the Analyze page."
              : "Try adjusting search or filters."}
          </p>
        </Card>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => {
            const risk = getRisk(p);
            const gradcam = p.gradcam_path
              ? p.gradcam_path.startsWith("http")
                ? p.gradcam_path
                : assetUrl(p.gradcam_path)
              : null;
            return (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="p-4 shadow-card hover:-translate-y-0.5 transition-transform overflow-hidden">
                  {/* Thumbnail */}
                  <div className="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white/80 mb-4">
                    {gradcam ? (
                      <img src={gradcam} alt="Grad-CAM" className="h-full w-full object-cover" />
                    ) : (
                      <FileImage className="h-10 w-10 opacity-70" />
                    )}
                    <Badge
                      variant="outline"
                      className={`absolute top-2 right-2 ${riskColor(risk)}`}
                    >
                      {risk}
                    </Badge>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{p.patient.patient_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.patient.age}y · {p.patient.gender}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Diagnosis</p>
                      <p className="font-medium">{p.prediction.diagnosis}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <p className="tabular-nums font-medium">
                        {p.prediction.confidence.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" className="flex-1" variant="outline" onClick={() => setSelected(p)}>
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openReport(p)} disabled={!p.report_path}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(p._id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display">{selected.patient.patient_name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <section className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Age" value={`${selected.patient.age} years`} />
                  <Info label="Gender" value={selected.patient.gender} />
                  <Info label="Date" value={new Date(selected.created_at).toLocaleString()} />
                  <Info
                    label="Risk"
                    value={
                      <Badge variant="outline" className={riskColor(getRisk(selected))}>
                        {getRisk(selected)}
                      </Badge>
                    }
                  />
                </section>

                <section>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Diagnosis</p>
                  <p className="font-display text-2xl font-semibold mt-1">{selected.prediction.diagnosis}</p>
                  {selected.prediction.predicted_class && selected.prediction.predicted_class !== selected.prediction.diagnosis && (
                    <p className="text-sm text-muted-foreground">
                      Model class: <span className="font-medium text-foreground">{selected.prediction.predicted_class}</span>
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Confidence · {selected.prediction.confidence.toFixed(1)}%
                  </p>
                </section>

                {/* GradCAM preview */}
                <section className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-900 h-40 flex items-center justify-center text-white/60 text-xs overflow-hidden">
                    <FileImage className="h-8 w-8 opacity-50" />
                  </div>
                  <div className="rounded-xl overflow-hidden h-40 bg-slate-900">
                    {selected.gradcam_path ? (
                      <img
                        src={selected.gradcam_path.startsWith("http") ? selected.gradcam_path : assetUrl(selected.gradcam_path)}
                        alt="Grad-CAM"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-white/60 text-xs">
                        No Grad-CAM
                      </div>
                    )}
                  </div>
                </section>

                {(selected.prediction.bacterial_probability != null || selected.prediction.viral_probability != null) && (
                  <section className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
                    <p className="font-medium mb-2">Pneumonia Subtype</p>
                    <div className="flex gap-6">
                      <span>Bacterial: <strong>{(selected.prediction.bacterial_probability ?? 0).toFixed(1)}%</strong></span>
                      <span>Viral: <strong>{(selected.prediction.viral_probability ?? 0).toFixed(1)}%</strong></span>
                    </div>
                  </section>
                )}

                <section>
                  <p className="text-sm font-medium mb-2">Recommendation</p>
                  <p className="text-sm text-muted-foreground">{selected.prediction.recommendation}</p>
                </section>

                <Button
                  className="w-full bg-gradient-primary text-primary-foreground rounded-xl"
                  onClick={() => openReport(selected)}
                  disabled={!selected.report_path}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {selected.report_path ? "Download Medical Report" : "No Report Available"}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
