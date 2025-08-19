import type {
  Medicine,
  MedicineRequest,
  MedicineUpdateRequest,
  PrescriptionResponse,
  PrescriptionDetailRequest,
} from "../types/pharmacy";
import { api } from "../../../shared/services/api";

export const pharmacyService = {
  // Get all medicines
  async getAllMedicines(): Promise<Medicine[]> {
    try {
      console.log("Calling API: /medicines");
      const response = await api.get<any[]>("/medicines");
      console.log("API Response:", response.data);
      console.log("Raw medicines from API:", response.data);

      // Chuẩn hóa snake_case -> camelCase
      const mappedData: Medicine[] = response.data.map((m: any) => ({
        medicineId: m.id,
        medicineName: m.medicine_name,
        manufactor: m.manufactor,
        category: m.category,
        description: m.description,
        usage: m.usage,
        unit: m.unit,
        insuranceDiscountPercent: m.insurance_discount_percent,
        insuranceDiscount: m.insurance_discount,
        sideEffects: m.side_effects,
        price: m.price,
        quantity: m.quantity,
        stockStatus: m.stock_status, // nếu có
        avatar: m.avatar, // nếu có
      }));

      return mappedData;
    } catch (error) {
      console.error("Error in getAllMedicines:", error);
      throw error;
    }
  },

  // Get medicine by ID
  async getMedicineById(medicineId: number): Promise<Medicine> {
    try {
      const response = await api.get<Medicine>(`/medicines/${medicineId}`);
      return response.data;
    } catch (error) {
      console.error("Error getting medicine by ID:", error);
      throw error;
    }
  },

  // Search medicines
  async searchMedicine(name?: string, category?: string): Promise<Medicine[]> {
    try {
      const params = new URLSearchParams();
      if (name) params.append("name", name);
      if (category) params.append("category", category);

      console.log("Searching medicines with params:", params.toString());
      const response = await api.get<Medicine[]>(
        `/medicines/search?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error searching medicines:", error);
      throw error;
    }
  },

  // Create new medicine
  async addMedicine(medicineData: MedicineRequest): Promise<Medicine> {
    try {
      const response = await api.post<Medicine>("/medicines", medicineData);
      return response.data;
    } catch (error) {
      console.error("Error adding medicine:", error);
      throw error;
    }
  },

  // Update medicine
  async updateMedicine(
    medicineId: number,
    data: MedicineUpdateRequest
  ): Promise<Medicine> {
    try {
      const response = await api.put<Medicine>(
        `/medicines/${medicineId}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error updating medicine:", error);
      throw error;
    }
  },

  // Delete medicine
  async deleteMedicine(medicineId: number): Promise<string> {
    try {
      const response = await api.delete<string>(`/medicines/${medicineId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting medicine:", error);
      throw error;
    }
  },

  // Get medicines by category
  async getMedicinesByCategory(category: string): Promise<Medicine[]> {
    try {
      const response = await api.get<Medicine[]>(
        `/medicines/search?category=${category}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting medicines by category:", error);
      throw error;
    }
  },

  // Get low stock medicines (custom implementation)
  async getLowStockMedicines(threshold = 10): Promise<Medicine[]> {
    try {
      const allMedicines = await this.getAllMedicines();
      return allMedicines.filter(
        (medicine) => medicine.quantity && medicine.quantity <= threshold
      );
    } catch (error) {
      console.error("Error getting low stock medicines:", error);
      throw error;
    }
  },

  // Update medicine quantity (using update medicine endpoint)
  async updateMedicineQuantity(
    medicineId: number,
    quantity: number
  ): Promise<Medicine> {
    try {
      const response = await api.put<Medicine>(`/medicines/${medicineId}`, {
        quantity,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating medicine quantity:", error);
      throw error;
    }
  },

  // Get all prescriptions by patientId
  async getPrescriptionsByPatientId(
    patientId: number
  ): Promise<PrescriptionResponse[]> {
    try {
      const response = await api.get<PrescriptionResponse[]>(
        `/prescriptions/patient/${patientId}`
      );

      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      const processedData = response.data.map((prescription: any) => {
        const rawDetails =
          (prescription as any).prescription_details ||
          prescription.prescriptionDetails ||
          [];

        return {
          ...prescription,
          // ✅ thêm status mặc định
          status: prescription.status ?? "ACTIVE",
          systolicBloodPressure:
            prescription.systolic_blood_pressure ??
            prescription.systolicBloodPressure ??
            null,
          diastolicBloodPressure:
            prescription.diastolic_blood_pressure ??
            prescription.diastolicBloodPressure ??
            null,
          heartRate: prescription.heart_rate ?? prescription.heartRate ?? null,
          bloodSugar:
            prescription.blood_sugar ?? prescription.bloodSugar ?? null,
          prescriptionDetails: rawDetails.map((detail: any) => ({
            ...detail,
            medicine: detail.medicine
              ? {
                  ...detail.medicine,
                  medicineId:
                    detail.medicine.medicine_id ?? detail.medicine.medicineId,
                  medicineName:
                    detail.medicine.medicine_name ??
                    detail.medicine.medicineName,
                }
              : null,
            quantity:
              detail.quantity !== undefined && detail.quantity !== null
                ? Number(detail.quantity)
                : 1,
          })),
        };
      });

      return processedData;
    } catch (error) {
      console.error("=== ERROR in getPrescriptionsByPatientId ===", error);
      throw error;
    }
  },

  // ❌ Không xoá thật BE, chỉ mock cancel FE
  async deletePrescription(prescriptionId: number): Promise<void> {
    try {
      console.log(`Mock cancel prescription ${prescriptionId}`);
      // Trả về resolve, để FE tự set status = CANCEL
      return Promise.resolve();
    } catch (error) {
      console.error("Error deleting prescription:", error);
      throw error;
    }
  },

  // Thêm alias function để tương thích với code hiện tại
  async getPrescriptionHistoryByPatientId(
    patientId: number
  ): Promise<PrescriptionResponse[]> {
    return this.getPrescriptionsByPatientId(patientId);
  },

  // Create a new prescription
  async createPrescription(
    data: CreatePrescriptionRequest
  ): Promise<Prescription> {
    try {
      const response = await api.post(`/prescriptions/`, data);
      return response.data;
    } catch (error) {
      console.error("Error creating prescription:", error);
      throw new Error("Không thể tạo toa thuốc");
    }
  },

  // Update an existing prescription
  async updatePrescription(
    prescriptionId: number,
    prescriptionData: any
  ): Promise<PrescriptionResponse> {
    try {
      console.log("Updating prescription with data:", prescriptionData);

      const processedData = {
        ...prescriptionData,
        prescription_details:
          prescriptionData.prescription_details?.map((detail: any) => {
            const quantity =
              typeof detail.quantity === "number"
                ? detail.quantity
                : Number.parseInt(String(detail.quantity)) || 1;

            return {
              medicine_id: detail.medicine_id ?? detail.medicine?.medicineId, // 👈 fallback cho medicine object
              dosage: detail.dosage || "",
              frequency: detail.frequency || "",
              duration: detail.duration || "",
              prescription_notes: detail.prescription_notes || "",
              quantity: Math.max(1, quantity),
            };
          }) || [],
      };

      const response = await api.put<PrescriptionResponse>(
        `/prescriptions/${prescriptionId}/`,
        processedData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating prescription:", error);
      throw error;
    }
  },

  // Add a new prescription detail
  async addPrescriptionDetail(
    prescriptionDetail: PrescriptionDetailRequest
  ): Promise<PrescriptionResponse> {
    try {
      const response = await api.post<PrescriptionResponse>(
        "/prescription/details",
        prescriptionDetail
      );
      return response.data;
    } catch (error) {
      console.error("Error adding prescription detail:", error);
      throw error;
    }
  },
};
