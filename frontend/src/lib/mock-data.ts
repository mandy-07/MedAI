export type Diagnosis = "Normal" | "Pneumonia" | "Tuberculosis" | "Coronavirus Disease";
export type Risk = "Low" | "Moderate" | "High" | "Critical";

export interface Prediction {
  id: string;
  patientName: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  diagnosis: Diagnosis;
  confidence: number;
  risk: Risk;
  date: string;
  probabilities: Record<Diagnosis, number>;
  recommendation: string;
  symptoms?: string;
}

export const riskFromDiagnosis = (d: Diagnosis, confidence: number): Risk => {
  if (d === "Normal") return "Low";
  if (d === "Pneumonia") return confidence > 0.8 ? "High" : "Moderate";
  if (d === "Tuberculosis") return "High";
  return confidence > 0.75 ? "Critical" : "High";
};

export const recommendationFor = (d: Diagnosis): string => {
  switch (d) {
    case "Normal":
      return "No abnormalities detected. Continue routine health check-ups. This prediction should not replace clinical diagnosis.";
    case "Pneumonia":
      return "Signs consistent with pneumonia. Consult a qualified healthcare professional for further evaluation and treatment. This prediction should not replace clinical diagnosis.";
    case "Tuberculosis":
      return "Findings suggestive of tuberculosis. Immediate medical consultation is strongly recommended. This prediction should not replace clinical diagnosis.";
    case "Coronavirus Disease":
      return "Patterns consistent with viral pneumonia (COVID-19). Isolate and seek urgent medical evaluation. This prediction should not replace clinical diagnosis.";
  }
};

export const seedPredictions: Prediction[] = [
  {
    id: "px_001",
    patientName: "Aarav Sharma",
    age: 34,
    gender: "Male",
    diagnosis: "Normal",
    confidence: 0.94,
    risk: "Low",
    date: "2026-07-16T09:22:00Z",
    probabilities: { Normal: 0.94, Pneumonia: 0.03, Tuberculosis: 0.02, "Coronavirus Disease": 0.01 },
    recommendation: recommendationFor("Normal"),
  },
  {
    id: "px_002",
    patientName: "Priya Verma",
    age: 52,
    gender: "Female",
    diagnosis: "Pneumonia",
    confidence: 0.88,
    risk: "High",
    date: "2026-07-15T14:11:00Z",
    probabilities: { Normal: 0.05, Pneumonia: 0.88, Tuberculosis: 0.05, "Coronavirus Disease": 0.02 },
    recommendation: recommendationFor("Pneumonia"),
  },
  {
    id: "px_003",
    patientName: "Rahul Iyer",
    age: 41,
    gender: "Male",
    diagnosis: "Tuberculosis",
    confidence: 0.81,
    risk: "High",
    date: "2026-07-14T11:03:00Z",
    probabilities: { Normal: 0.06, Pneumonia: 0.1, Tuberculosis: 0.81, "Coronavirus Disease": 0.03 },
    recommendation: recommendationFor("Tuberculosis"),
  },
  {
    id: "px_004",
    patientName: "Sara Khan",
    age: 29,
    gender: "Female",
    diagnosis: "Coronavirus Disease",
    confidence: 0.79,
    risk: "Critical",
    date: "2026-07-12T08:44:00Z",
    probabilities: { Normal: 0.04, Pneumonia: 0.12, Tuberculosis: 0.05, "Coronavirus Disease": 0.79 },
    recommendation: recommendationFor("Coronavirus Disease"),
  },
  {
    id: "px_005",
    patientName: "Devansh Roy",
    age: 63,
    gender: "Male",
    diagnosis: "Normal",
    confidence: 0.91,
    risk: "Low",
    date: "2026-07-10T16:20:00Z",
    probabilities: { Normal: 0.91, Pneumonia: 0.05, Tuberculosis: 0.02, "Coronavirus Disease": 0.02 },
    recommendation: recommendationFor("Normal"),
  },
];

const STORAGE_KEY = "medai_predictions_v1";

export const loadPredictions = (): Prediction[] => {
  if (typeof window === "undefined") return seedPredictions;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedPredictions;
    return JSON.parse(raw) as Prediction[];
  } catch {
    return seedPredictions;
  }
};

export const savePredictions = (list: Prediction[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

export const riskColor = (risk: Risk): string => {
  switch (risk) {
    case "Low": return "bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/30";
    case "Moderate": return "bg-[color:var(--warning)]/15 text-[color:var(--warning)] border-[color:var(--warning)]/30";
    case "High": return "bg-[color:var(--risk-high)]/15 text-[color:var(--risk-high)] border-[color:var(--risk-high)]/30";
    case "Critical": return "bg-[color:var(--risk-critical)]/15 text-[color:var(--risk-critical)] border-[color:var(--risk-critical)]/30";
  }
};
