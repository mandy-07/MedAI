import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Upload, X, ScanLine, CheckCircle2, Loader2, Download,
  RefreshCw, Maximize2, Sparkles, FileText, AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { predictXray, generateReport, assetUrl } from "@/lib/api";
import type { BackendPrediction } from "@/lib/types";
import {
  riskColor, type Prediction, type Diagnosis,
  loadPredictions, savePredictions,
} from "@/lib/mock-data";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze X-ray — MedAI" },
      { name: "description", content: "Upload a chest X-ray and get an AI-generated prediction, confidence scores, Grad-CAM and a medical report." },
    ],
  }),
  component: AnalyzePage,
});

type Phase = "idle" | "processing" | "result" | "error";

const STEPS = [
  "Uploading Image",
  "Image Preprocessing",
  "Running EfficientNet-B0",
  "Generating Prediction",
  "Confidence Analysis",
  "Generating Grad-CAM",
  "Creating Medical Report",
];

// Step durations in ms (sum ≈ total expected backend latency).
// Grad-CAM (step 5) gets more time since it's the heavy step.
const STEP_DURATIONS = [800, 600, 1200, 600, 600, 3000, 1200];

// Map backend diagnosis/risk strings to our frontend Diagnosis type
function mapDiagnosis(d: string): Diagnosis {
  if (d === "Coronavirus Disease" || d === "Corona Virus Disease") return "Coronavirus Disease";
  if (d === "Pneumonia") return "Pneumonia";
  if (d === "Tuberculosis") return "Tuberculosis";
  return "Normal";
}

function mapRisk(r: string): Prediction["risk"] {
  if (r === "High") return "High";
  if (r === "Moderate") return "Moderate";
  if (r === "Critical") return "Critical";
  return "Low";
}

/**
 * Convert a BackendPrediction into the local Prediction shape
 * for persistence & history.
 */
function backendToLocal(
  bp: BackendPrediction,
  patient: { name: string; age: number; gender: "Male" | "Female" | "Other"; symptoms: string }
): Prediction {
  const diag = mapDiagnosis(bp.diagnosis);
  // Backend probabilities are 0-100; local Prediction uses 0-1
  const probs: Record<Diagnosis, number> = {
    Normal: 0,
    Pneumonia: 0,
    Tuberculosis: 0,
    "Coronavirus Disease": 0,
  };

  for (const [key, val] of Object.entries(bp.probabilities)) {
    const mapped = mapDiagnosis(key);
    probs[mapped] = (probs[mapped] ?? 0) + val / 100;
  }

  return {
    id: `px_${Date.now()}`,
    patientName: patient.name,
    age: patient.age,
    gender: patient.gender,
    symptoms: patient.symptoms,
    diagnosis: diag,
    confidence: bp.confidence / 100, // store as 0-1
    risk: mapRisk(bp.risk_level),
    date: new Date().toISOString(),
    probabilities: probs,
    recommendation: bp.recommendation,
  };
}

