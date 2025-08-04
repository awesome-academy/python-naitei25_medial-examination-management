import { api } from "./api";
import type {
  Patient,
  PatientDto,
  EmergencyContact,
  EmergencyContactDto,
} from "../types/patient";

export const patientService = {
  /** Get all patients */
  async getAllPatients(): Promise<Patient[]> {
    const { data } = await api.get<Patient[]>("/patients");
    return data;
  },

  /** Get patient by ID */
  async getPatientById(patientId: number): Promise<Patient> {
    const { data } = await api.get<Patient>(`/patients/${patientId}`);
    return data;
  },

  /** Create a new patient */
  async createPatient(patientData: PatientDto): Promise<Patient> {
    const { data } = await api.post<Patient>("/patients", patientData);
    return data;
  },

  /** Update patient information */
  async updatePatient(
    patientId: string,
    patientData: Partial<PatientDto>
  ): Promise<Patient> {
    const { data } = await api.put<Patient>(
      `/patients/${patientId}`,
      patientData
    );
    return data;
  },

  /** Delete patient by ID */
  async deletePatient(patientId: number): Promise<string> {
    const { data } = await api.delete<string>(`/patients/${patientId}`);
    return data;
  },

  /** Search patient by identityNumber, insuranceNumber, or fullName */
  async searchPatient(params: {
    identityNumber?: string;
    insuranceNumber?: string;
    fullName?: string;
  }): Promise<Patient | null> {
    const query = new URLSearchParams(params).toString();
    const { data } = await api.get<Patient | null>(`/patients/search?${query}`);
    return data;
  },

  /** Get all emergency contacts for a patient */
  async getEmergencyContacts(patientId: number): Promise<EmergencyContact[]> {
    const { data } = await api.get<EmergencyContact[]>(
      `/patients/${patientId}/contacts`
    );
    return data;
  },

  /** Add an emergency contact */
  async addEmergencyContact(
    patientId: number,
    contactData: EmergencyContactDto
  ): Promise<EmergencyContact> {
    const { data } = await api.post<EmergencyContact>(
      `/patients/${patientId}/contacts`,
      contactData
    );
    return data;
  },

  /** Delete an emergency contact */
  async deleteEmergencyContact(
    patientId: number,
    contactId: number
  ): Promise<string> {
    const { data } = await api.delete<string>(
      `/patients/${patientId}/contacts/${contactId}`
    );
    return data;
  },
};
