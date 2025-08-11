// Schedule for admin (lịch làm việc bác sĩ, dùng cho admin quản lý)
export interface AdminDoctorSchedule {
  scheduleId: number;
  doctorId: number;
  doctorName?: string; // optional, for display
  workDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  shift: Shift;
  roomId: number;
  roomName?: string; // optional, for display
  building?: string;
  floor?: number;
  note?: string;
  createdAt: string;
}
export interface Doctor {
  doctorId: number;
  userId: number;
  identityNumber: string;
  fullName: string;
  birthday: string;
  gender: "MALE" | "FEMALE";
  address: string;
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
  departmentName: string;
  createdAt: string;
}

export interface DoctorDto {
  doctorId?: number;
  userId?: number;
  identityNumber: string;
  fullName: string;
  birthday: string;
  gender: "MALE" | "FEMALE";
  address: string;
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

export type Shift = "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT";
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
  doctorId: number;
  workDate: string;
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  shift: Shift;
  roomId: number;
  createdAt: string;
}

export interface CreateDoctorRequest {
  email?: string;
  phone: string;
  password: string;
  identityNumber: string;
  fullName: string;
  birthday: string;
  gender: "MALE" | "FEMALE";
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
  consultationFee?: number;
}
