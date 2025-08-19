import { api } from "../../../shared/services/api";
import i18n from "../../../i18n";
import { handleApiError } from "../../../shared/utils/errorHandler"
import type {
  Patient,
  RawPatientFromAPI,
  CreatePatientRequest,
  PatientUpdateDto,
  EmergencyContact,
  EmergencyContactDto,
} from "../types/patient";

const mapRawPatientToFrontend = (rawPatient: RawPatientFromAPI): Patient => {
  // Calculate age
  let age: number | undefined;
  if (rawPatient.birthday) {
    const birthDate = new Date(rawPatient.birthday);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  // Map emergency contacts
  const emergencyContacts: EmergencyContact[] =
    rawPatient.emergency_contacts?.map((contact) => ({
      contactId: contact.id,
      patientId: contact.patient_id,
      contactName: contact.contact_name,
      contactPhone: contact.contact_phone,
      relationship: contact.relationship as "FAMILY" | "FRIEND" | "OTHERS",
      createdAt: contact.created_at,
    })) || [];

  return {
    patientId: rawPatient.id,
    userId: rawPatient.user,
    identityNumber: rawPatient.identity_number,
    insuranceNumber: rawPatient.insurance_number,
    fullName: `${rawPatient.first_name} ${rawPatient.last_name}`.trim(),
    birthday: rawPatient.birthday,
    phone: rawPatient.phone,
    email: rawPatient.email,
    avatar: rawPatient.avatar || "",
    gender:
      rawPatient.gender === "M"
        ? "MALE"
        : rawPatient.gender === "F"
        ? "FEMALE"
        : "OTHER",
    address: rawPatient.address,
    allergies: rawPatient.allergies || "",
    height: rawPatient.height || undefined,
    weight: rawPatient.weight || undefined,
    bloodType: rawPatient.blood_type as
      | "A+"
      | "A-"
      | "B+"
      | "B-"
      | "AB+"
      | "AB-"
      | "O+"
      | "O-"
      | undefined,
    createdAt: rawPatient.created_at,
    emergencyContacts: emergencyContacts,
    age: age,
  };
};

const mapPatientToBackend = (patientData: any): any => {
  const backendData: any = {};

  // Map gender
  if (patientData.gender !== undefined) {
    backendData.gender =
      patientData.gender === "MALE"
        ? "M"
        : patientData.gender === "FEMALE"
        ? "F"
        : patientData.gender === "F"
        ? "F"
        : "O";
  }

  // Map fullName → first_name + last_name
  if (patientData.fullName) {
    const parts = patientData.fullName.trim().split(" ");
    backendData.first_name = parts[0];
    backendData.last_name = parts.slice(1).join(" ");
  }

  // Map camelCase → snake_case
  if (patientData.identityNumber !== undefined) {
    backendData.identity_number = patientData.identityNumber;
  }
  if (patientData.insuranceNumber !== undefined) {
    backendData.insurance_number = patientData.insuranceNumber;
  }
  if (patientData.bloodType !== undefined) {
    backendData.blood_type = patientData.bloodType;
  }

  // Các field giữ nguyên
  if (patientData.address !== undefined) backendData.address = patientData.address;
  if (patientData.allergies !== undefined) backendData.allergies = patientData.allergies;
  if (patientData.avatar !== undefined) backendData.avatar = patientData.avatar;
  if (patientData.birthday !== undefined) backendData.birthday = patientData.birthday;
  if (patientData.phone !== undefined) backendData.phone = patientData.phone;
  if (patientData.email !== undefined) backendData.email = patientData.email;
  if (patientData.height !== undefined) backendData.height = patientData.height;
  if (patientData.weight !== undefined) backendData.weight = patientData.weight;

  // Map emergency contacts
  if (patientData.emergencyContactDtos) {
    backendData.emergency_contacts = patientData.emergencyContactDtos.map((contact: any) => ({
      contact_name: contact.contactName,
      contact_phone: contact.contactPhone,
      relationship: contact.relationship,
    }));
  }

  return backendData;
};

export const patientService = {
  /** Get all patients */
  async getAllPatients(): Promise<Patient[]> {
    try {
      const { data } = await api.get<RawPatientFromAPI[]>("/patients/");
      return data.map(mapRawPatientToFrontend);
    } catch (error: any) {
      console.error("Error fetching patients:", error);
      throw new Error("Không thể tải danh sách bệnh nhân");
    }
  },

  /** Get patient by ID */
  async getPatientById(patientId: number): Promise<Patient> {
    try {
      const { data } = await api.get<RawPatientFromAPI>(
        `/patients/${patientId}/`
      );
      return mapRawPatientToFrontend(data);
    } catch (error: any) {
      console.error(`Error fetching patient ${patientId}:`, error);
      throw new Error(i18n.t("services.patient.patientNotFound"));
    }
  },

  /** Create a new patient */
  async createPatient(patientData: CreatePatientRequest): Promise<Patient> {
    try {
      const backendData = mapPatientToBackend(patientData);
      const { data } = await api.post<RawPatientFromAPI>(
        "/patients/",
        backendData
      );
      return mapRawPatientToFrontend(data);
    } catch (error: any) {
      console.error("Error creating patient:", error);
      let errorMessage = "Không thể tạo bệnh nhân mới";
      if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error.response?.data) {
        errorMessage += `: ${JSON.stringify(error.response.data)}`;
      }
      throw new Error(errorMessage);
    }
  },

  /** Update patient information */
  async updatePatient(
    patientId: number,
    patientData: Partial<PatientUpdateDto>
  ): Promise<Patient> {
    try {
      const backendData = mapPatientToBackend(patientData);
      const { data } = await api.patch<RawPatientFromAPI>(
        `/patients/${patientId}/`,
        backendData
      );
      return mapRawPatientToFrontend(data);
    } catch (error: any) {
      console.error(`Error updating patient ${patientId}:`, error);
      let errorMessage = "Không thể cập nhật thông tin bệnh nhân";
      if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error.response?.data) {
        errorMessage += `: ${JSON.stringify(error.response.data)}`;
      }
      throw new Error(errorMessage);
    }
  },

  /** Delete patient by ID */
  async deletePatient(patientId: number): Promise<string> {
    try {
      const { data } = await api.delete<string>(`/patients/${patientId}/`);
      return data;
    } catch (error: any) {
      console.error(`Error deleting patient ${patientId}:`, error);
      throw new Error("Không thể xóa bệnh nhân");
    }
  },

  /** Get all emergency contacts for a patient */
  async getEmergencyContacts(patientId: number): Promise<EmergencyContact[]> {
    try {
      const { data } = await api.get<EmergencyContact[]>(
        `/patients/${patientId}/contacts/`
      );
      return data;
    } catch (error: any) {
      console.error(
        `Error fetching emergency contacts for patient ${patientId}:`,
        error
      );
      throw new Error("Không thể tải danh sách liên hệ khẩn cấp");
    }
  },

  /** Add an emergency contact */
