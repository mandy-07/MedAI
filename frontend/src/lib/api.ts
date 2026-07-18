// ============================================================
// MedAI API Client
// ============================================================
// Reads VITE_API_URL from env — defaults to localhost:8000/api/v1
// In dev, Vite proxies /api → backend so CORS is never an issue.
// ============================================================

import type {
  BackendPrediction,
  ChatRequest,
  ChatResponse,
  HealthResponse,
  HistoryItem,
  ReportRequest,
  ReportResponse,
} from "./types";

// Base URL — set VITE_API_URL in .env to override
const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:8000/api/v1";

// ─── Helpers ───────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body?.detail ?? detail;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

// ─── Predict ───────────────────────────────────────────────

/**
 * Upload a chest X-ray and receive an AI prediction.
 * POST /predict/
 */
export async function predictXray(file: File): Promise<BackendPrediction> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/predict/`, {
    method: "POST",
    body: form,
  });
  return handleResponse<BackendPrediction>(res);
}

// ─── Report ────────────────────────────────────────────────

/**
 * Generate a PDF medical report and save to history.
 * POST /report/generate
 */
export async function generateReport(
  payload: ReportRequest
): Promise<ReportResponse> {
  const res = await fetch(`${API_BASE}/report/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<ReportResponse>(res);
}

/**
 * Build the absolute URL for a report or GradCAM asset.
 * Handles both relative paths (/reports/x.pdf) and full URLs.
 */
export function assetUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  // Derive base host from API_BASE (strip /api/v1)
  const base = API_BASE.replace(/\/api\/v1\/?$/, "");
  return `${base}${path}`;
}

// ─── History ───────────────────────────────────────────────

/** GET /history/?limit=100 */
export async function fetchHistory(limit = 100): Promise<HistoryItem[]> {
  const res = await fetch(`${API_BASE}/history?limit=${limit}`);
  const body = await handleResponse<{ success: boolean; data: HistoryItem[] }>(
    res
  );
  return body.data;
}

/** DELETE /history/{id} */
export async function deleteHistoryItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/history/${id}`, { method: "DELETE" });
  await handleResponse(res);
}

/** DELETE /history — clear all */
export async function clearHistory(): Promise<void> {
  const res = await fetch(`${API_BASE}/history`, { method: "DELETE" });
  await handleResponse(res);
}

// ─── Chat ──────────────────────────────────────────────────

/**
 * Send a message to the MedAI chatbot.
 * POST /chat/
 */
export async function sendChat(req: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return handleResponse<ChatResponse>(res);
}

// ─── Health ────────────────────────────────────────────────

/** GET /health */
export async function fetchHealth(): Promise<HealthResponse> {
  // Health is at the root, not under /api/v1
  const base = API_BASE.replace(/\/api\/v1\/?$/, "");
  const res = await fetch(`${base}/health`);
  return handleResponse<HealthResponse>(res);
}
