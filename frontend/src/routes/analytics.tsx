import { createFileRoute } from "@tanstack/react-router";
import {
  Activity, AlertTriangle, FileText, TrendingUp, Download, Calendar,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { Card, PageHeader } from "@/components/PageHeader";
import {
  STATS, DISEASE_DISTRIBUTION, MONTHLY_PREDICTIONS, ACCURACY_TREND, CONFIDENCE_BUCKETS,
} from "@/lib/mock-data";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — MedAI" }] }),
  component: Analytics,
});

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

function Analytics() {
  const highRiskPct = 18.4;
  const top = [...DISEASE_DISTRIBUTION].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader
        title="Analytics"
        subtitle="Performance, trends and AI insights"
        actions={
          <>
            <button className="h-10 px-3.5 rounded-lg bg-secondary hover:bg-muted text-sm font-medium inline-flex items-center gap-2"><Calendar className="size-4" /> Last 30 days</button>
            <button className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover text-sm font-medium inline-flex items-center gap-2"><Download className="size-4" /> Export</button>
          </>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KPI icon={Activity} label="Total Predictions" value={STATS.totalPredictions.toLocaleString()} delta="+12.4%" />
        <KPI icon={AlertTriangle} label="High-Risk Cases" value="237" delta="+4.1%" tone="warning" />
        <KPI icon={FileText} label="Reports Generated" value={STATS.reportsGenerated.toLocaleString()} delta="+8.1%" />
        <KPI icon={TrendingUp} label="Avg Confidence" value={`${STATS.avgConfidence}%`} delta="+1.2%" tone="success" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <Card>
          <h3 className="text-sm font-semibold mb-1">Disease Distribution</h3>
          <p className="text-xs text-muted-foreground mb-3">All time</p>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={DISEASE_DISTRIBUTION} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {DISEASE_DISTRIBUTION.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-1">Monthly Predictions</h3>
          <p className="text-xs text-muted-foreground mb-3">2024</p>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_PREDICTIONS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.4} vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Bar dataKey="predictions" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-1">Prediction Accuracy Trend</h3>
          <p className="text-xs text-muted-foreground mb-3">Rolling monthly accuracy</p>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ACCURACY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.4} vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <YAxis domain={[80, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: "#10B981" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-1">Risk Distribution</h3>
          <p className="text-xs text-muted-foreground mb-3">Last 30 days</p>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="40%" outerRadius="100%" data={[
                { name: "Low", value: 62, fill: "#10B981" },
                { name: "Moderate", value: 24, fill: "#F59E0B" },
                { name: "High", value: 14, fill: "#EF4444" },
              ]}>
                <RadialBar dataKey="value" cornerRadius={8} background />
                <Legend iconSize={8} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-1">Confidence Score Distribution</h3>
          <p className="text-xs text-muted-foreground mb-3">All predictions</p>
          <div className="h-[220px]">
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
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-3">AI Performance Insights</h3>
          <div className="space-y-3">
            <Insight label="Most Common Disease" value={top.name} tone="primary" />
            <Insight label="High-Risk Percentage" value={`${highRiskPct}%`} tone="danger" />
            <Insight label="Average Confidence" value={`${STATS.avgConfidence}%`} tone="success" />
            <Insight label="Model Uptime" value="99.8%" tone="success" />
          </div>
        </Card>
      </section>
    </div>
  );
}

function KPI({
  icon: Icon, label, value, delta, tone = "primary",
}: { icon: typeof Activity; label: string; value: string; delta: string; tone?: "primary" | "success" | "warning" }) {
  const toneMap = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
  };
  return (
    <div className="card-surface p-5 hover-lift">
      <div className="flex items-center justify-between mb-3">
        <div className={`size-9 rounded-lg grid place-items-center ${toneMap[tone]}`}>
          <Icon className="size-[18px]" />
        </div>
        <span className="text-[10.5px] font-medium text-success">{delta}</span>
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function Insight({ label, value, tone }: { label: string; value: string; tone: "primary" | "success" | "danger" }) {
  const map = {
    primary: "border-primary/20 bg-primary-soft/40",
    success: "border-success/20 bg-success-soft/40",
    danger: "border-destructive/20 bg-destructive-soft/40",
  };
  return (
    <div className={`p-3 rounded-lg border ${map[tone]}`}>
      <div className="text-[11px] text-muted-foreground uppercase font-semibold">{label}</div>
      <div className="text-base font-bold mt-0.5">{value}</div>
    </div>
  );
}