async addEmergencyContact(
  patientId: number,
  contactData: EmergencyContactDto
): Promise<EmergencyContact> {
  const payload = {
    contact_name: contactData.contactName,
    contact_phone: contactData.contactPhone,
    relationship: contactData.relationship,
  };
  const { data } = await api.post<EmergencyContact>(
    `/patients/${patientId}/contacts/`,
    payload
  );
  return data;
},

  /** Update emergency contact */
/** Update emergency contact */
async updateEmergencyContact(
  patientId: number,
  contactId: number,
  contactData: EmergencyContactDto
): Promise<EmergencyContact> {
  try {
    const payload = {
      contact_name: contactData.contactName,
      contact_phone: contactData.contactPhone,
      relationship: contactData.relationship,
    };

    const { data } = await api.patch<EmergencyContact>(
      `/patients/${patientId}/contacts/${contactId}/`,
      payload
    );
    return data;
  } catch (error: any) {
    console.error(
      `Error updating emergency contact ${contactId} for patient ${patientId}:`,
      error
    );
    throw new Error("Không thể cập nhật liên hệ khẩn cấp");
  }
},

  /** Delete an emergency contact */
  async deleteEmergencyContact(
    patientId: number,
    contactId: number
  ): Promise<string> {
    try {
      const { data } = await api.delete<string>(
        `/patients/${patientId}/contacts/${contactId}/`
      );
      return data;
    } catch (error: any) {
      console.error(
        `Error deleting emergency contact ${contactId} for patient ${patientId}:`,
        error
      );
      throw new Error("Không thể xóa liên hệ khẩn cấp");
    }
  },
};
