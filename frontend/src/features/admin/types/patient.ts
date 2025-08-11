export interface Patient {
  patientId: number;
  identityNumber: string;
  insuranceNumber: string;
  fullName: string;
  birthday: string;
  phone: string;
  email: string;
  avatar: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  address: string;
  allergies: string;
  height: number; // đơn vị: cm
  weight: number; // đơn vị: kg
  bloodType: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  createdAt: string;
  contacts?: EmergencyContact[];
}

export interface PatientDto {
  userId: number;
  identityNumber: string;
  insuranceNumber: string;
  fullName: string;
  birthday: string;
  phone: string;
  email: string;
  avatar: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  address: string;
  allergies: string;
  height: number;
  weight: number;
  bloodType: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
}

export interface CreatePatientRequest {
  email: string;
  phone: string;
  password: string;
  identityNumber: string;
  insuranceNumber: string;
  fullName: string;
  birthday: string;
  avatar?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  address?: string;
  allergies?: string;
  height?: number;
  weight?: number;
  bloodType?: string;
  emergencyContactDtos?: EmergencyContactDto[];
}
export interface EmergencyContact {
  contactId: number;
  contactName: string;
  contactPhone: string;
  relationship: "FAMILY" | "FRIEND" | "OTHERS";
  createdAt: string;
  patientId: number;
}

export interface EmergencyContactDto {
  contactName: string;
  contactPhone: string;
  relationship: "FAMILY" | "FRIEND" | "OTHERS";
}

export interface RoomDetail {
  detailId: number;
  roomId: number;
  patientId: number;
  createdAt: string;
}

export interface RoomDetailDto {
  roomId: number;
  patientId: number;
}

export interface PatientRoom {
  roomId: number;
  roomName: string;
  maxCapacity: number;
  note: string;
  createdAt: string;
}

export interface PatientRoomDto {
  roomName: string;
  maxCapacity: number;
  note?: string;
}