function AnalyzePage() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [symptoms, setSymptoms] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState<BackendPrediction | null>(null);
  const [localPred, setLocalPred] = useState<Prediction | null>(null);
  const [overlay, setOverlay] = useState(60);
  const [drag, setDrag] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [gradcamFullscreen, setGradcamFullscreen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const onFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Please upload a PNG or JPG image"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const analyze = async () => {
    if (!name || !age) { toast.error("Please enter patient name and age"); return; }
    if (!file) { toast.error("Please upload a chest X-ray image"); return; }

    setPhase("processing");
    setStepIdx(0);
    setErrorMsg("");

    // Advance steps concurrently with the real API call
    const stepPromise = (async () => {
      for (let i = 0; i < STEPS.length; i++) {
        await new Promise((r) => setTimeout(r, STEP_DURATIONS[i]));
        setStepIdx(i + 1);
      }
    })();

    const apiPromise = predictXray(file);

    try {
      const [backendResult] = await Promise.all([apiPromise, stepPromise]);
      const pred = backendToLocal(backendResult, {
        name, age: Number(age), gender, symptoms,
      });
      // Save to localStorage for history page
      const all = loadPredictions();
      savePredictions([pred, ...all]);

      setResult(backendResult);
      setLocalPred(pred);
      setPhase("result");
      toast.success("Analysis complete!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      setErrorMsg(msg);
      setPhase("error");
      toast.error(`Analysis failed: ${msg}`);
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(null); setResult(null); setLocalPred(null);
    setPhase("idle"); setStepIdx(0); setReportUrl(null); setErrorMsg("");
    setName(""); setAge(""); setSymptoms("");
  };

  const handleGenerateReport = async () => {
    if (!result || !localPred) return;
    setReportLoading(true);
    try {
      const payload = {
        patient: {
          patient_name: localPred.patientName,
          age: localPred.age,
          gender: localPred.gender,
        },
        prediction: {
          diagnosis: result.diagnosis,
          predicted_class: result.predicted_class,
          confidence: result.confidence,
          risk_level: result.risk_level,
          recommendation: result.recommendation,
          bacterial_probability: result.subtypes?.bacterial ?? undefined,
          viral_probability: result.subtypes?.viral ?? undefined,
        },
        gradcam_url: result.gradcam_url ? assetUrl(result.gradcam_url) : null,
        notes: symptoms || null,
      };
      const resp = await generateReport(payload);
      const url = assetUrl(resp.report_url);
      setReportUrl(url);
      // Open in new tab
      window.open(url, "_blank");
      toast.success("Report generated successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate report";
      toast.error(msg);
    } finally {
      setReportLoading(false);
    }
  };

  const downloadGradcam = () => {
    if (!result?.gradcam_url) { toast.error("No Grad-CAM available"); return; }
    const url = assetUrl(result.gradcam_url);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gradcam.png";
    a.click();
  };

  const riskVal = result ? mapRisk(result.risk_level) : "Low";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
          <ScanLine className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold">Analyze Chest X-ray</h1>
          <p className="text-sm text-muted-foreground">Upload an image and let MedAI walk through the analysis end-to-end.</p>
        </div>
      </div>

      {/* ── IDLE ── */}
      {phase === "idle" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-5">
          <Card className="p-6 lg:col-span-2 shadow-card space-y-5">
            <div>
              <h3 className="font-display font-semibold">Patient Information</h3>
              <p className="text-xs text-muted-foreground">Used only in the generated report.</p>
            </div>
            <div className="space-y-2"><Label>Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aarav Sharma" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Age</Label>
                <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="34" />
              </div>
              <div className="space-y-2"><Label>Gender</Label>
                <Select value={gender} onValueChange={(v: any) => setGender(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Symptoms <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Persistent cough, fever, shortness of breath..." rows={3} />
            </div>
          </Card>

          <Card className="p-6 lg:col-span-3 shadow-card space-y-5">
            <div>
              <h3 className="font-display font-semibold">Upload Chest X-ray</h3>
              <p className="text-xs text-muted-foreground">PNG · JPG · JPEG — max 10 MB</p>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0] ?? null); }}
              onClick={() => inputRef.current?.click()}
              className={`relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition ${drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"}`}
            >
              <input ref={inputRef} type="file" accept="image/png,image/jpeg" hidden onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
              {preview ? (
                <div className="relative w-full">
                  <img src={preview} alt="Preview" className="mx-auto max-h-72 rounded-xl object-contain" />
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2 text-sm">
                    <div className="min-w-0 truncate">
                      <span className="font-medium">{file?.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{file ? (file.size / 1024).toFixed(1) : 0} KB</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); reset(); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <p className="mt-4 font-medium">Drop your chest X-ray here</p>
                  <p className="text-sm text-muted-foreground">or click to browse — PNG, JPG, JPEG</p>
                </>
              )}
            </div>

            <Button onClick={analyze} size="lg" className="w-full h-12 rounded-xl bg-gradient-primary shadow-elegant text-primary-foreground hover:opacity-95">
              <Sparkles className="mr-2 h-4 w-4" /> Analyze Chest X-ray
            </Button>
          </Card>
        </motion.div>
      )}

      {/* ── PROCESSING ── */}
      {phase === "processing" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-8 md:p-12 shadow-card">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <h3 className="font-display text-lg font-semibold">AI is analyzing the image…</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">This usually takes 15–30 seconds on first load (model warm-up).</p>
            <ol className="mt-6 space-y-3">
              {STEPS.map((s, i) => {
                const done = i < stepIdx; const active = i === stepIdx;
                return (
                  <motion.li key={s} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${done ? "border-[color:var(--success)]/30 bg-[color:var(--success)]/5" : active ? "border-primary/30 bg-primary/5" : "border-border/60"}`}>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${done ? "bg-[color:var(--success)]/15 text-[color:var(--success)]" : active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-xs">{i + 1}</span>}
                    </span>
                    <span className={`text-sm ${done ? "text-foreground" : active ? "font-medium" : "text-muted-foreground"}`}>{s}</span>
                  </motion.li>
                );
              })}
            </ol>
          </Card>
        </motion.div>
      )}

      {/* ── ERROR ── */}
      {phase === "error" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-8 shadow-card border-destructive/30">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <h3 className="font-display text-lg font-semibold">Analysis Failed</h3>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{errorMsg || "An unexpected error occurred. Please try again."}</p>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => setPhase("idle")} variant="outline" className="rounded-xl">
                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
              </Button>
              <Button onClick={reset} variant="ghost" className="rounded-xl">Start Over</Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── RESULT ── */}
      <AnimatePresence>
        {phase === "result" && result && localPred && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Prediction header */}
            <Card className="p-8 shadow-card">
              <div className="grid gap-8 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Predicted Diagnosis</p>
                  <h2 className="mt-2 font-display text-4xl font-semibold">{result.diagnosis}</h2>
                  <div className="mt-4 flex items-center gap-3">
                    <Badge variant="outline" className={riskColor(riskVal)}>{result.risk_level} Risk</Badge>
                    <span className="text-sm text-muted-foreground">{new Date(localPred.date).toLocaleString()}</span>
                  </div>
                  {result.predicted_class !== result.diagnosis && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Model class: <span className="font-medium text-foreground">{result.predicted_class}</span>
                    </p>
                  )}
                  <p className="mt-6 max-w-xl text-sm text-foreground/80">{result.recommendation}</p>
                </div>
                <ConfidenceRing value={result.confidence / 100} />
              </div>
            </Card>

            {/* Probabilities */}
            <Card className="p-6 shadow-card">
              <h3 className="font-display font-semibold mb-4">Disease Probability</h3>
              <div className="space-y-3">
                {Object.entries(result.probabilities)
                  .sort(([, a], [, b]) => b - a)
                  .map(([d, v]) => (
                    <div key={d}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium">{d}</span>
                        <span className="tabular-nums text-muted-foreground">{v.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.8, delay: 0.1 }}
                          className={`h-full rounded-full ${d === result.predicted_class ? "bg-gradient-primary" : "bg-primary/30"}`} />
                      </div>
                    </div>
                  ))}
              </div>
              {result.subtypes && (
                <div className="mt-4 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
                  <p className="font-medium mb-2">Pneumonia Subtype Breakdown</p>
                  <div className="flex gap-6">
                    <span>Bacterial: <strong>{result.subtypes.bacterial.toFixed(1)}%</strong></span>
                    <span>Viral: <strong>{result.subtypes.viral.toFixed(1)}%</strong></span>
                  </div>
                </div>
              )}
            </Card>

            {/* Grad-CAM */}
            <Card className="p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold">Explainable AI · Grad-CAM</h3>
                  <p className="text-xs text-muted-foreground">Regions that most influenced the prediction.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setGradcamFullscreen(true)}>
                    <Maximize2 className="h-4 w-4 mr-1" /> Fullscreen
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadGradcam} disabled={!result.gradcam_url}>
                    <Download className="h-4 w-4 mr-1" /> Grad-CAM
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Original */}
                <div className="rounded-2xl overflow-hidden border bg-muted">
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/50">Original</div>
                  {preview && <img src={preview} alt="Original" className="w-full h-72 object-contain bg-black/90" />}
                </div>
                {/* Grad-CAM or fallback */}
                <div className="rounded-2xl overflow-hidden border bg-muted relative">
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/50">Grad-CAM Overlay</div>
                  <div className="relative h-72 bg-black/90">
                    {result.gradcam_url ? (
                      <img
                        src={assetUrl(result.gradcam_url)}
                        alt="Grad-CAM"
                        className="absolute inset-0 w-full h-full object-contain"
                        style={{ opacity: overlay / 100 }}
                      />
                    ) : (
                      <>
                        {preview && <img src={preview} alt="Base" className="absolute inset-0 w-full h-full object-contain" />}
                        <div
                          className="absolute inset-0 mix-blend-screen"
                          style={{
                            opacity: overlay / 100,
                            background: "radial-gradient(circle at 55% 45%, rgba(239,68,68,0.85), rgba(249,115,22,0.6) 30%, rgba(37,99,235,0.2) 55%, transparent 70%)",
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-24">Overlay opacity</span>
                <Slider value={[overlay]} onValueChange={(v) => setOverlay(v[0])} max={100} step={1} className="flex-1" />
                <span className="text-xs tabular-nums w-10 text-right">{overlay}%</span>
              </div>
              <p className="mt-4 text-xs text-muted-foreground border-l-2 border-primary/40 pl-3">
                Grad-CAM highlights the regions that most influenced the AI prediction. Warm colors (red/orange) = high influence. Results represent model attention, not a clinical diagnosis.
              </p>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-xl bg-gradient-primary shadow-elegant text-primary-foreground"
                onClick={handleGenerateReport}
                disabled={reportLoading}
              >
                {reportLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                {reportLoading ? "Generating…" : reportUrl ? "Open Report Again" : "Download Medical Report"}
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl" onClick={downloadGradcam} disabled={!result.gradcam_url}>
                <Download className="mr-2 h-4 w-4" /> Download Grad-CAM
              </Button>
              <Button size="lg" variant="ghost" className="rounded-xl" onClick={reset}>
                <RefreshCw className="mr-2 h-4 w-4" /> Analyze Another
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grad-CAM Fullscreen */}
      <AnimatePresence>
        {gradcamFullscreen && result?.gradcam_url && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setGradcamFullscreen(false)}
          >
            <img src={assetUrl(result.gradcam_url)} alt="Grad-CAM fullscreen" className="max-h-full max-w-full rounded-2xl object-contain" />
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/10" onClick={() => setGradcamFullscreen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const r = 62; const c = 2 * Math.PI * r;
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setN(pct), 100);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
        <circle cx="80" cy="80" r={r} stroke="var(--muted)" strokeWidth="12" fill="none" />
        <circle cx="80" cy="80" r={r} stroke="url(#g)" strokeWidth="12" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (n / 100) * c} style={{ transition: "stroke-dashoffset 1s ease" }} />
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" /><stop offset="100%" stopColor="var(--primary-glow)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-3xl font-semibold tabular-nums">{n}%</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Confidence</div>
      </div>
    </div>
  );
}
