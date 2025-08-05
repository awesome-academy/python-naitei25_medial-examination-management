export interface Appointment {
  id: number
  patientId: number
  patient?: {
    id: number
    fullName: string
    email: string
    phone?: string
    dateOfBirth?: string
    gender?: string
    avatar?: string
  }
  doctorId: number
  doctor?: {
    id: number
    fullName: string
    specialty: string
    department: string
    avatar?: string
    experience?: number
    rating?: number
  }
  appointmentDate: string
  appointmentTime: string
  status: AppointmentStatus
  symptoms?: string
  notes?: string
  diagnosis?: string
  treatment?: string
  prescription?: string
  followUpDate?: string
  cancellationReason?: string
  createdAt: string
  updatedAt: string
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export interface CreateAppointmentPayload {
  doctorId: number
  appointmentDate: string
  appointmentTime: string
  symptoms?: string
  notes?: string
}

export interface UpdateAppointmentPayload {
  appointmentDate?: string
  appointmentTime?: string
  status?: AppointmentStatus
  symptoms?: string
  notes?: string
  diagnosis?: string
  treatment?: string
  prescription?: string
}

export interface AppointmentNote {
  id: number
  appointmentId: number
  noteType: 'DIAGNOSIS' | 'PRESCRIPTION' | 'GENERAL'
  content: string
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface AvailableSlot {
  time: string
  isAvailable: boolean
  maxPatients?: number
  currentPatients?: number
}

export interface AppointmentFilter {
  status?: AppointmentStatus
  doctorId?: number
  patientId?: number
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}
