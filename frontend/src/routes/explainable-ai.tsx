import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload, Maximize2, Download, RefreshCcw, Brain, Send, Bot, User } from "lucide-react";
import { Card, PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/explainable-ai")({
  head: () => ({ meta: [{ title: "Explainable AI — MedAI" }] }),
  component: ExplainableAI,
});

const QUICK = [
  "What does the highlighted area indicate?",
  "Explain Grad-CAM in simple terms",
  "Is this consistent with pneumonia?",
  "Suggest next clinical steps",
];

type Msg = { role: "user" | "assistant"; content: string };

function ExplainableAI() {
  const [preview, setPreview] = useState("");
  const [opacity, setOpacity] = useState(70);
  const [zoom, setZoom] = useState(1);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "I can explain the Grad-CAM overlay above. The warmer (red/orange) regions show areas the model weighted most heavily in its prediction. Ask me anything about this heatmap." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }); }, [messages]);

  function onFile(f: File | null) {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setPreview(r.result as string);
    r.readAsDataURL(f);
  }

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context: "Explainable AI workspace — discussing a Grad-CAM heatmap." }),
      });
      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader(); const decoder = new TextDecoder();
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        const chunk = decoder.decode(value);
        setMessages((m) => { const c = [...m]; c[c.length - 1] = { ...c[c.length - 1], content: c[c.length - 1].content + chunk }; return c; });
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "I couldn't reach the AI service." }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader title="Explainable AI" subtitle="Visualize and interrogate Grad-CAM heatmaps" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Brain className="size-4 text-primary" /> Grad-CAM Viewer</h3>
            <div className="flex items-center gap-1">
              <IconBtn onClick={() => setZoom((z) => Math.min(3, z + 0.25))} title="Zoom in">+</IconBtn>
              <IconBtn onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} title="Zoom out">−</IconBtn>
              <IconBtn onClick={() => { setZoom(1); setOpacity(70); }} title="Reset"><RefreshCcw className="size-3.5" /></IconBtn>
              <IconBtn title="Fullscreen"><Maximize2 className="size-3.5" /></IconBtn>
              <IconBtn title="Download"><Download className="size-3.5" /></IconBtn>
            </div>
          </div>

          {preview ? (
            <div className="relative rounded-lg overflow-hidden bg-black/5 aspect-square">
              <img src={preview} className="w-full h-full object-contain transition-transform" style={{ transform: `scale(${zoom})` }} />
              <div className="absolute inset-0 pointer-events-none mix-blend-multiply transition-transform" style={{
                opacity: opacity / 100, transform: `scale(${zoom})`,
                background: "radial-gradient(circle at 60% 55%, rgba(239,68,68,0.85), rgba(245,158,11,0.55) 25%, rgba(37,99,235,0.25) 50%, transparent 70%)",
              }} />
            </div>
          ) : (
            <label className="block border-2 border-dashed border-border hover:border-primary/50 rounded-xl aspect-square grid place-items-center cursor-pointer hover:bg-primary-soft/30 transition">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
              <div className="flex flex-col items-center gap-2">
                <div className="size-12 rounded-xl bg-primary-soft text-primary grid place-items-center"><Upload className="size-5" /></div>
                <div className="text-sm font-medium">Upload Grad-CAM or X-ray</div>
                <div className="text-xs text-muted-foreground">or open a previous prediction</div>
              </div>
            </label>
          )}

          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-16">Opacity</span>
            <input type="range" min={0} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
            <span className="text-xs tabular-nums w-10 text-right">{opacity}%</span>
          </div>
        </Card>

        <Card className="lg:col-span-2 flex flex-col h-[640px]">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="size-9 rounded-lg gradient-primary grid place-items-center text-primary-foreground"><Bot className="size-4" /></div>
            <div>
              <h3 className="text-sm font-semibold">Explainability Assistant</h3>
              <p className="text-[11px] text-success flex items-center gap-1"><span className="size-1.5 rounded-full bg-success" /> Focused on the current heatmap</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`size-7 shrink-0 rounded-md grid place-items-center ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"}`}>
                  {m.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                </div>
                <div className={`max-w-[80%] text-sm rounded-2xl px-3.5 py-2.5 leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-secondary rounded-tl-sm"}`}>
                  {m.content || "…"}
                </div>
              </div>
            ))}
          </div>

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 pb-2">
              {QUICK.map((q) => (
                <button key={q} onClick={() => send(q)} className="text-[11px] px-2.5 py-1.5 rounded-full bg-secondary hover:bg-primary-soft hover:text-primary border border-border transition">{q}</button>
              ))}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 pt-2 border-t border-border">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about this Grad-CAM..." className="flex-1 h-10 rounded-lg bg-secondary/70 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            <button disabled={loading} className="size-10 grid place-items-center rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50"><Send className="size-4" /></button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title: string }) {
  return <button onClick={onClick} title={title} className="size-8 grid place-items-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground text-sm font-bold">{children}</button>;
}
