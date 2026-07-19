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

const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      if (envUrl?.includes("localhost")) {
        return envUrl.replace("localhost", hostname);
      }
      if (envUrl?.includes("127.0.0.1")) {
        return envUrl.replace("127.0.0.1", hostname);
      }
      // If no env is defined, fallback to port 8000 on current hostname
      if (!envUrl) {
        return `http://${hostname}:8000/api/v1`;
      }
    }
  }
  return envUrl ?? "http://127.0.0.1:8000/api/v1";
};

const API_BASE = getApiBase();

// ─── Helpers ───────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) {
        if (typeof body.detail === "string") {
          detail = body.detail;
        } else if (Array.isArray(body.detail)) {
          // Format validation error list from FastAPI/Pydantic
          detail = body.detail
            .map((err: any) => {
              const field = err.loc ? err.loc.slice(1).join(".") : "";
              return `${field ? field + ": " : ""}${err.msg}`;
            })
            .join("; ");
        } else if (typeof body.detail === "object") {
          detail = JSON.stringify(body.detail);
        }
      }
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
export async function predictXray(
  file: File,
  patientName?: string,
  age?: number,
  gender?: string,
  symptoms?: string
): Promise<BackendPrediction> {
  const form = new FormData();
  form.append("file", file);
  if (patientName) form.append("patient_name", patientName);
  if (age !== undefined) form.append("age", String(age));
  if (gender) form.append("gender", gender);
  if (symptoms) form.append("symptoms", symptoms);

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

/**
 * Upload a file to extract its text contents for chatbot context.
 * POST /chat/extract-text
 */
export async function extractText(
  file: File
): Promise<{ success: boolean; filename: string; text: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/chat/extract-text`, {
    method: "POST",
    body: form,
  });
  return handleResponse<{ success: boolean; filename: string; text: string }>(res);
}
