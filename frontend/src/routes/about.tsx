import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Book } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — MedAI" },
      { name: "description", content: "About the MedAI chest X-ray analysis platform, its models, tech stack and author." },
    ],
  }),
  component: AboutPage,
});

const DISEASES = [
  { name: "Normal", desc: "Healthy chest X-ray with no significant abnormalities." },
  { name: "Pneumonia", desc: "Bacterial or viral infection of the lung tissue." },
  { name: "Tuberculosis", desc: "Chronic bacterial infection primarily affecting the lungs." },
  { name: "Coronavirus Disease", desc: "Viral pneumonia patterns associated with COVID-19." },
];

const STACK = [
  { label: "React" }, { label: "TypeScript" }, { label: "Tailwind CSS" },
  { label: "FastAPI" }, { label: "PyTorch" }, { label: "MongoDB" },
  { label: "Docker" }, { label: "Render" }, { label: "Groq" },
];

const WORKFLOW = [
  "Upload chest X-ray",
  "Image preprocessing",
  "EfficientNet-B0 inference",
  "Confidence + probability breakdown",
  "Grad-CAM generation",
  "Medical report synthesis",
];

function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10 space-y-8">
      <section className="rounded-3xl bg-gradient-primary p-10 text-primary-foreground shadow-elegant">
        <h1 className="font-display text-4xl font-semibold">About MedAI</h1>
        <p className="mt-3 max-w-2xl text-primary-foreground/85">
          MedAI is an explainable AI platform for chest radiography. It combines a fine-tuned
          EfficientNet-B0 with Grad-CAM to surface both a prediction and the reasoning behind it —
          producing clinician-friendly reports for every analysis.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold mb-4">Diseases Detected</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {DISEASES.map((d) => (
            <Card key={d.name} className="p-5 shadow-card">
              <p className="font-medium">{d.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{d.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold mb-4">AI Workflow</h2>
        <Card className="p-6 shadow-card">
          <ol className="grid gap-3 sm:grid-cols-2">
            {WORKFLOW.map((step, i) => (
              <li key={step} className="flex items-center gap-3 rounded-xl border p-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold mb-4">Technology Stack</h2>
        <div className="flex flex-wrap gap-2">
          {STACK.map((s) => (
            <Badge key={s.label} variant="outline" className="px-3 py-1.5 text-sm">{s.label}</Badge>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold mb-4">Project Author</h2>
        <Card className="p-8 shadow-card">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground font-display text-2xl font-semibold">
              MP
            </div>
            <div className="flex-1">
              <p className="font-display text-xl font-semibold">Mandeep Panchal</p>
              <p className="text-sm text-muted-foreground mt-1">
                B.Tech Software Engineering · Delhi Technological University
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4 mr-1.5" /> GitHub</Button>
                <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4 mr-1.5" /> Live Demo</Button>
                <Button variant="outline" size="sm"><Book className="h-4 w-4 mr-1.5" /> API Docs</Button>
                <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4 mr-1.5" /> LinkedIn</Button>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
