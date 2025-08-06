export interface Medicine {
  medicineId: number;
  medicineName: string;
  manufactor: string;
  category: string;
  description: string;
  usage: string;
  unit: string;
  insuranceDiscountPercent: number;
  insuranceDiscount: number;
  sideEffects: string;
  price: number;
  quantity: number;
  avatar: string;
}

export interface MedicineRequest {
  medicineName: string;
  manufactor: string;
  category: string;
  description: string;
  usage: string;
  unit: string;
  insuranceDiscountPercent: number;
  sideEffects: string;
  price: number;
  quantity: number;
}

export interface MedicineUpdateRequest {
  medicineName?: string;
  manufactor?: string;
  category?: string;
  description?: string;
  usage?: string;
  unit?: string;
  insuranceDiscountPercent?: number;
  sideEffects?: string;
  price?: number;
  quantity?: number;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface PrescriptionDetailRequest {
  medicineId: number;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  prescriptionNotes?: string;
}

export interface CreatePrescriptionRequest {
  appointmentId: number;
  patientId: number;
  followUpDate?: string;
  isFollowUp: boolean;
  diagnosis: string;
  systolicBloodPressure: number;
  diastolicBloodPressure: number;
  heartRate: number;
  bloodSugar: number;
  note?: string;
  prescriptionDetails: PrescriptionDetailRequest[];
}

export interface UpdatePrescriptionRequest {
  followUpDate?: string;
  isFollowUp?: boolean;
  diagnosis?: string;
  systolicBloodPressure?: number;
  diastolicBloodPressure?: number;
  heartRate?: number;
  bloodSugar?: number;
  note?: string;
  prescriptionDetails?: PrescriptionDetailRequest[];
}

export interface AddMedicineToPrescriptionRequest {
  prescriptionId: number;
  medicineId: number;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  prescriptionNotes?: string;
}

export interface UpdatePrescriptionDetailRequest {
  detailId: number;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity?: number;
  prescriptionNotes?: string;
}

export interface PrescriptionDetailResponse {
  detailId: number;
  prescriptionId: number;
  medicine: Medicine;
  dosage: string;
  frequency: string;
  duration: string;
  prescriptionNotes?: string;
  quantity: number;
  createdAt: string;
}

export interface PrescriptionResponse {
  prescriptionId: number;
  appointmentId: number;
  patientId: number;
  followUpDate?: string;
  isFollowUp: boolean;
  diagnosis: string;
  systolicBloodPressure: number;
  diastolicBloodPressure: number;
  heartRate: number;
  bloodSugar: number;
  note?: string;
  createdAt: string;
  prescriptionDetails: PrescriptionDetailResponse[];
}

export interface PrescriptionBasicInfo {
  prescriptionId: number;
  appointmentId: number;
  diagnosis: string;
  createdAt: string;
}
