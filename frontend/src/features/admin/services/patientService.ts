import { api } from "../../../shared/services/api";
import type {
  Patient,
  PatientDto,
  EmergencyContact,
  EmergencyContactDto,
  CreatePatientRequest,
  RoomDetail,
  RoomDetailDto,
  PatientRoom,
} from "../types/patient";

export const patientService = {
  // Get all patients (alias for getPatients for backward compatibility)
  async getAllPatients(): Promise<Patient[]> {
    try {
      const response = await api.get<Patient[]>('/patients');
      return response.data;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw new Error('Không thể tải danh sách bệnh nhân');
    }
  },

  // Get all patients
  async getPatients(): Promise<{ data: Patient[] }> {
    try {
      const response = await api.get<Patient[]>('/patients');
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw new Error('Không thể tải danh sách bệnh nhân');
    }
  },

  // Get patient by ID
  async getPatientById(patientId: number): Promise<{ data: Patient }> {
    try {
      const response = await api.get<Patient>(`/patients/${patientId}`);
      return { data: response.data };
    } catch (error) {
      console.error(`Error fetching patient ${patientId}:`, error);
      throw new Error('Không thể tải thông tin bệnh nhân');
    }
  },

  async createPatient(patientData: any): Promise<CreatePatientRequest> {
    const response = await api.post<CreatePatientRequest>(
      "/patients/add-patient",
      patientData
    );
    return response.data;
  },

  // Search patient
  async searchPatient(params: {
    identityNumber?: string;
    insuranceNumber?: string;
    fullName?: string;
  }): Promise<Patient | null> {
    try {
      const response = await api.get<Patient[]>('/patients/search', { params });
      return response.data[0] || null;
    } catch (error) {
      console.error('Error searching patient:', error);
      throw new Error('Không thể tìm kiếm bệnh nhân');
    }
  },

  // Update patient
  async updatePatient(patientId: number, data: Partial<Patient>): Promise<Patient> {
    try {
      const response = await api.put<Patient>(`/patients/${patientId}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating patient ${patientId}:`, error);
      throw new Error('Không thể cập nhật thông tin bệnh nhân');
    }
  },

  // Delete patient
  async deletePatient(patientId: number): Promise<void> {
    try {
      await api.delete(`/patients/${patientId}`);
    } catch (error) {
      console.error(`Error deleting patient ${patientId}:`, error);
      throw new Error('Không thể xóa bệnh nhân');
    }
  },

  // Emergency Contacts
  async getEmergencyContacts(patientId: number): Promise<EmergencyContact[]> {
    const response = await api.get<EmergencyContact[]>(
      `/patients/${patientId}/contacts`
    );
    return response.data;
  },

  // Get emergency contact by contactId
  async getEmergencyContactById(contactId: number): Promise<EmergencyContact> {
    const response = await api.get<EmergencyContact>(
      `/patients/contacts/${contactId}`
    );
    return response.data;
  },

  // Update emergency contact
  async updateEmergencyContact(
    contactId: number,
    patientId: number,
    contactData: EmergencyContactDto
  ): Promise<EmergencyContactDto> {
    const response = await api.put<EmergencyContactDto>(
      `/patients/${patientId}/contacts/${contactId}`,
      contactData
    );
    return response.data;
  },

  // Delete emergency contact
  async deleteEmergencyContact(
    contactId: number,
    patientId: number
  ): Promise<string> {
    const response = await api.delete<string>(
      `/patients/${patientId}/contacts/${contactId}`
    );
    return response.data;
  },

  // Get all room details
  async getAllRoomDetails(): Promise<RoomDetail[]> {
    const response = await api.get<RoomDetail[]>(`/patients/room-details`);
    return response.data;
  },

  // Get room details by detailId
  async getRoomDetailById(detailId: number): Promise<RoomDetail> {
    const response = await api.get<RoomDetail>(
      `/patients/room-details/${detailId}`
    );
    return response.data;
  },

  // Create a new room detail
  async createRoomDetail(
    roomDetailData: Partial<RoomDetailDto>
  ): Promise<RoomDetailDto> {
    const response = await api.post<RoomDetailDto>(
      `/patients/room-details`,
      roomDetailData
    );
    return response.data;
  },

  // Update an existing room detail
  async updateRoomDetail(
    detailId: number,
    roomDetailData: Partial<RoomDetailDto>
  ): Promise<RoomDetail> {
    const response = await api.put<RoomDetail>(
      `/patients/room-details/${detailId}`,
      roomDetailData
    );
    return response.data;
  },

  // Delete a room detail
  async deleteRoomDetail(detailId: number): Promise<string> {
    const response = await api.delete<string>(
      `/patients/room-details/${detailId}`
    );
    return response.data;
  },

  // Get all room details
  async getAllPatientRooms(): Promise<PatientRoom[]> {
    const response = await api.get<PatientRoom[]>(`/patients/patient-rooms`);
    return response.data;
  },

  // Get patient room by roomId
  async getPatientRoomById(roomId: number): Promise<PatientRoom> {
    const response = await api.get<PatientRoom>(
      `/patients/patient-rooms/${roomId}`
    );
    return response.data;
  },

  // Create a new patient room
  async createPatientRoom(
    patientRoomData: Partial<PatientRoom>
  ): Promise<PatientRoom> {
    const response = await api.post<PatientRoom>(
      `/patients/patient-rooms`,
      patientRoomData
    );
    return response.data;
  },

  //Update patient room
  async updatePatientRoom(
    roomId: number,
    patientRoomData: Partial<PatientRoom>
  ): Promise<PatientRoom> {
    const response = await api.put<PatientRoom>(
      `/patients/patient-rooms/${roomId}`,
      patientRoomData
    );
    return response.data;
  },

  // Delete a patient room
  async deletePatientRoom(roomId: number): Promise<string> {
    const response = await api.delete<string>(
      `/patients/patient-rooms/${roomId}`
    );
    return response.data;
  },
};
