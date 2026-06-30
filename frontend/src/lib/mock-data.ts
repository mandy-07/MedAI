export type Disease =
  | "Normal"
  | "Bacterial Pneumonia"
  | "Viral Pneumonia"
  | "Tuberculosis"
  | "Coronavirus Disease";

export type Risk = "Low" | "Moderate" | "High";

export interface Prediction {
  id: string;
  date: string;
  patient: string;
  patientId: string;
  age: number;
  gender: "Male" | "Female";
  diagnosis: Disease;
  confidence: number;
  risk: Risk;
  probabilities: Record<Disease, number>;
}

export const DISEASES: Disease[] = [
  "Normal",
  "Bacterial Pneumonia",
  "Viral Pneumonia",
  "Tuberculosis",
  "Coronavirus Disease",
];

const names = [
  "Aarav Sharma", "Priya Patel", "Rahul Verma", "Ananya Singh", "Vikram Kumar",
  "Neha Gupta", "Arjun Reddy", "Diya Mehta", "Karan Joshi", "Saanvi Iyer",
  "Rohan Das", "Isha Nair", "Aditya Malhotra", "Riya Chatterjee", "Yash Bose",
];

function pickRisk(diagnosis: Disease, conf: number): Risk {
  if (diagnosis === "Normal") return "Low";
  if (conf > 0.85 && diagnosis !== "Viral Pneumonia") return "High";
  if (conf > 0.7) return "Moderate";
  return "Low";
}

function makeProbs(primary: Disease, conf: number): Record<Disease, number> {
  const rest = 1 - conf;
  const others = DISEASES.filter((d) => d !== primary);
  const r: Record<string, number> = { [primary]: conf };
  let remaining = rest;
  others.forEach((d, i) => {
    const v = i === others.length - 1 ? remaining : remaining * Math.random() * 0.6;
    r[d] = Math.max(0.005, v);
    remaining -= r[d];
  });
  return r as Record<Disease, number>;
}

export const PREDICTIONS: Prediction[] = Array.from({ length: 28 }).map((_, i) => {
  const diagnosis = DISEASES[i % DISEASES.length];
  const conf = 0.62 + Math.random() * 0.36;
  const name = names[i % names.length];
  const date = new Date(Date.now() - i * 86400000 * 0.6).toISOString();
  return {
    id: `PRD-${String(1000 + i)}`,
    date,
    patient: name,
    patientId: `PAT-${String(2300 + i)}`,
    age: 22 + ((i * 7) % 55),
    gender: i % 2 === 0 ? "Male" : "Female",
    diagnosis,
    confidence: Number(conf.toFixed(3)),
    risk: pickRisk(diagnosis, conf),
    probabilities: makeProbs(diagnosis, conf),
  };
});

export const STATS = {
  totalPredictions: PREDICTIONS.length + 1872,
  todayPredictions: 14,
  reportsGenerated: PREDICTIONS.length + 1641,
  avgConfidence: Math.round(
    (PREDICTIONS.reduce((s, p) => s + p.confidence, 0) / PREDICTIONS.length) * 1000
  ) / 10,
};

export const TREND_DATA = Array.from({ length: 14 }).map((_, i) => ({
  day: `D${i + 1}`,
  predictions: 6 + Math.floor(Math.random() * 22),
  highRisk: Math.floor(Math.random() * 6),
}));

export const DISEASE_DISTRIBUTION = DISEASES.map((d) => ({
  name: d,
  value: PREDICTIONS.filter((p) => p.diagnosis === d).length + Math.floor(Math.random() * 60) + 30,
}));

export const CONFIDENCE_BUCKETS = [
  { range: "60-70%", count: 18 },
  { range: "70-80%", count: 42 },
  { range: "80-90%", count: 96 },
  { range: "90-100%", count: 124 },
];

export const MONTHLY_PREDICTIONS = [
  { month: "Jan", predictions: 142 }, { month: "Feb", predictions: 168 },
  { month: "Mar", predictions: 195 }, { month: "Apr", predictions: 210 },
  { month: "May", predictions: 248 }, { month: "Jun", predictions: 276 },
  { month: "Jul", predictions: 312 }, { month: "Aug", predictions: 298 },
];

export const ACCURACY_TREND = Array.from({ length: 12 }).map((_, i) => ({
  month: `M${i + 1}`,
  accuracy: 88 + Math.random() * 7,
}));
