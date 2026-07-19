import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, Copy, MessageSquare, Bot, User, AlertCircle, Paperclip, X, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { sendChat, extractText } from "@/lib/api";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant — MedAI" },
      { name: "description", content: "Chat with MedAI to understand predictions, Grad-CAM and diseases." },
    ],
  }),
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const PROMPTS = [
  "Explain my report",
  "Explain Grad-CAM",
  "What is Pneumonia?",
  "What is Tuberculosis?",
  "Prevention tips for respiratory diseases",
];

// Canned fallbacks for instant offline responses
const CANNED: Record<string, string> = {
  "Explain Grad-CAM":
    "**Grad-CAM** (Gradient-weighted Class Activation Mapping) highlights the regions of an image that most influenced the model's decision.\n\n- Warm colors (red/orange) → high influence\n- Cool colors → low influence\n\nIt shows *where* the model looked, not *what* the disease is.",
  "What is Pneumonia?":
    "**Pneumonia** is an infection that inflames the air sacs in one or both lungs. Common symptoms:\n\n- Cough with phlegm\n- Fever, chills\n- Shortness of breath\n- Chest pain when breathing\n\nAlways seek clinical confirmation.",
  "What is Tuberculosis?":
    "**Tuberculosis (TB)** is a bacterial infection caused by *Mycobacterium tuberculosis* that mainly affects the lungs. Key signs:\n\n- Persistent cough (>3 weeks)\n- Night sweats\n- Unexplained weight loss\n- Blood in sputum",
  "Prevention tips for respiratory diseases":
    "General prevention:\n\n1. Avoid smoking and secondhand smoke\n2. Stay up to date on vaccines (flu, pneumococcal, COVID-19)\n3. Practice hand hygiene\n4. Wear masks in high-risk environments\n5. Regular exercise and healthy diet",
  "Explain my report":
    "Your MedAI report contains:\n\n- **Prediction** — the most likely condition\n- **Confidence** — how certain the model is\n- **Probability breakdown** — likelihood across all conditions\n- **Grad-CAM** — visual explanation of the model's attention\n- **Recommendation** — clinical next steps\n\nAlways review results with a qualified healthcare professional.",
};

let _conversationId: string | null = null;

function AssistantPage() {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your **MedAI assistant** powered by Groq AI. Ask me about predictions, Grad-CAM, or any of the detected conditions — I'm here to help you understand your results.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [offline, setOffline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5 MB limit");
      return;
    }

    setUploading(true);
    const toastId = toast.loading(`Uploading and extracting text from ${file.name}...`);
    try {
      const resp = await extractText(file);
      if (resp.success) {
        setAttachedFile({
          name: resp.filename,
          content: resp.text,
        });
        toast.success(`Attached ${resp.filename} successfully!`, { id: toastId });
      } else {
        toast.error("Failed to extract text from file.", { id: toastId });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to extract text";
      toast.error(`Error: ${msg}`, { id: toastId });
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const send = async (text: string) => {
    if (!text.trim()) return;

    const currentAttachment = attachedFile;
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setAttachedFile(null); // Clear attachment from UI once sent
    setTyping(true);

    try {
      const resp = await sendChat({
        message: text,
        report_context: currentAttachment ? currentAttachment.content : null,
        conversation_id: _conversationId,
      });

      if (resp.conversation_id) _conversationId = resp.conversation_id;

      setMsgs((m) => [...m, { role: "assistant", content: resp.response }]);
      setOffline(false);
    } catch {
      // Fallback to canned or generic offline reply
      const fallback =
        CANNED[text] ??
        `I'm currently unable to reach the AI backend. Here's what I know:\n\nFor any medical question, please consult a qualified healthcare professional. This tool provides AI-assisted insights only.`;
      setMsgs((m) => [...m, { role: "assistant", content: fallback }]);
      setOffline(true);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
          <MessageSquare className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold">AI Assistant</h1>
            {offline && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-600">
                <AlertCircle className="h-3 w-3" /> Offline fallback
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Ask about predictions, Grad-CAM and detected diseases.</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col shadow-card overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {msgs.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${m.role === "user" ? "bg-muted" : "bg-gradient-primary text-primary-foreground"}`}>
                {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`group max-w-[80%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50"}`}>
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-2 prose-ol:my-2 prose-strong:text-current">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
                {m.role === "assistant" && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(m.content); toast.success("Copied"); }}
                    className="mt-2 flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {typing && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-muted/50 px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {msgs.length <= 1 && (
          <div className="border-t px-6 py-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Suggested prompts</p>
            <div className="flex flex-wrap gap-2">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:border-primary/50 hover:bg-primary/5 transition"
                >
                  <Sparkles className="inline h-3 w-3 mr-1 text-primary" />{p}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t p-4 space-y-3">
          {attachedFile && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between rounded-lg bg-muted/60 border px-3 py-1.5 text-xs text-muted-foreground w-fit max-w-full"
            >
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <Paperclip className="h-3 w-3 text-primary shrink-0" />
                <span className="font-medium truncate">{attachedFile.name}</span>
                <span className="text-[10px] opacity-75">({(attachedFile.content.length / 1024).toFixed(1)} KB text context)</span>
              </div>
              <button
                onClick={() => setAttachedFile(null)}
                className="ml-3 hover:text-foreground shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}

          <div className="flex gap-2 items-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.json,.md,.csv,.pdf"
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              disabled={uploading || typing}
              className="h-11 w-11 rounded-xl shrink-0 border-border/60 hover:bg-muted"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>

            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
              placeholder="Ask about a prediction, Grad-CAM, or a specific disease…"
              rows={1}
              className="flex-1 min-h-[44px] resize-none rounded-xl"
            />
            <Button
              onClick={() => send(input)}
              disabled={typing || uploading || !input.trim()}
              className="h-11 w-11 rounded-xl bg-gradient-primary text-primary-foreground p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
