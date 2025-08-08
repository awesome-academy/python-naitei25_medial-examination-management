import { api } from './api'
import { handleApiError } from '../utils/errorHandler'
import type { Appointment, CreateAppointmentPayload, UpdateAppointmentPayload, AppointmentNote, AppointmentFilter } from '../types/appointment'
import type { PaginatedResponse } from '../types/api'
import { patientService } from './patientService'
import { storage } from '../utils/storage'
import { LocalStorageKeys } from '../constants/storageKeys'

export type AppointmentListResponse = PaginatedResponse<Appointment>

export const appointmentService = {
  // Get my appointments
  async getMyAppointments(page = 1, pageSize = 10, filters?: AppointmentFilter): Promise<any> {
    try {
      const userId = storage.getRaw(LocalStorageKeys.CURRENT_USER_ID);
      if (!userId) {
        throw new Error('Không tìm thấy user ID');
      }

      let patientId: number;
      try {
        const patient = await patientService.getPatientByUserId(Number(userId));
        patientId = patient.id;
      } catch (error) {
        console.error('Cannot get patient info:', error);
        throw new Error('Không thể lấy thông tin bệnh nhân');
      }

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      
      if (filters?.status) params.append('appointmentStatus', filters.status);

      console.log('Calling API: /appointments/patient/' + patientId + '/ with params:', params.toString());
      
      const response = await api.get(`/appointments/patient/${patientId}/?${params.toString()}`);
      console.log('My appointments API response:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('getMyAppointments error:', error);
      throw new Error(handleApiError(error, false));
    }
  },
  // Get upcoming appointments
  async getUpcomingAppointments(): Promise<any[]> {
    try {
      console.log('Getting upcoming appointments...');

      const appointmentsData = await this.getMyAppointments(1, 100);
      const allAppointments = appointmentsData?.content || appointmentsData?.results || [];
      
      const now = new Date();
      const upcoming = allAppointments.filter((appt: any) => {
        const apptDate = new Date(appt.schedule?.work_date || appt.date);
        const isUpcoming = apptDate >= now;
        const isNotCancelled = appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED';
        
        return isUpcoming && isNotCancelled;
      });
      
      console.log('Filtered upcoming appointments:', upcoming);
      return upcoming;
    } catch (error: any) {
      console.error('getUpcomingAppointments error:', error);
      return [];
    }
  },

  // Get appointment by ID
  async getAppointmentById(appointmentId: number): Promise<Appointment> {
    try {
      const response = await api.get<Appointment>(`/appointments/${appointmentId}/`)
      return response.data
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  },

  // Create new appointment
  async createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
    try {
      const response = await api.post<Appointment>('/appointments/', payload)
      return response.data
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  },

  // Update appointment
  async updateAppointment(appointmentId: number, payload: UpdateAppointmentPayload): Promise<Appointment> {
    try {
      const response = await api.patch<Appointment>(`/appointments/${appointmentId}/`, payload)
      return response.data
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  },

  // Cancel appointment
  async cancelAppointment(appointmentId: number, reason?: string): Promise<Appointment> {
    try {
      const response = await api.patch<Appointment>(`/appointments/${appointmentId}/`, {
        status: 'CANCELLED',
        cancellationReason: reason
      })
      return response.data
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  },

  // Get available time slots
  async getAvailableSlots(doctorId: number, date: string): Promise<{
    morning: string[]
    afternoon: string[]
  }> {
    try {
      const response = await api.get<{
        morning: string[]
        afternoon: string[]
      }>(`/appointments/available-slots/?doctor_id=${doctorId}&date=${date}`)
      return response.data
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  },

  // Admin functions
  async getAllAppointments(page = 1, pageSize = 10, filters?: AppointmentFilter): Promise<AppointmentListResponse> {
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('page_size', pageSize.toString())
      
      if (filters?.status) params.append('status', filters.status)
      if (filters?.doctorId) params.append('doctor_id', filters.doctorId.toString())
      if (filters?.patientId) params.append('patient_id', filters.patientId.toString())
      if (filters?.startDate) params.append('start_date', filters.startDate)
      if (filters?.endDate) params.append('end_date', filters.endDate)

      const response = await api.get<AppointmentListResponse>(`/appointments/?${params.toString()}`)
      return response.data
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  },

  async getDoctorAppointments(doctorId: number, page = 1, pageSize = 10, filters?: AppointmentFilter): Promise<AppointmentListResponse> {
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('page_size', pageSize.toString())
      
      if (filters?.status) params.append('status', filters.status)
      if (filters?.startDate) params.append('start_date', filters.startDate)
      if (filters?.endDate) params.append('end_date', filters.endDate)

      const response = await api.get<AppointmentListResponse>(`/appointments/doctor/${doctorId}/?${params.toString()}`)
      return response.data
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  }
}

export const appointmentNoteService = {
  // Get notes for appointment
  async getAppointmentNotes(appointmentId: number): Promise<AppointmentNote[]> {
    try {
      const response = await api.get<{ results: AppointmentNote[] }>(`/appointments/${appointmentId}/notes/`)
      return response.data.results
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  },

  // Create appointment note
  async createAppointmentNote(appointmentId: number, payload: {
    noteType: 'DIAGNOSIS' | 'PRESCRIPTION' | 'GENERAL'
    content: string
  }): Promise<AppointmentNote> {
    try {
      const response = await api.post<AppointmentNote>(`/appointments/${appointmentId}/notes/`, payload)
      return response.data
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  },

  // Update appointment note
  async updateAppointmentNote(noteId: number, payload: {
    content: string
  }): Promise<AppointmentNote> {
    try {
      const response = await api.patch<AppointmentNote>(`/appointment-notes/${noteId}/`, payload)
      return response.data
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  },

  // Delete appointment note
  async deleteAppointmentNote(noteId: number): Promise<void> {
    try {
      await api.delete(`/appointment-notes/${noteId}/`)
    } catch (error: any) {
      throw new Error(handleApiError(error, false))
    }
  }
}

export default appointmentService
