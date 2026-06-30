import { createFileRoute } from "@tanstack/react-router";
import {
  Brain, Activity, FileText, Sparkles, Github, Globe, Linkedin, BookOpen,
  Code2, Database, Cloud, Layers, Cpu, ChevronRight,
} from "lucide-react";
import { Card, PageHeader, DiseaseBadge } from "@/components/PageHeader";
import { DISEASES } from "@/lib/mock-data";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — MedAI" }] }),
  component: About,
});

const FEATURES = [
  { icon: Brain, title: "AI Disease Detection", desc: "Trained deep learning model for chest X-ray analysis." },
  { icon: Activity, title: "Explainable AI (Grad-CAM)", desc: "Visual heatmaps revealing model focus areas." },
  { icon: Sparkles, title: "Confidence Analysis", desc: "Probabilistic outputs and risk categorization." },
  { icon: FileText, title: "PDF Report Generation", desc: "Automated, structured medical reports." },
  { icon: Layers, title: "Prediction History", desc: "Searchable case archive for review." },
  { icon: Cpu, title: "AI Medical Assistant", desc: "Context-aware conversational support." },
];

const WORKFLOW = [
  "Chest X-ray", "Image Preprocessing", "Deep Learning Model", "Prediction",
  "Confidence Analysis", "Grad-CAM", "Medical Report", "History", "AI Assistant",
];

const STACK = [
  { name: "PyTorch", tone: "bg-orange-100 text-orange-700" },
  { name: "FastAPI", tone: "bg-emerald-100 text-emerald-700" },
  { name: "React", tone: "bg-sky-100 text-sky-700" },
  { name: "TypeScript", tone: "bg-blue-100 text-blue-700" },
  { name: "Tailwind CSS", tone: "bg-cyan-100 text-cyan-700" },
  { name: "MongoDB", tone: "bg-green-100 text-green-700" },
  { name: "Docker", tone: "bg-indigo-100 text-indigo-700" },
  { name: "Render", tone: "bg-purple-100 text-purple-700" },
  { name: "Vercel", tone: "bg-slate-100 text-slate-700" },
  { name: "Groq", tone: "bg-pink-100 text-pink-700" },
];

function About() {
  return (
    <div className="max-w-[1100px] mx-auto space-y-5">
      <PageHeader title="About MedAI" subtitle="An AI-powered chest X-ray diagnosis platform" />

      <Card className="!p-8 gradient-primary text-primary-foreground overflow-hidden relative">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_80%_20%,white,transparent_50%)]" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-white/15 backdrop-blur px-2.5 py-1 rounded-full mb-3">
            <Sparkles className="size-3" /> MedAI v1.0.0
          </div>
          <h2 className="text-3xl font-bold">Production-grade AI Radiology</h2>
          <p className="mt-2 text-primary-foreground/90 max-w-2xl">
            MedAI combines deep learning, explainable AI, automated reporting, analytics, and an
            AI assistant into a single seamless healthcare application.
          </p>
        </div>
      </Card>

      <section>
        <h3 className="text-sm font-semibold mb-3">Diseases Detected</h3>
        <div className="flex flex-wrap gap-2">
          {DISEASES.map((d) => <DiseaseBadge key={d} name={d} />)}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3">Key Features</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="hover-lift">
              <div className="size-10 rounded-lg bg-primary-soft text-primary grid place-items-center mb-3">
                <f.icon className="size-5" />
              </div>
              <div className="text-sm font-semibold">{f.title}</div>
              <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <h3 className="text-sm font-semibold mb-4">AI Workflow</h3>
        <div className="flex flex-wrap items-center gap-2">
          {WORKFLOW.map((w, i) => (
            <div key={w} className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-primary-soft text-primary text-xs font-medium">{w}</span>
              {i < WORKFLOW.length - 1 && <ChevronRight className="size-3.5 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Code2 className="size-4 text-primary" /> Technology Stack</h3>
        <div className="flex flex-wrap gap-2">
          {STACK.map((t) => (
            <span key={t.name} className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium ${t.tone}`}>{t.name}</span>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Database className="size-4 text-primary" /> System Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center">
          {[
            ["React Frontend", "Vercel"],
            ["FastAPI Backend", "Render"],
            ["Deep Learning Model", "PyTorch"],
            ["Grad-CAM", "Explainability"],
            ["MongoDB", "Storage"],
            ["AI Medical Assistant", "Groq"],
          ].map(([t, s]) => (
            <div key={t} className="p-4 rounded-lg bg-secondary/60 border border-border">
              <div className="text-sm font-semibold">{t}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{s}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="size-16 rounded-2xl gradient-primary text-primary-foreground grid place-items-center text-2xl font-bold">M</div>
        <div className="flex-1">
          <div className="text-base font-semibold">Mandeep</div>
          <div className="text-xs text-muted-foreground">B.Tech Software Engineering · 2023–2027 · Delhi Technological University</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkBtn icon={Github}>GitHub</LinkBtn>
          <LinkBtn icon={Globe}>Live App</LinkBtn>
          <LinkBtn icon={BookOpen}>API Docs</LinkBtn>
          <LinkBtn icon={Linkedin}>LinkedIn</LinkBtn>
        </div>
      </Card>

      <div className="text-center text-xs text-muted-foreground py-4">MedAI v1.0.0 · Built with care</div>
    </div>
  );
}

function LinkBtn({ icon: Icon, children }: { icon: typeof Github; children: React.ReactNode }) {
  return (
    <a className="h-9 px-3 rounded-lg bg-secondary hover:bg-primary-soft hover:text-primary text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer">
      <Icon className="size-3.5" /> {children}
    </a>
  );
}
