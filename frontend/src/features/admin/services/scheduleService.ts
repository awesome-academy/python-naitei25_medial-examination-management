import { api } from "../../../shared/services/api";

export interface ScheduleResponse {
  scheduleId: number;
  doctorId: number;
  workDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  shift: "MORNING" | "AFTERNOON" | "SURGERY" | "MEETING";
  roomId: number;
  location?: string;
  roomNote?: string;
  floor?: number;
  building?: string;
  createdAt: string;
  title?: string;
}

export interface CreateScheduleRequest {
  doctorId: number;
  workDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  shift: "MORNING" | "AFTERNOON" | "SURGERY" | "MEETING";
  roomId: number;
}

export const scheduleService = {
  // Get schedules by doctor ID
  async getSchedulesByDoctorId(doctorId: number): Promise<ScheduleResponse[]> {
    try {
      const response = await api.get<ScheduleResponse[]>(
        `/schedules?doctor_id=${doctorId}`
      );
      console.log(
        `Successfully fetched ${response.data.length} schedules:`,
        response.data
      );
      return response.data;
    } catch (error) {
      console.error(
        `❌ Error fetching schedules for doctor ${doctorId}:`,
        error
      );
      throw new Error(`Không thể tải lịch làm việc của bác sĩ`);
    }
  },

  // Get all schedules for admin view
  async getAllSchedulesForAdmin(): Promise<ScheduleResponse[]> {
    try {
      const response = await api.get<ScheduleResponse[]>(
        "/doctors/schedules/admin"
      );
      console.log(
        `✅ Successfully fetched ${response.data.length} admin schedules:`,
        response.data
      );
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching admin schedules:`, error);
      throw new Error(`Không thể tải danh sách lịch làm việc`);
    }
  },

  // Get schedule by schedule ID
  async getScheduleById(scheduleId: number): Promise<ScheduleResponse> {
    try {
      const response = await api.get<ScheduleResponse>(
        `/doctors/schedules/${scheduleId}`
      );
      console.log(`✅ Successfully fetched schedule:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching schedule ${scheduleId}:`, error);
      throw new Error(`Không thể tải thông tin lịch làm việc`);
    }
  },

  // Create new schedule
  async createSchedule(
    scheduleData: CreateScheduleRequest
  ): Promise<ScheduleResponse> {
    try {
      const response = await api.post<ScheduleResponse>(
        `/doctors/${scheduleData.doctorId}/schedules`,
        scheduleData
      );
      console.log(`✅ Successfully created schedule:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error creating schedule:`, error);
      throw new Error(`Không thể tạo lịch làm việc mới`);
    }
  },

  // Update existing schedule
  async updateSchedule(
    doctorId: number,
    scheduleId: number,
    scheduleData: Partial<CreateScheduleRequest>
  ): Promise<ScheduleResponse> {
    try {
      const response = await api.put<ScheduleResponse>(
        `/doctors/${doctorId}/schedules/${scheduleId}`,
        scheduleData
      );
      console.log(`✅ Successfully updated schedule:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating schedule ${scheduleId}:`, error);
      throw new Error(`Không thể cập nhật lịch làm việc`);
    }
  },

  // Delete schedule
  async deleteSchedule(doctorId: number, scheduleId: number): Promise<void> {
    try {
      await api.delete(`/doctors/${doctorId}/schedules/${scheduleId}`);
      console.log(`✅ Successfully deleted schedule ${scheduleId}`);
    } catch (error) {
      console.error(`❌ Error deleting schedule ${scheduleId}:`, error);
      throw new Error(`Không thể xóa lịch làm việc`);
    }
  },
};
