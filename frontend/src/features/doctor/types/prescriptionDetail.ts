import type { Medicine } from "./medicin"
import type { Prescription } from "./prescription"

export interface PrescriptionDetail {
  id?: number; // id là tùy chọn cho thuốc mới
  prescription?: number;
  medicine_id: number;
  medicine: {
    medicine_id: number;
    medicine_name: string;
    unit: string;
    price: number;
  };
  dosage: string;
  frequency: string;
  duration: string;
  prescription_notes: string;
  quantity: number;
  created_at?: string;
}
