import type {
  Gender,
  DoctorType,
  AcademicDegree
} from "../constants/enums";

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
  gender: Gender
  address: string
  academicDegree: AcademicDegree
  specialization: string
  type: DoctorType
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
  gender: Gender;
  address: string;
  academicDegree: AcademicDegree;
  specialization: string;
  type: DoctorType;
  departmentId: number;
}
