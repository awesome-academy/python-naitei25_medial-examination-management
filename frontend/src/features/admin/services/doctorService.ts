import type {
  Doctor,
  DoctorDto,
  CreateDoctorRequest,
  ExaminationRoom,
  ExaminationRoomDto,
} from "../types/doctor";
import { api } from "../../../shared/services/api";

export const doctorService = {
  // Get all doctors
  async getAllDoctors(): Promise<Doctor[]> {
    const response = await api.get<any[]>("/doctors");
    // Map lại dữ liệu từ backend sang đúng interface Doctor
    return response.data.map((item) => ({
      doctorId: item.id,
      userId: item.user?.id,
      identityNumber: item.identity_number,
      fullName: `${item.first_name || ""} ${item.last_name || ""}`.trim(),
      birthday: item.birthday,
      gender: item.gender === "M" ? "MALE" : "FEMALE",
      address: item.address,
      academicDegree: item.academic_degree, // Nếu cần map thêm thì bổ sung
      specialization: item.specialization,
      avatar: item.avatar, // Nếu có trường avatar
      type: item.type === "S" ? "SERVICE" : "EXAMINATION",
      departmentId: item.department?.id,
      departmentName: item.department?.department_name,
      createdAt: item.created_at,
    }));
  },

  // Get doctor by ID
  async getDoctorById(userId: number): Promise<Doctor> {
    const response = await api.get<Doctor>(`/doctors/${userId}`);
    return response.data;
  },

  // Get doctor by userId
  async getDoctorByUserId(doctorId: number): Promise<Doctor> {
    const response = await api.get<Doctor>(`/doctors/users/${doctorId}`);
    return response.data;
  },

  // Create doctor
  async createDoctor(doctorData: CreateDoctorRequest): Promise<Doctor> {
    const response = await api.post<Doctor>("/doctors", doctorData);
    return response.data;
  },

  // Update doctor
  async updateDoctor(
    doctorId: number,
    doctorData: Partial<DoctorDto>
  ): Promise<Doctor> {
    const response = await api.put<Doctor>(`/doctors/${doctorId}`, doctorData);
    return response.data;
  },

  // Delete doctor
  async deleteDoctor(doctorId: number): Promise<string> {
    const response = await api.delete<string>(`/doctors/${doctorId}`);
    return response.data;
  },

  // Find doctor by identity number
  async findByIdentityNumber(identityNumber: string): Promise<Doctor | null> {
    const response = await api.get<Doctor | null>(
      `/doctors/search?identityNumber=${identityNumber}`
    );
    return response.data;
  },

  // Filter doctors
  async filterDoctors(params: {
    gender?: "MALE" | "FEMALE" | "OTHER";
    academicDegree?:
      | "BS"
      | "BS_CKI"
      | "BS_CKII"
      | "THS_BS"
      | "TS_BS"
      | "PGS_TS_BS"
      | "GS_TS_BS";
    specialization?: string;
    type?: "EXAMINATION" | "SERVICE";
  }): Promise<Doctor | null> {
    const queryParams = new URLSearchParams();

    if (params.gender) queryParams.append("gender", params.gender);
    if (params.academicDegree)
      queryParams.append("academicDegree", params.academicDegree);
    if (params.specialization)
      queryParams.append("specialization", params.specialization);
    if (params.type) queryParams.append("type", params.type);

    const response = await api.get<Doctor | null>(
      `/doctors/filter?${queryParams.toString()}`
    );
    return response.data;
  },

  // Get all examination rooms
  async getAllExaminationRooms(): Promise<ExaminationRoom[]> {
    const response = await api.get<ExaminationRoom[]>(
      "/doctors/examination-rooms"
    );
    return response.data;
  },

  // Get examination room by ID
  async getExaminationRoomById(
    roomId: number
  ): Promise<ExaminationRoom | null> {
    const response = await api.get<ExaminationRoom | null>(
      `/doctors/examination-rooms/${roomId}`
    );
    return response.data;
  },

  // Create examination room
  async createExaminationRoom(
    roomData: Omit<ExaminationRoomDto, "roomId">
  ): Promise<ExaminationRoomDto> {
    const response = await api.post<ExaminationRoomDto>(
      "/doctors/examination-rooms",
      roomData
    );
    return response.data;
  },

  // Update examination room
  async updateExaminationRoom(
    roomId: number,
    roomData: Partial<ExaminationRoomDto>
  ): Promise<ExaminationRoom> {
    const response = await api.put<ExaminationRoom>(
      `/doctors/examination-rooms/${roomId}`,
      roomData
    );
    return response.data;
  },

  // Delete examination room
  async deleteExaminationRoom(roomId: number): Promise<string> {
    const response = await api.delete<string>(
      `/doctors/examination-rooms/${roomId}`
    );
    return response.data;
  },
};
