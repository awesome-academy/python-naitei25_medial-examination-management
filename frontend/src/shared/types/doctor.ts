export interface Department {
  departmentId: number;
  departmentName: string;
}

export interface Doctor {
  id: number;
  userId: number
  identityNumber: string
  fullName: string
  birthday: string
  avatar: string
  gender: "MALE" | "FEMALE" | "OTHER" 
  address: string
  academicDegree: "BS" | "BS_CKI" | "BS_CKII" | "THS_BS" | "TS_BS" | "PGS_TS_BS" | "GS_TS_BS"
  specialization: string
  type: "EXAMINATION" | "SERVICE"
  department: Department;
  profileImage?: string;
  createdAt: string;
}

export interface DoctorDto {
  doctorId?: number;
  userId?: number;
  identityNumber: string;
  fullName: string;
  birthday: string;
  gender: "MALE" | "FEMALE" | "OTHER";
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
