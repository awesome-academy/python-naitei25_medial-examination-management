import type { Doctor, DoctorDto } from "../types/doctor";
import type { DoctorInfo } from '../types/auths';
import { api } from "./api";
import { handleApiError } from "../utils/errorHandler";
import i18n from "../../i18n";

export interface DoctorSearchParams {
  specialty?: string;
  department?: string;
  name?: string;
  minRating?: number;
  maxFee?: number;
  experience?: number;
  page?: number;
  limit?: number;
}

export interface DoctorSchedule {
  id: number;
  doctor_id: number;
  work_date: string;
  start_time: string;
  end_time: string;
  shift: 'M' | 'A';
  doctor: number;
  room: number;
}

export const doctorService = {
  // Get all doctors
  async getAllDoctors(): Promise<Doctor[]> {
    try {
      const response = await api.get<Doctor[]>("/doctors");
      return response.data;
    } catch (error: any) {
      throw new Error(handleApiError(error, false));
    }
  },

  // Get doctor by ID
  async getDoctorById(userId: number): Promise<Doctor> {
    try {
      const response = await api.get<Doctor>(`/doctors/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(handleApiError(error, false));
    }
  },

  // Get doctor by userId
  async getDoctorByUserId(doctorId: number): Promise<Doctor> {
    try {
      const response = await api.get<Doctor>(`/doctors/user/${doctorId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(handleApiError(error, false) || i18n.t("services.doctor.doctorNotFound"));
    }
  },

  // Create doctor
  async createDoctor(doctorData: DoctorDto): Promise<Doctor> {
    try {
      const response = await api.post<Doctor>("/doctors", doctorData);
      return response.data;
    } catch (error: any) {
      throw new Error(handleApiError(error, false));
    }
  },

  // Get doctor's schedule
  async getDoctorSchedule(doctorId: number, workDate?: string): Promise<DoctorSchedule[]> {
    try {
      const params = new URLSearchParams();
      params.append('doctor_id', doctorId.toString());
      if (workDate) {
        params.append('work_date', workDate);
      }
      const response = await api.get<DoctorSchedule[]>(`/schedules/?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(handleApiError(error, false));
    }
  },

  // Get doctor's available time slots for a specific date
  async getAvailableTimeSlots(scheduleId: number, date: string): Promise<{
    date: string;
    timeSlots: Array<{ time: string; available: boolean; scheduleId: number }>;
  }> {
    try {
      const response = await api.get(`/appointments/schedule/available-slots/`, {
        params: { schedule_id: scheduleId, date }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(handleApiError(error, false));
    }
  },

  // Update doctor profile (for doctors)
  async updateDoctorProfile(doctorId: number, data: Partial<DoctorInfo>): Promise<DoctorInfo> {
    try {
      const response = await api.patch<DoctorInfo>(`/doctors/${doctorId}/`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(handleApiError(error, false));
    }
  },

  // Upload doctor avatar
  async uploadDoctorAvatar(doctorId: number, file: File): Promise<{ avatar: string }> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await api.post<{ avatar: string }>(`/doctors/${doctorId}/avatar/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(handleApiError(error, false));
    }
  }
};
