import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity, Stethoscope, FileText, TrendingUp, ArrowUpRight, Clock,
  CheckCircle2, AlertCircle, Sparkles,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Card, PageHeader, DiseaseBadge, RiskBadge } from "@/components/PageHeader";
import {
  STATS, TREND_DATA, DISEASE_DISTRIBUTION, CONFIDENCE_BUCKETS, PREDICTIONS,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — MedAI" },
      { name: "description", content: "Overview of MedAI predictions, reports, and AI performance." },
    ],
  }),
  component: Dashboard,
});

const CHART_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

function Dashboard() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <section className="relative overflow-hidden rounded-2xl gradient-primary p-7 lg:p-9 text-primary-foreground shadow-glow animate-fade-in">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_50%)]" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8 justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-white/15 backdrop-blur px-2.5 py-1 rounded-full mb-3">
              <Sparkles className="size-3" /> AI Radiology Platform
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">Welcome to MedAI</h2>
            <p className="mt-2 text-primary-foreground/85 text-sm lg:text-base max-w-lg">
              AI-powered chest X-ray analysis with Grad-CAM explainability and automated medical reports.
            </p>
          </div>
          <div className="flex gap-2.5">
            <Link to="/new-diagnosis" className="inline-flex items-center gap-2 bg-white text-primary px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors">
              <Stethoscope className="size-4" /> New Diagnosis
            </Link>
            <Link to="/reports" className="inline-flex items-center gap-2 bg-white/15 backdrop-blur text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/25 border border-white/20 transition-colors">
              <FileText className="size-4" /> Open Reports
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Total Predictions" value={STATS.totalPredictions.toLocaleString()} delta="+12.4%" />
        <StatCard icon={Clock} label="Today's Predictions" value={String(STATS.todayPredictions)} delta="+3 vs yesterday" />
        <StatCard icon={FileText} label="Reports Generated" value={STATS.reportsGenerated.toLocaleString()} delta="+8.1%" />
        <StatCard icon={TrendingUp} label="Avg Confidence" value={`${STATS.avgConfidence}%`} delta="+1.2%" tone="success" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Prediction Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 14 days</p>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_DATA}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Area type="monotone" dataKey="predictions" stroke="#2563EB" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-1">Disease Distribution</h3>
          <p className="text-xs text-muted-foreground mb-3">All time</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={DISEASE_DISTRIBUTION} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={3}>
                  {DISEASE_DISTRIBUTION.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {DISEASE_DISTRIBUTION.slice(0, 5).map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-[11.5px]">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: CHART_COLORS[i] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Recent Predictions</h3>
            <Link to="/history" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {PREDICTIONS.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="size-9 rounded-lg bg-primary-soft text-primary grid place-items-center text-sm font-semibold">
                  {p.patient.split(" ").map((x) => x[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.patient}</div>
                  <div className="text-[11px] text-muted-foreground">{p.patientId} · {new Date(p.date).toLocaleDateString()}</div>
                </div>
                <DiseaseBadge name={p.diagnosis} />
                <div className="text-xs font-medium tabular-nums w-12 text-right">{(p.confidence * 100).toFixed(0)}%</div>
                <RiskBadge risk={p.risk} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-1">Confidence Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">By bucket</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CONFIDENCE_BUCKETS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.4} vertical={false} />
                <XAxis dataKey="range" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-success-soft border border-success/20 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-success" />
            <span className="text-xs text-success font-medium">Model performance nominal</span>
          </div>
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, delta, tone = "primary",
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  delta: string;
  tone?: "primary" | "success";
}) {
  return (
    <div className="card-surface p-5 hover-lift animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className={`size-9 rounded-lg grid place-items-center ${tone === "success" ? "bg-success-soft text-success" : "bg-primary-soft text-primary"}`}>
          <Icon className="size-[18px]" />
        </div>
        <span className="text-[10.5px] font-medium text-success inline-flex items-center gap-1">
          <TrendingUp className="size-3" /> {delta}
        </span>
      </div>
      <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
