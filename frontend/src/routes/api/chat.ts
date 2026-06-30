import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM_PROMPT = `You are MedAI Assistant, an AI medical companion embedded in the MedAI radiology platform.

You help clinicians and students understand:
- Chest X-ray diagnoses (Normal, Bacterial Pneumonia, Viral Pneumonia, Tuberculosis, Coronavirus Disease)
- Explainable AI / Grad-CAM heatmaps and what highlighted regions mean
- Confidence scores, risk levels, and medical reports
- Navigation and features of the MedAI platform

Style: concise, professional, warm. Use short paragraphs and bullet points. Render markdown.
Always remind users that AI outputs are decision-support, not a replacement for a qualified radiologist.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          messages?: ChatMessage[];
          context?: string;
        };
        const messages = Array.isArray(body.messages) ? body.messages : [];
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const systemContent = body.context
          ? `${SYSTEM_PROMPT}\n\nCurrent page context: ${body.context}`
          : SYSTEM_PROMPT;

        const result = streamText({
          model,
          messages: [
            { role: "system", content: systemContent },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
        });

        return result.toTextStreamResponse();
      },
    },
  },
});
