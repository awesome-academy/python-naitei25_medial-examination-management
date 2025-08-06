import type {
  Medicine,
  MedicineRequest,
  MedicineUpdateRequest,
  PrescriptionResponse,
  PrescriptionDetailRequest,
} from "../types/pharmacy";
import { api } from "../../../shared/services/api";

export const medicineService = {
  // Get all medicines
  async getAllMedicines(): Promise<Medicine[]> {
    try {
      console.log("Calling API: /pharmacy/medicines");
      const response = await api.get<Medicine[]>("/pharmacy/medicines");
      console.log("API Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in getAllMedicines:", error);
      throw error;
    }
  },

  // Get medicine by ID
  async getMedicineById(medicineId: number): Promise<Medicine> {
    try {
      const response = await api.get<Medicine>(
        `/pharmacy/medicines/${medicineId}`
      );
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
        `/pharmacy/medicines/search?${params.toString()}`
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
      const response = await api.post<Medicine>(
        "/pharmacy/medicines",
        medicineData
      );
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
        `/pharmacy/medicines/${medicineId}`,
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
      const response = await api.delete<string>(
        `/pharmacy/medicines/${medicineId}`
      );
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
        `/pharmacy/medicines/search?category=${category}`
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
      return allMedicines.filter((medicine) => medicine.quantity <= threshold);
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
      const response = await api.put<Medicine>(
        `/pharmacy/medicines/${medicineId}`,
        { quantity }
      );
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
      console.log("=== DEBUG: Calling getPrescriptionsByPatientId ===");
      console.log("PatientId:", patientId);
      console.log("API URL:", `/pharmacy/prescriptions/patient/${patientId}`);
      
      const response = await api.get<PrescriptionResponse[]>(
        `/pharmacy/prescriptions/patient/${patientId}`
      );
      
      // Debug: Log the raw response to see what backend returns
      console.log("=== DEBUG: Raw backend response ===");
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      console.log("Response data:", JSON.stringify(response.data, null, 2));
      
      // Check if response has data
      if (!response.data || !Array.isArray(response.data)) {
        console.warn("Backend returned unexpected data format:", response.data);
        return [];
      }
      
      // Process and validate the response data
      const processedData = response.data.map((prescription, prescriptionIndex) => {
        console.log(`=== Processing prescription ${prescriptionIndex + 1} ===`);
        console.log("Prescription ID:", prescription.prescriptionId);
        console.log("Raw prescription:", JSON.stringify(prescription, null, 2));
        
        return {
          ...prescription,
          prescriptionDetails: prescription.prescriptionDetails?.map((detail, detailIndex) => {
            console.log(`--- Processing detail ${detailIndex + 1} ---`);
            console.log("Detail ID:", detail.detailId);
            console.log("Medicine:", detail.medicine?.medicineName);
            console.log("Raw quantity value:", detail.quantity);
            console.log("Quantity type:", typeof detail.quantity);
            console.log("Quantity === undefined:", detail.quantity === undefined);
            console.log("Quantity === null:", detail.quantity === null);
            
            const processedDetail = {
              ...detail,
              // Ensure quantity has a default value if undefined/null
              quantity: detail.quantity !== undefined && detail.quantity !== null ? detail.quantity : 1
            };
            
            console.log("Processed quantity:", processedDetail.quantity);
            console.log("Processed detail:", JSON.stringify(processedDetail, null, 2));
            
            return processedDetail;
          }) || []
        };
      });
      
      console.log("=== Final processed data ===");
      console.log(JSON.stringify(processedData, null, 2));
      return processedData;
    } catch (error) {
      console.error("=== ERROR in getPrescriptionsByPatientId ===");
      console.error("Error details:", error);
      throw error;
    }
  },

  // Create a new prescription
  async createPrescription(
    prescriptionData: any
  ): Promise<PrescriptionResponse> {
    try {
      // Debug: Log the data being sent to backend
      console.log("Sending prescription data to backend:", prescriptionData);
      
      // Ensure all prescription details have valid quantity
      const processedData = {
        ...prescriptionData,
        prescriptionDetails: prescriptionData.prescriptionDetails?.map((detail: any) => {
          const quantity = typeof detail.quantity === 'number' ? detail.quantity : parseInt(String(detail.quantity)) || 1;
          console.log(`Processing detail for backend: medicine=${detail.medicineId}, quantity=${quantity}`);
          return {
            ...detail,
            quantity: Math.max(1, quantity) // Ensure quantity is at least 1
          };
        }) || []
      };
      
      console.log("Processed data for backend:", processedData);
      
      const response = await api.post<PrescriptionResponse>(
        "/pharmacy/prescriptions",
        processedData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating prescription:", error);
      throw error;
    }
  },

  // Update an existing prescription
  async updatePrescription(
    prescriptionId: number,
    prescriptionData: any
  ): Promise<PrescriptionResponse> {
    try {
      console.log("Updating prescription with data:", prescriptionData);
      
      // Ensure all prescription details have valid quantity
      const processedData = {
        ...prescriptionData,
        prescriptionDetails: prescriptionData.prescriptionDetails?.map((detail: any) => {
          const quantity = typeof detail.quantity === 'number' ? detail.quantity : parseInt(String(detail.quantity)) || 1;
          return {
            ...detail,
            quantity: Math.max(1, quantity)
          };
        }) || []
      };
      
      const response = await api.put<PrescriptionResponse>(
        `/pharmacy/prescriptions/${prescriptionId}`,
        processedData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating prescription:", error);
      throw error;
    }
  },

  // Delete a prescription
  async deletePrescription(prescriptionId: number): Promise<void> {
    try {
      await api.delete(`/pharmacy/prescriptions/${prescriptionId}`);
    } catch (error) {
      console.error("Error deleting prescription:", error);
      throw error;
    }
  },

  // Add a new prescription detail
  async addPrescriptionDetail(
    prescriptionDetail: PrescriptionDetailRequest
  ): Promise<PrescriptionResponse> {
    try {
      const response = await api.post<PrescriptionResponse>(
        "/pharmacy/prescription/details",
        prescriptionDetail
      );
      return response.data;
    } catch (error) {
      console.error("Error adding prescription detail:", error);
      throw error;
    }
  },
};
