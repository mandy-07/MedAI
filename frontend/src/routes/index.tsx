import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Activity, ScanLine, FileText, TrendingUp, ArrowRight, ArrowUpRight, Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { riskColor } from "@/lib/mock-data";
import { fetchHistory, fetchHealth } from "@/lib/api";
import type { HistoryItem } from "@/lib/types";
import heroImg from "@/assets/hero-xray.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — MedAI" },
      { name: "description", content: "MedAI dashboard: analyze chest X-rays, view history and monitor AI backend status." },
    ],
  }),
  component: Dashboard,
});

function useCounter(target: number, duration = 1200) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf: number; const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.floor(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

function Stat({
  icon: Icon,
  label,
  value,
  suffix = "",
  accent,
  subtitle,
}: {
  icon: any;
  label: string;
  value: number;
  suffix?: string;
  accent: string;
  subtitle?: string;
}) {
  const n = useCounter(value);
  return (
    <Card className="p-5 border-border/60 shadow-card hover:-translate-y-0.5 transition-transform">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold tabular-nums">
            {n}{suffix}
          </p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowUpRight className="h-3 w-3 text-[color:var(--success)]" />
        <span>{subtitle ?? "Live from backend"}</span>
      </div>
    </Card>
  );
}

type RiskStr = "Low" | "Moderate" | "High" | "Critical";

function getRisk(item: HistoryItem): RiskStr {
  const r = item.prediction.risk_level as RiskStr;
  return ["Low", "Moderate", "High", "Critical"].includes(r) ? r : "Low";
}

function Dashboard() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetchHistory(200)
      .then(setItems)
      .catch(() => { /* graceful — show zeroes */ });

    fetchHealth()
      .then((h) => setBackendOnline(h.status === "healthy"))
      .catch(() => setBackendOnline(false));
  }, []);

  const total = items.length;
  const reportsCount = items.filter((i) => i.report_path).length;
  const avgConf = items.length
    ? Math.round(items.reduce((a, p) => a + p.prediction.confidence, 0) / items.length)
    : 0;

  const diagCounts = ["Normal", "Pneumonia", "Tuberculosis", "Coronavirus Disease"].map((d) => ({
    name: d,
    value: items.filter((p) => p.prediction.diagnosis === d).length,
  }));

  const confBuckets = [
    { range: "50-70%", count: items.filter((p) => p.prediction.confidence < 70).length },
    { range: "70-80%", count: items.filter((p) => p.prediction.confidence >= 70 && p.prediction.confidence < 80).length },
    { range: "80-90%", count: items.filter((p) => p.prediction.confidence >= 80 && p.prediction.confidence < 90).length },
    { range: "90-100%", count: items.filter((p) => p.prediction.confidence >= 90).length },
  ];

  const PIE_COLORS = ["oklch(0.68 0.15 160)", "oklch(0.78 0.16 75)", "oklch(0.7 0.18 45)", "oklch(0.62 0.24 27)"];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10 space-y-8">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-primary text-primary-foreground shadow-elegant"
      >
        <div className="absolute inset-0 opacity-20 mix-blend-overlay">
          <img src={heroImg} alt="" className="h-full w-full object-cover object-right" width={1600} height={1024} />
        </div>
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-glow/40 blur-3xl" />
        <div className="relative grid gap-8 p-8 md:grid-cols-2 md:p-14">
          <div className="space-y-6">
            <Badge className="w-fit border-white/20 bg-white/10 text-primary-foreground backdrop-blur-sm">
              <Sparkles className="mr-1 h-3 w-3" /> EfficientNet-B0 · Explainable AI
            </Badge>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
              AI-powered<br />Chest X-ray Analysis
            </h1>
            <p className="max-w-xl text-primary-foreground/85 md:text-lg">
              Upload chest X-rays and receive AI-powered disease predictions, confidence scores,
              Grad-CAM visualization and downloadable medical reports.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg h-12 px-6 rounded-xl">
                <Link to="/analyze"><ScanLine className="mr-2 h-4 w-4" /> Analyze Chest X-ray</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground h-12 px-6 rounded-xl">
                <Link to="/history">View History <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
          <div className="hidden md:block" />
        </div>
      </motion.section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={ScanLine} label="Total Analyses" value={total} accent="bg-primary/10 text-primary" />
        <Stat icon={FileText} label="Reports Generated" value={reportsCount} accent="bg-[color:var(--accent)]/15 text-[color:var(--accent)]" subtitle={`${reportsCount} of ${total} with PDF`} />
        <Stat icon={TrendingUp} label="Avg Confidence" value={avgConf} suffix="%" accent="bg-[color:var(--success)]/15 text-[color:var(--success)]" />
        <Stat
          icon={Activity}
          label="Backend Status"
          value={backendOnline === null ? 0 : backendOnline ? 1 : 0}
          suffix={backendOnline === null ? "" : backendOnline ? " Online" : " Offline"}
          accent={backendOnline ? "bg-[color:var(--success)]/15 text-[color:var(--success)]" : "bg-destructive/15 text-destructive"}
          subtitle={backendOnline === null ? "Checking…" : backendOnline ? "All systems healthy" : "Backend unreachable"}
        />
      </section>

      {/* Charts */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-semibold">Diagnosis Distribution</h3>
              <p className="text-sm text-muted-foreground">Across all analyses</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={diagCounts} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {diagCounts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {diagCounts.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="ml-auto font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 shadow-card">
          <div className="mb-4">
            <h3 className="font-display text-lg font-semibold">Confidence Distribution</h3>
            <p className="text-sm text-muted-foreground">How certain the model has been</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={confBuckets} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="range" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* Recent */}
      <section>
        <Card className="shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-0">
            <div>
              <h3 className="font-display text-lg font-semibold">Recent Predictions</h3>
              <p className="text-sm text-muted-foreground">Latest analyses from the AI backend</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/history">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No analyses yet — upload an X-ray to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  items.slice(0, 5).map((p) => {
                    const risk = getRisk(p);
                    return (
                      <TableRow key={p._id}>
                        <TableCell>
                          <div className="font-medium">{p.patient.patient_name}</div>
                          <div className="text-xs text-muted-foreground">{p.patient.age}y · {p.patient.gender}</div>
                        </TableCell>
                        <TableCell>{p.prediction.diagnosis}</TableCell>
                        <TableCell className="tabular-nums">{p.prediction.confidence.toFixed(1)}%</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={riskColor(risk)}>{risk}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(p.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to="/history">View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>
    </div>
  );
}
