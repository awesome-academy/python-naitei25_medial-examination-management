// Schedule for admin (lịch làm việc bác sĩ, dùng cho admin quản lý)
export interface AdminDoctorSchedule {
  scheduleId: number;
  doctor_id: number; 
  doctorName?: string;
  work_date: string; 
  start_time: string; 
  end_time: string; 
  shift: Shift;
  room_id: number; 
  roomName?: string; 
  building?: string;
  floor?: number;
  note?: string;
  created_at: string; 
  title?: string;
}

export interface Doctor {
  doctorId: number; 
  userId: number;
  identityNumber: string;
  fullName: string; 
  birthday: string;
  gender: "MALE" | "FEMALE" | "OTHER"; 
  ress: string;
  academicDegree:
    | "BS"
    | "BS_CKI"
    | "BS_CKII"
    | "THS_BS"
    | "TS_BS"
    | "PGS_TS_BS"
    | "GS_TS_BS";
  specialization: string;
  avatar?: string;
  type: "EXAMINATION" | "SERVICE";
  // UPDATED: Department info as nested object, matching API
  department: {
    id: number;
    department_name: string; 
    description?: string;
    created_at?: string; 
  };
  departmentId: number;
  departmentName: string; 
  createdAt: string;
  price?: number; 
}

export interface DoctorDto {
  doctorId?: number;
  userId?: number;
  identityNumber?: string; 
  first_name?: string; 
  last_name?: string; 
  birthday?: string; 
  gender?: "MALE" | "FEMALE" | "OTHER"; 
  ress?: string; 
  academicDegree?:
    | "BS"
    | "BS_CKI"
    | "BS_CKII"
    | "THS_BS"
    | "TS_BS"
    | "PGS_TS_BS"
    | "GS_TS_BS"; 
  specialization?: string; 
  avatar?: string; 
  type?: "EXAMINATION" | "SERVICE"; 
  departmentId?: number; 
  price?: number; 
}

// Academic degree labels for display
export const ACADEMIC_DEGREE_LABELS: Record<string, string> = {
  BS: "BS",
  BS_CKI: "BS CKI",
  BS_CKII: "BS CKII",
  THS_BS: "ThS.BS",
  TS_BS: "TS.BS",
  PGS_TS_BS: "PGS.TS.BS",
  GS_TS_BS: "GS.TS.BS",
};

export type RoomType = "EXAMINATION" | "TEST";

import type { Shift } from "./appointment"; 

export interface Department {
  departmentId: number;
  departmentName: string;
  description: string;
  createdAt: string;
}

export interface ExaminationRoom {
  roomId: number;
  departmentId: number;
  type: RoomType;
  building: string;
  floor: number;
  note: string;
  createdAt?: string;
}

export interface ExaminationRoomDto {
  roomId?: number;
  departmentId: number;
  type: RoomType;
  building: string;
  floor: number;
  note: string;
  createdAt?: string;
}

export interface Schedule {
  scheduleId: number;
  doctor_id: number; 
  work_date: string; 
  start_time: string; 
  end_time: string; 
  shift: Shift;
  room_id: number; 
  location?: string; 
  room_note?: string; 
  floor?: number; 
  building?: string; 
  created_at: string; 
}

export interface CreateDoctorRequest {
  email?: string;
  phone?: string; 
  password: string;
  identityNumber: string;
  first_name: string; 
  last_name: string; 
  birthday: string;
  gender: "MALE" | "FEMALE" | "OTHER"; 
  address?: string;
  academicDegree:
    | "BS"
    | "BS_CKI"
    | "BS_CKII"
    | "THS_BS"
    | "TS_BS"
    | "PGS_TS_BS"
    | "GS_TS_BS";
  specialization: string;
  avatar?: string;
  type: "EXAMINATION" | "SERVICE";
  departmentId: number;
  price?: number; 
}
