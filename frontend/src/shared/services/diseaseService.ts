import axios from "axios";

// Separate API instance for disease prediction service
const DISEASE_API_BASE_URL = "http://localhost:5001";

const diseaseApi = axios.create({
  baseURL: DISEASE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Symptom {
  key: string;
  name_en: string;
  name_vn: string;
}

export interface Disease {
  key: string;
  name_en: string;
  name_vn: string;
}

export interface PredictionResult {
  disease: string;
  disease_vn: string;
  probability: number;
}

export interface DiagnosisResponse {
  predicted_disease: string;
  predicted_disease_vn: string;
  confidence: number;
  top_predictions: PredictionResult[];
  input_symptoms: string[];
}

export interface ParseSymptomsResponse {
  matched_symptoms: string[];
  matched_symptoms_vn: string[];
  suggestions: string[];
  suggestions_vn: string[];
}

export const diseaseService = {
  /** Get all available symptoms */
  async getSymptoms(): Promise<{ symptoms: string[]; symptoms_vn: string[] }> {
    try {
      const { data } = await diseaseApi.get("/api/symptoms");
      return data;
    } catch (error: any) {
      throw new Error(`Failed to fetch symptoms: ${error.message}`);
    }
  },

  /** Get all available diseases */
  async getDiseases(): Promise<{ diseases: string[]; diseases_vn: string[] }> {
    try {
      const { data } = await diseaseApi.get("/api/diseases");
      return data;
    } catch (error: any) {
      throw new Error(`Failed to fetch diseases: ${error.message}`);
    }
  },

  /** Predict disease based on symptoms */
  async predictDisease(symptoms: string[]): Promise<DiagnosisResponse> {
    try {
      const { data } = await diseaseApi.post("/api/predict", { symptoms });
      return data;
    } catch (error: any) {
      throw new Error(`Failed to predict disease: ${error.message}`);
    }
  },

  /** Parse symptoms from text and get suggestions */
  async parseSymptoms(text: string, chosen: string[] = []): Promise<ParseSymptomsResponse> {
    try {
      const { data } = await diseaseApi.post("/api/parse-symptoms", { text, chosen });
      return data;
    } catch (error: any) {
      throw new Error(`Failed to parse symptoms: ${error.message}`);
    }
  },

  /** Check if disease service is available */
  async checkHealth(): Promise<boolean> {
    try {
      await diseaseApi.get("/api/symptoms");
      return true;
    } catch (error) {
      return false;
    }
  },
};
