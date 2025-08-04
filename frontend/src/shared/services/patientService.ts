import { api } from "./api"
import { handleApiError } from "../utils/errorHandler"
import i18n from "../../i18n"
import type { Patient, PatientDto, EmergencyContact, EmergencyContactDto } from "../types/patient"

export const patientService = {
  /** Get all patients */
  async getAllPatients(): Promise<Patient[]> {
    try {
      const { data } = await api.get<Patient[]>("/patients")
      return data
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  },

  /** Get patient by ID */
  async getPatientById(patientId: number): Promise<Patient> {
    try {
      const { data } = await api.get<Patient>(`/patients/${patientId}`)
      return data
    } catch (error: any) {
      throw new Error(handleApiError(error, false) || i18n.t("services.patient.patientNotFound"))
    }
  },

  /** Create a new patient */
  async createPatient(patientData: PatientDto): Promise<Patient> {
    try {
      const { data } = await api.post<Patient>("/patients", patientData)
      return data
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  },

  /** Update patient information */
  async updatePatient(patientId: string, patientData: Partial<PatientDto>): Promise<Patient> {
    try {
      const { data } = await api.put<Patient>(`/patients/${patientId}`, patientData)
      return data
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  },

  /** Delete patient by ID */
  async deletePatient(patientId: number): Promise<string> {
    try {
      const { data } = await api.delete<string>(`/patients/${patientId}`)
      return data
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  },

  /** Search patient by identityNumber, insuranceNumber, or fullName */
  async searchPatient(params: {
    identityNumber?: string
    insuranceNumber?: string
    fullName?: string
  }): Promise<Patient | null> {
    try {
      const query = new URLSearchParams(params).toString()
      const { data } = await api.get<Patient | null>(`/patients/search?${query}`)
      return data
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  },

  /** Get all emergency contacts for a patient */
  async getEmergencyContacts(patientId: number): Promise<EmergencyContact[]> {
    try {
      const { data } = await api.get<EmergencyContact[]>(`/patients/${patientId}/contacts`)
      return data
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  },

  /** Add an emergency contact */
  async addEmergencyContact(patientId: number, contactData: EmergencyContactDto): Promise<EmergencyContact> {
    try {
      const { data } = await api.post<EmergencyContact>(`/patients/${patientId}/contacts`, contactData)
      return data
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  },

  /** Delete an emergency contact */
  async deleteEmergencyContact(patientId: number, contactId: number): Promise<string> {
    try {
      const { data } = await api.delete<string>(`/patients/${patientId}/contacts/${contactId}`)
      return data
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  },
}
