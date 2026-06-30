// src/api/medai.ts

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error(
    "VITE_API_URL is not defined. Please add it to your frontend/.env file.",
  );
}

export const DEFAULT_TIMEOUT = 60000;

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
    });

    if (response.status === 422) {
      throw new Error("Invalid request sent to the backend.");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => null);

      throw new Error(
        error?.detail ||
          error?.message ||
          `Request failed with status ${response.status}`,
      );
    }

    return (await response.json()) as T;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out.");
    }

    if (err instanceof TypeError) {
      throw new Error(
        "Unable to connect to the backend. Make sure the FastAPI server is running.",
      );
    }

    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/* -------------------------------------------------------------------------- */
/*                               Prediction API                               */
/* -------------------------------------------------------------------------- */

export interface PredictionItem {
  disease: string;
  confidence: number;
}

export interface PneumoniaSubtype {
  bacterial: number;
  viral: number;
}

export interface PredictionResponse {
  success?: boolean;

  diagnosis: string;
  predicted_class: string;
  confidence: number;

  risk_level: string;
  requires_medical_attention: boolean;

  recommendation: string;

  probabilities: Record<string, number>;

  top_predictions?: PredictionItem[];

  subtypes?: PneumoniaSubtype;

  gradcam_url?: string;

  explanation?: string;
}

/* -------------------------------------------------------------------------- */
/*                                Patient Info                                */
/* -------------------------------------------------------------------------- */

export interface PatientInfo {
  patient_id?: string;

  name: string;

  age: number;

  gender: "Male" | "Female" | "Other";

  examination_date?: string;
}

/* -------------------------------------------------------------------------- */
/*                             Report Generation                              */
/* -------------------------------------------------------------------------- */

export interface PredictionInfo {
  diagnosis: string;

  predicted_class: string;

  confidence: number;

  risk_level: string;

  recommendation: string;

  bacterial_probability?: number;

  viral_probability?: number;
}

export interface ReportRequest {
  patient: PatientInfo;

  prediction: PredictionInfo;

  original_image_path?: string;

  gradcam_path?: string;

  notes?: string;
}

export interface ReportResponse {
  success?: boolean;

  message: string;

  report_url: string;

  generated_at: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Chat API                                  */
/* -------------------------------------------------------------------------- */

export interface ChatRequest {
  message: string;

  prediction_context?: Record<string, unknown>;

  report_context?: string;

  conversation_id?: string;
}

export interface ChatResponse {
  success?: boolean;

  response: string;

  conversation_id?: string;

  timestamp: string;
}

/* -------------------------------------------------------------------------- */
/*                                History API                                 */
/* -------------------------------------------------------------------------- */

export interface HistoryResponse {
  success?: boolean;

  count: number;

  data: any[];
}

export interface CountResponse {
  success?: boolean;

  count: number;
}

/* -------------------------------------------------------------------------- */
/*                                  Endpoints                                 */
/* -------------------------------------------------------------------------- */

export const healthCheck = () => apiFetch("/health");

export async function predict(
  file: File,
): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<PredictionResponse>("/predict", {
    method: "POST",
    body: formData,
  });
}

export const generateReport = (data: ReportRequest) =>
  apiFetch<ReportResponse>("/report/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

export const getHistory = (limit = 100, skip = 0) =>
  apiFetch<HistoryResponse>(
    `/history?limit=${limit}&skip=${skip}`,
  );

export const getHistoryCount = () =>
  apiFetch<CountResponse>("/history/count");

export const getHistoryById = (id: string) =>
  apiFetch(`/history/${id}`);

export const deleteHistory = (id: string) =>
  apiFetch(`/history/${id}`, {
    method: "DELETE",
  });

export const clearHistory = () =>
  apiFetch("/history", {
    method: "DELETE",
  });

export const sendChatMessage = (payload: ChatRequest) =>
  apiFetch<ChatResponse>("/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export { API_URL };