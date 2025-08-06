import { EventInput } from "@fullcalendar/core";

// Kiểu trạng thái lịch khám
export type EventStatus = "danger" | "success" | "waiting" | "cancel";

// Ánh xạ tên trạng thái và giá trị
export const EVENT_STATUS_MAP = {
  "Khẩn cấp": "danger" as EventStatus,
  "Đã khám": "success" as EventStatus,
  "Chờ khám": "waiting" as EventStatus,
  Hủy: "cancel" as EventStatus,
};

// Interface cho sự kiện lịch
export interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: EventStatus;
    patientName: string;
    patientId?: string;
    insuranceId?: string;
    phoneNumber?: string;
    patientAge?: number;
    symptoms?: string;
    eventTime?: string;
    doctorName?: string;
    department?: string;
    departmentId?: string;
    doctorId?: string;
  };
}

// Interface cho form dữ liệu
export interface EventFormData {
  patientName: string;
  patientId: string;
  insuranceId: string;
  phoneNumber: string;
  patientAge: number;
  symptoms: string;
  date: string;
  time: string;
  doctorName: string;
  doctorId: string;
  department: string;
  departmentId: string;
  status: string;
}

// SERVICE
export type ServiceType = "TEST" | "IMAGING" | "CONSULTATION" | "OTHER";

export interface Service {
  serviceId: number;
  serviceName: string;
  serviceType: ServiceType;
  price: number;
  createdAt: string;
}

export interface ServiceDto {
  serviceName: string;
  serviceType: ServiceType;
  price: number;
}

export interface ServiceOrder {
  orderId: number;
  appointmentId: number;
  roomId: number;
  service: Service;
  orderStatus: "ORDERED" | "COMPLETED";
  result: string;
  number: number;
  orderTime: string;
  resultTime: string;
  createdAt: string;
}

export interface ServiceOrderDto {
  appointmentId: number;
  roomId: number;
  serviceId: number;
  orderStatus: "ORDERED" | "COMPLETED";
  result: string;
  number: number;
  orderTime: string;
  resultTime: string;
}

export interface Appointment {
  appointmentId: number;
  doctorId: number;
  patientId: number;
  scheduleId: number;
  symptoms: string;
  slotStart: string;
  slotEnd: string;
  number: number;
  appointmentStatus: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
  doctorInfo: {
    doctorId: number;
    fullName: string;
    academicDegree: string;
    specialization: string;
  };
}

export interface AppointmentDto {
  doctorId: number;
  patientId: number;
  scheduleId: number;
  symptoms: string;
  slotStart: string;
  slotEnd: string;
  number: number;
  appointmentStatus: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
}

export interface AppointmentNote {
  noteId: number;
  appointmentId: number;
  noteType: "DOCTOR" | "PATIENT";
  noteText: string;
  createdAt: string;
}

export interface AppointmentNoteDto {
  appointmentId: number;
  noteType: "DOCTOR" | "PATIENT";
  noteText: string;
}

export interface Schedule {
  id: number;
  doctorId: number;
  doctorName: string;
  departmentId: number;
  departmentName: string;
  date: string;
  startTime: string;
  endTime: string;
  maxPatients: number;
  currentPatients: number;
  status: "AVAILABLE" | "FULL" | "CANCELLED";
}

export interface ScheduleDto extends Schedule {
  date: string;
}

export interface Patient {
  id: number;
  fullName: string;
  phoneNumber: string;
  insuranceId?: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
  address: string;
}

export interface PatientDto {
  patientId: number;
  userId: number;
  identityNumber: string;
  insuranceNumber: string;
  fullName: string;
  avatar: string;
  birthday: string;
  gender: string;
  address: string;
  allergies: string;
  height: number;
  weight: number;
  bloodType: string;
  createdAt: string;
}

export interface DoctorDto {
  doctorId: number;
  userId: number;
  identityNumber: string;
  fullName: string;
  avatar: string;
  birthday: string;
  gender: string;
  address: string;
  academicDegree: string;
  specialization: string;
  type: string;
  consultationFee: string;
  departmentId: number;
  departmentName: string;
  createdAt: string;
}

export interface AppointmentUpdateRequest {
  appointmentId: number;
  doctorId: number;
  patientId: number;
  scheduleId: number;
  symptoms: string;
  number: number;
  appointmentStatus: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  slotStart: string;
  slotEnd: string;
}

export interface AppointmentRequest {
  slotStart: string;
  slotEnd: string;
  scheduleId: number;
  symptoms: string;
  doctorId: number;
  patientId: number;
}

export interface AppointmentResponse {
  appointmentId: number;
  schedule: ScheduleDto;
  orderNumber: string;
  appointmentStatus: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  slotStart: string;
  slotEnd: string;
  symptoms: string;
  doctorId: number;
  patientInfo: {
    patientId: number;
    fullName: string;
    phoneNumber: string;
    insuranceId?: string;
    age: number;
    gender: "MALE" | "FEMALE" | "OTHER";
  };
  createdAt: string;
  updatedAt: string;
}
