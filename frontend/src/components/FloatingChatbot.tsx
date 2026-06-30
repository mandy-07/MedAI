import { useEffect, useRef, useState } from "react";
import { Bot, X, Send, Sparkles, User } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

type Msg = { role: "user" | "assistant"; content: string };

const PAGE_CTX: Record<string, string> = {
  "/": "Dashboard — global statistics and recent activity.",
  "/new-diagnosis": "New Diagnosis — uploading a chest X-ray for AI analysis.",
  "/history": "Prediction History — list of past diagnoses.",
  "/reports": "Medical Reports — generated PDF reports.",
  "/explainable-ai": "Explainable AI — Grad-CAM heatmap visualization.",
  "/assistant": "AI Assistant — full medical chat workspace.",
  "/analytics": "Analytics — performance and trend dashboards.",
  "/settings": "Settings.",
  "/about": "About the MedAI project.",
};

const QUICK = [
  "Explain my diagnosis",
  "What is pneumonia?",
  "Explain Grad-CAM",
  "Help me use MedAI",
];

export function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm your MedAI assistant. Ask me anything about your diagnosis, Grad-CAM, or how to use the platform." },
  ]);
  const [loading, setLoading] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context: PAGE_CTX[pathname] ?? pathname }),
      });
      if (!res.ok || !res.body) throw new Error("Network");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { ...copy[copy.length - 1], content: copy[copy.length - 1].content + chunk };
          return copy;
        });
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "I couldn't reach the AI service. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 size-14 rounded-full gradient-primary text-primary-foreground grid place-items-center shadow-glow animate-pulse-glow hover:scale-105 transition-transform"
          aria-label="Open AI assistant"
        >
          <Bot className="size-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-3rem)] card-surface shadow-elevated flex flex-col animate-slide-up overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg gradient-primary grid place-items-center text-primary-foreground">
                <Sparkles className="size-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">MedAI Assistant</div>
                <div className="text-[11px] text-success flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-success" /> Context-aware · online
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="size-8 grid place-items-center rounded-md hover:bg-secondary">
              <X className="size-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`size-7 shrink-0 rounded-md grid place-items-center ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"}`}>
                  {m.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                </div>
                <div className={`max-w-[78%] text-sm leading-relaxed rounded-2xl px-3.5 py-2.5 ${m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-secondary text-foreground rounded-tl-sm"}`}>
                  {m.content || <TypingDots />}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-2">
                <div className="size-7 rounded-md bg-primary-soft text-primary grid place-items-center"><Bot className="size-3.5" /></div>
                <div className="bg-secondary rounded-2xl rounded-tl-sm px-3.5 py-3"><TypingDots /></div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="px-3.5 pb-2 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button key={q} onClick={() => send(q)} className="text-[11px] px-2.5 py-1.5 rounded-full bg-secondary hover:bg-primary-soft hover:text-primary border border-border transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="border-t border-border p-3 flex items-center gap-2 bg-card"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask MedAI..."
              className="flex-1 h-10 rounded-lg bg-secondary/70 px-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} className="size-10 grid place-items-center rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors">
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center h-4">
      <span className="size-1.5 bg-muted-foreground rounded-full typing-dot" />
      <span className="size-1.5 bg-muted-foreground rounded-full typing-dot" style={{ animationDelay: "0.15s" }} />
      <span className="size-1.5 bg-muted-foreground rounded-full typing-dot" style={{ animationDelay: "0.3s" }} />
    </div>
  );
}
