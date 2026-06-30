import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bot, User, Send, Sparkles, Copy, RotateCcw, Trash2 } from "lucide-react";
import { Card, PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — MedAI" }] }),
  component: Assistant,
});

const QUICK = [
  "What is bacterial pneumonia?",
  "Explain Grad-CAM",
  "Summarize my last report",
  "How do I read confidence scores?",
];

type Msg = { role: "user" | "assistant"; content: string };

function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }); }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context: "Dedicated AI Assistant page — general medical and platform questions." }),
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
    <div className="max-w-4xl mx-auto">
      <PageHeader title="AI Assistant" subtitle="Your medical AI companion"
        actions={
          <button onClick={() => setMessages([])} className="h-10 px-4 rounded-lg bg-secondary hover:bg-muted text-sm font-medium inline-flex items-center gap-2">
            <Trash2 className="size-4" /> Clear chat
          </button>
        }
      />

      <Card className="flex flex-col h-[68vh] !p-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="size-16 rounded-2xl gradient-primary grid place-items-center text-primary-foreground shadow-glow mb-4">
                <Sparkles className="size-7" />
              </div>
              <h3 className="text-xl font-bold">How can I help today?</h3>
              <p className="text-sm text-muted-foreground mt-1.5">Ask about diseases, reports, Grad-CAM, or how to use MedAI.</p>
              <div className="grid grid-cols-2 gap-2 mt-6 w-full">
                {QUICK.map((q) => (
                  <button key={q} onClick={() => send(q)} className="text-left text-xs p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary-soft/30 transition">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`size-8 shrink-0 rounded-lg grid place-items-center ${m.role === "user" ? "bg-primary text-primary-foreground" : "gradient-primary text-primary-foreground"}`}>
                  {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                </div>
                <div className="max-w-[80%] group">
                  <div className={`text-sm leading-relaxed rounded-2xl px-4 py-3 whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-secondary rounded-tl-sm"}`}>
                    {m.content || "…"}
                  </div>
                  {m.role === "assistant" && m.content && (
                    <div className="opacity-0 group-hover:opacity-100 transition flex gap-2 mt-1.5 px-1">
                      <button onClick={() => navigator.clipboard.writeText(m.content)} className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><Copy className="size-3" /> Copy</button>
                      <button onClick={() => send(messages[i - 1]?.content ?? "")} className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><RotateCcw className="size-3" /> Regenerate</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="border-t border-border p-4 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask MedAI Assistant..." className="flex-1 h-11 rounded-xl bg-secondary/70 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          <button disabled={loading || !input.trim()} className="h-11 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 inline-flex items-center gap-2 text-sm font-medium">
            <Send className="size-4" /> Send
          </button>
        </form>
      </Card>
    </div>
  );
}
