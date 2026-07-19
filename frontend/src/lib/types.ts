// ============================================================
// Backend API Types — mirrors FastAPI Pydantic schemas exactly
// ============================================================

/** Raw response from POST /predict/ */
export interface BackendPrediction {
  success: boolean;
  diagnosis: string; // e.g. "Pneumonia", "Normal"
  predicted_class: string; // e.g. "Bacterial Pneumonia"
  confidence: number; // 0–100
  risk_level: string; // "Low" | "Moderate" | "High"
  requires_medical_attention: boolean;
  recommendation: string;
  /** { "Normal": 1.24, "Bacterial Pneumonia": 92.61, ... } — values 0-100 */
  probabilities: Record<string, number>;
  top_predictions: { disease: string; confidence: number }[];
  subtypes: { bacterial: number; viral: number } | null;
  gradcam_url: string | null; // e.g. "/gradcam/abc123.png"
  report_url?: string | null;
  explanation: string | null;
}

/** Single item returned by GET /history/ */
export interface HistoryItem {
  _id: string;
  patient: {
    patient_name: string;
    age: number;
    gender: "Male" | "Female" | "Other";
    examination_date: string;
  };
  prediction: {
    diagnosis: string;
    predicted_class: string;
    confidence: number;
    risk_level: string;
    recommendation: string;
    bacterial_probability?: number | null;
    viral_probability?: number | null;
  };
  report_path: string | null;
  gradcam_path: string | null;
  created_at: string;
}

/** POST /report/generate request body */
export interface ReportRequest {
  patient: {
    patient_name: string;
    age: number;
    gender: "Male" | "Female" | "Other";
  };
  prediction: {
    diagnosis: string;
    predicted_class: string;
    confidence: number;
    risk_level: string;
    recommendation: string;
    bacterial_probability?: number;
    viral_probability?: number;
  };
  original_image_path?: string | null;
  gradcam_url?: string | null;
  notes?: string | null;
}

/** POST /report/generate response */
export interface ReportResponse {
  success: boolean;
  message: string;
  report_url: string;
  generated_at: string;
}

/** POST /chat/ request */
export interface ChatRequest {
  message: string;
  prediction_context?: string | null;
  report_context?: string | null;
  conversation_id?: string | null;
}

/** POST /chat/ response */
export interface ChatResponse {
  success: boolean;
  response: string;
  conversation_id?: string | null;
}

/** GET /health response */
export interface HealthResponse {
  status: string;
  database: string;
  model: string;
}
