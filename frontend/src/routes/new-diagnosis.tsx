import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Upload, X, Loader2, CheckCircle2, Brain, Sparkles, Activity,
  FileText, Download, Save, Image as ImageIcon, ChevronRight,
} from "lucide-react";
import { Card, PageHeader, DiseaseBadge, RiskBadge } from "@/components/PageHeader";
import { DISEASES, type Disease } from "@/lib/mock-data";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip,
} from "recharts";

export const Route = createFileRoute("/new-diagnosis")({
  head: () => ({ meta: [{ title: "New Diagnosis — MedAI" }] }),
  component: NewDiagnosis,
});

type Phase = "form" | "processing" | "results";

const STEPS = [
  "Uploading Chest X-ray",
  "Preprocessing Image",
  "Running Deep Learning Model",
  "Computing Disease Probabilities",
  "Generating Grad-CAM",
  "Generating AI Explanation",
  "Preparing Medical Report",
  "Saving Prediction",
  "Analysis Complete",
];

function NewDiagnosis() {
  const [phase, setPhase] = useState<Phase>("form");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [step, setStep] = useState(0);
  const [opacity, setOpacity] = useState(60);

  const navigate = useNavigate();

  function onFiles(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setFile(f);
    const r = new FileReader();
    r.onload = () => setPreview(r.result as string);
    r.readAsDataURL(f);
  }

  async function analyze() {
    if (!file || !name || !age) return;
    setPhase("processing");
    setStep(0);
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 650));
      setStep(i + 1);
    }
    await new Promise((r) => setTimeout(r, 400));
    setPhase("results");
  }

  if (phase === "processing") return <Processing step={step} />;
  if (phase === "results")
    return <Results preview={preview} name={name} opacity={opacity} setOpacity={setOpacity}
      onReset={() => { setPhase("form"); setFile(null); setPreview(""); setName(""); setAge(""); }}
      onOpenExplain={() => navigate({ to: "/explainable-ai" })}
    />;

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader title="New Diagnosis" subtitle="Upload a chest X-ray and run the AI model" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Name *"><input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Patient name" /></Field>
              <Field label="Age *"><input value={age} onChange={(e) => setAge(e.target.value)} type="number" className="input" placeholder="e.g. 42" /></Field>
              <Field label="Gender *">
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="input">
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </Field>
              <Field label="Patient ID"><input className="input" placeholder="Optional" /></Field>
              <Field label="Symptoms" className="md:col-span-2"><input className="input" placeholder="e.g. cough, fever, dyspnea" /></Field>
              <Field label="Clinical Notes" className="md:col-span-3">
                <textarea className="input min-h-[72px]" placeholder="Optional clinical context" />
              </Field>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Chest X-ray Upload</h3>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
              className="relative block border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary-soft/30 rounded-xl p-8 text-center cursor-pointer transition-all"
            >
              <input type="file" accept="image/*" onChange={(e) => onFiles(e.target.files)} className="hidden" />
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="X-ray preview" className="max-h-80 mx-auto rounded-lg" />
                  <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); setPreview(""); }} className="absolute top-2 right-2 size-8 rounded-full bg-card border border-border grid place-items-center hover:bg-destructive hover:text-destructive-foreground transition">
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="size-12 rounded-xl bg-primary-soft text-primary grid place-items-center">
                    <Upload className="size-5" />
                  </div>
                  <div className="text-sm font-medium">Drag & drop your X-ray image</div>
                  <div className="text-xs text-muted-foreground">PNG, JPG up to 10 MB · or click to browse</div>
                </div>
              )}
            </label>
          </div>

          <button onClick={analyze} disabled={!file || !name || !age} className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow transition flex items-center justify-center gap-2">
            <Brain className="size-5" /> Analyze Chest X-ray <ChevronRight className="size-4" />
          </button>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="size-9 rounded-lg gradient-primary grid place-items-center text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Deep Learning Model</h3>
              <p className="text-[11px] text-muted-foreground">MedAI ChestNet v1.0</p>
            </div>
          </div>
          <div className="space-y-2 mb-4">
            {[
              ["Model Ready", true],
              ["Grad-CAM Enabled", true],
              ["AI Reports Enabled", true],
            ].map(([label, ok]) => (
              <div key={String(label)} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                {ok ? <CheckCircle2 className="size-3.5 text-success" /> : null}
              </div>
            ))}
          </div>
          <div className="text-[11px] uppercase text-muted-foreground font-semibold mb-2">Supported Diseases</div>
          <div className="flex flex-wrap gap-1.5">
            {DISEASES.map((d) => <DiseaseBadge key={d} name={d} />)}
          </div>
        </Card>
      </div>
      <style>{`.input{width:100%;height:40px;padding:0 12px;border-radius:8px;background:var(--secondary);border:1px solid transparent;font-size:13.5px;outline:none;transition:all .15s}.input:focus{background:var(--card);border-color:color-mix(in oklab, var(--primary) 40%, transparent);box-shadow:0 0 0 3px color-mix(in oklab, var(--primary) 15%, transparent)}textarea.input{height:auto;padding:10px 12px}`}</style>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function Processing({ step }: { step: number }) {
  const pct = Math.round((step / STEPS.length) * 100);
  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card className="text-center">
        <div className="size-16 mx-auto rounded-2xl gradient-primary grid place-items-center text-primary-foreground shadow-glow mb-4 animate-pulse-glow">
          <Loader2 className="size-7 animate-spin" />
        </div>
        <h2 className="text-xl font-bold">Analyzing Chest X-ray</h2>
        <p className="text-sm text-muted-foreground mt-1">Please wait while the AI processes your scan</p>

        <div className="mt-6 h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div className="h-full gradient-primary transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-xs text-muted-foreground mt-2 tabular-nums">{pct}% complete</div>

        <div className="mt-6 text-left space-y-2">
          {STEPS.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <div key={s} className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${current ? "bg-primary-soft" : ""}`}>
                <div className={`size-6 rounded-full grid place-items-center text-[10px] font-semibold ${done ? "bg-success text-success-foreground" : current ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {done ? <CheckCircle2 className="size-3.5" /> : current ? <Loader2 className="size-3 animate-spin" /> : i + 1}
                </div>
                <span className={`text-sm ${current ? "text-primary font-medium" : done ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Results({
  preview, name, opacity, setOpacity, onReset, onOpenExplain,
}: {
  preview: string; name: string; opacity: number;
  setOpacity: (v: number) => void; onReset: () => void; onOpenExplain: () => void;
}) {
  const diagnosis: Disease = "Bacterial Pneumonia";
  const confidence = 0.927;
  const probs = [
    { name: "Bacterial Pneumonia", value: 92.7 },
    { name: "Viral Pneumonia", value: 4.2 },
    { name: "Normal", value: 1.6 },
    { name: "Tuberculosis", value: 1.0 },
    { name: "Coronavirus Disease", value: 0.5 },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 animate-fade-in">
      <PageHeader
        title="Diagnosis Results"
        subtitle={`Patient: ${name || "Unknown"} · Analysis complete`}
        actions={
          <>
            <button className="h-10 px-4 rounded-lg bg-secondary hover:bg-muted text-sm font-medium inline-flex items-center gap-2"><Download className="size-4" /> PDF</button>
            <button className="h-10 px-4 rounded-lg bg-secondary hover:bg-muted text-sm font-medium inline-flex items-center gap-2"><Save className="size-4" /> Save</button>
            <button onClick={onOpenExplain} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover text-sm font-medium inline-flex items-center gap-2"><Brain className="size-4" /> Open Explainable AI</button>
          </>
        }
      />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs uppercase text-muted-foreground font-semibold">Primary Diagnosis</div>
          <div className="mt-2 text-2xl font-bold">{diagnosis}</div>
          <div className="mt-3 flex items-center gap-2">
            <DiseaseBadge name={diagnosis} />
            <RiskBadge risk="High" />
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase text-muted-foreground font-semibold">Confidence</div>
          <div className="mt-2 text-3xl font-bold tabular-nums">{(confidence * 100).toFixed(1)}%</div>
          <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full gradient-primary" style={{ width: `${confidence * 100}%` }} />
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase text-muted-foreground font-semibold">Recommendation</div>
          <div className="mt-2 text-sm">Recommend antibiotic therapy and clinical correlation. Follow up with sputum culture.</div>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-3">Disease Probability</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={probs} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748B" }} width={150} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {probs.map((_, i) => <Cell key={i} fill={i === 0 ? "#2563EB" : "#CBD5E1"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">AI Explanation</h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The model identified consolidation patterns in the right lower lobe, consistent with
            bacterial pneumonia. Grad-CAM activation is concentrated in the peripheral airspace
            indicating focal alveolar opacity. Confidence is high; recommend clinical correlation.
          </p>
          <button onClick={onReset} className="mt-4 w-full h-10 rounded-lg border border-border hover:bg-secondary text-sm font-medium">New Diagnosis</button>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><ImageIcon className="size-4" /> Original X-ray</h3>
          {preview ? <img src={preview} className="w-full rounded-lg" /> : <Placeholder />}
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Activity className="size-4 text-primary" /> Grad-CAM Overlay</h3>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              Opacity
              <input type="range" min={0} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-24 accent-[var(--primary)]" />
              <span className="tabular-nums w-8">{opacity}%</span>
            </div>
          </div>
          <div className="relative rounded-lg overflow-hidden bg-black/5">
            {preview ? <img src={preview} className="w-full" /> : <Placeholder />}
            <div className="absolute inset-0 pointer-events-none mix-blend-multiply" style={{
              opacity: opacity / 100,
              background: "radial-gradient(circle at 65% 60%, rgba(239,68,68,0.85), rgba(245,158,11,0.55) 25%, rgba(37,99,235,0.25) 50%, transparent 70%)",
            }} />
          </div>
        </Card>
      </section>
    </div>
  );
}

function Placeholder() {
  return <div className="aspect-square w-full bg-secondary rounded-lg grid place-items-center text-muted-foreground"><ImageIcon className="size-10" /></div>;
}
