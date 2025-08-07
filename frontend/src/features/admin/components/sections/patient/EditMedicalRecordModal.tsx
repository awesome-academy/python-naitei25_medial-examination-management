import { useState, useEffect } from "react";
import { Modal } from "../../ui/modal";
import {
  UpdatePrescriptionRequest,
  PrescriptionDetailRequest,
  PrescriptionResponse,
  Medicine,
} from "../../../types/pharmacy";
import { medicineService } from "../../../services/pharmacyService";

interface EditMedicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prescriptionId: number, data: UpdatePrescriptionRequest) => Promise<void>;
  prescription: PrescriptionResponse | null;
}

export default function EditMedicalRecordModal({
  isOpen,
  onClose,
  onSubmit,
  prescription,
}: EditMedicalRecordModalProps) {
  const [form, setForm] = useState<UpdatePrescriptionRequest>({
    followUpDate: "",
    isFollowUp: false,
    diagnosis: "",
    systolicBloodPressure: 120,
    diastolicBloodPressure: 80,
    heartRate: 70,
    bloodSugar: 90,
    note: "",
    prescriptionDetails: [],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  
  // State for frequency inputs (times and unit)
  const [frequencyInputs, setFrequencyInputs] = useState<{[key: number]: {times: string, unit: string}}>({});

  // Load medicines on component mount
  useEffect(() => {
    const loadMedicines = async () => {
      try {
        const medicineList = await medicineService.getAllMedicines();
        setMedicines(medicineList);
      } catch (error) {
        console.error("Error loading medicines:", error);
      }
    };
    loadMedicines();
  }, []);

  // Initialize form when prescription changes
  useEffect(() => {
    if (prescription && isOpen) {
      // Parse frequency for existing prescription details
      const initialFrequencyInputs: {[key: number]: {times: string, unit: string}} = {};
      
      const prescriptionDetails = prescription.prescriptionDetails.map((detail, index) => {
        // Parse frequency like "2 lần/ngày" into times and unit
        const frequencyMatch = detail.frequency.match(/(\d+)\s*lần\/(.+)/);
        if (frequencyMatch) {
          initialFrequencyInputs[index] = {
            times: frequencyMatch[1],
            unit: frequencyMatch[2]
          };
        } else {
          initialFrequencyInputs[index] = { times: '', unit: 'ngày' };
        }

        return {
          medicineId: detail.medicine.medicineId,
          dosage: detail.dosage,
          frequency: detail.frequency,
          duration: detail.duration,
          quantity: detail.quantity,
          prescriptionNotes: detail.prescriptionNotes || "",
        };
      });

      setFrequencyInputs(initialFrequencyInputs);

      setForm({
        followUpDate: prescription.followUpDate || "",
        isFollowUp: prescription.isFollowUp,
        diagnosis: prescription.diagnosis,
        systolicBloodPressure: prescription.systolicBloodPressure,
        diastolicBloodPressure: prescription.diastolicBloodPressure,
        heartRate: prescription.heartRate,
        bloodSugar: prescription.bloodSugar,
        note: prescription.note || "",
        prescriptionDetails,
      });
      setErrors({});
    }
  }, [prescription, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.diagnosis?.trim()) {
      newErrors.diagnosis = "Chẩn đoán là bắt buộc";
    }

    if (form.systolicBloodPressure && (form.systolicBloodPressure < 80 || form.systolicBloodPressure > 200)) {
      newErrors.systolicBloodPressure = "Huyết áp tâm thu phải từ 80-200 mmHg";
    }

    if (form.diastolicBloodPressure && (form.diastolicBloodPressure < 40 || form.diastolicBloodPressure > 120)) {
      newErrors.diastolicBloodPressure = "Huyết áp tâm trương phải từ 40-120 mmHg";
    }

    if (form.heartRate && (form.heartRate < 40 || form.heartRate > 200)) {
      newErrors.heartRate = "Nhịp tim phải từ 40-200 bpm";
    }

    if (form.bloodSugar && (form.bloodSugar < 50 || form.bloodSugar > 500)) {
      newErrors.bloodSugar = "Đường huyết phải từ 50-500 mg/dL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? target.checked : value,
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !prescription) {
      return;
    }

    // Debug: Log form data before submitting
    console.log("Form data being submitted:", form);
    console.log("Prescription details:", form.prescriptionDetails);
    form.prescriptionDetails?.forEach((detail, index) => {
      console.log(`Detail ${index}:`, detail);
      console.log(`Quantity for detail ${index}:`, detail.quantity, typeof detail.quantity);
    });

    try {
      setLoading(true);
      await onSubmit(prescription.prescriptionId, form);
      onClose();
    } catch (error) {
      console.error("Error updating medical record:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  // Functions for managing prescription details
  const addPrescriptionDetail = () => {
    const newDetail: PrescriptionDetailRequest = {
      medicineId: 0,
      dosage: "",
      frequency: "",
      duration: "",
      quantity: 1,
      prescriptionNotes: "",
    };
    const newIndex = form.prescriptionDetails?.length || 0;
    
    // Initialize frequency inputs for the new detail
    setFrequencyInputs(prev => ({
      ...prev,
      [newIndex]: { times: '', unit: 'ngày' }
    }));
    
    setForm((prev) => ({
      ...prev,
      prescriptionDetails: [...(prev.prescriptionDetails || []), newDetail],
    }));
  };

  const updatePrescriptionDetail = (
    index: number,
    field: keyof PrescriptionDetailRequest,
    value: string | number
  ) => {
    setForm((prev) => ({
      ...prev,
      prescriptionDetails: prev.prescriptionDetails?.map((detail, i) =>
        i === index ? { ...detail, [field]: value } : detail
      ) || [],
    }));
  };

  const removePrescriptionDetail = (index: number) => {
    // Remove the frequency input for this index
    setFrequencyInputs(prev => {
      const newFrequencyInputs = { ...prev };
      delete newFrequencyInputs[index];
      
      // Reindex remaining frequency inputs
      const reindexed: {[key: number]: {times: string, unit: string}} = {};
      Object.keys(newFrequencyInputs)
        .map(k => parseInt(k))
        .filter(k => k > index)
        .forEach(k => {
          reindexed[k - 1] = newFrequencyInputs[k];
        });
      
      // Keep frequency inputs with index less than removed index
      Object.keys(newFrequencyInputs)
        .map(k => parseInt(k))
        .filter(k => k < index)
        .forEach(k => {
          reindexed[k] = newFrequencyInputs[k];
        });

      return reindexed;
    });
    
    setForm((prev) => ({
      ...prev,
      prescriptionDetails: prev.prescriptionDetails?.filter(
        (_, i) => i !== index
      ) || [],
    }));
  };

  // Helper functions for frequency
  const updateFrequencyTimes = (index: number, times: string) => {
    const currentFreq = frequencyInputs[index] || { times: '', unit: 'ngày' };
    const newFreq = { ...currentFreq, times };
    setFrequencyInputs(prev => ({ ...prev, [index]: newFreq }));
    
    // Update the actual form data
    const frequencyString = times && newFreq.unit ? `${times} lần/${newFreq.unit}` : '';
    updatePrescriptionDetail(index, 'frequency', frequencyString);
  };

  const updateFrequencyUnit = (index: number, unit: string) => {
    const currentFreq = frequencyInputs[index] || { times: '', unit: 'ngày' };
    const newFreq = { ...currentFreq, unit };
    setFrequencyInputs(prev => ({ ...prev, [index]: newFreq }));
    
    // Update the actual form data
    const frequencyString = currentFreq.times && unit ? `${currentFreq.times} lần/${unit}` : '';
    updatePrescriptionDetail(index, 'frequency', frequencyString);
  };

  const getFrequencyTimes = (index: number) => {
    return frequencyInputs[index]?.times || '';
  };

  const getFrequencyUnit = (index: number) => {
    return frequencyInputs[index]?.unit || 'ngày';
  };

  if (!prescription) return null;
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-[700px] lg:p-8 mt-[5vh] mb-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
    >
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 px-2 pb-4">
          <h5 className="mb-4 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            Chỉnh sửa bệnh án
          </h5>
        </div>
        
        <div className="flex-1 px-2">
          <form id="edit-medical-record-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chẩn đoán <span className="text-red-500">*</span>
              </label>
              <input
                name="diagnosis"
                value={form.diagnosis || ""}
                onChange={handleChange}
                type="text"
                placeholder="Nhập chẩn đoán"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                title="Nhập chẩn đoán của bệnh nhân"
                required
              />
              {errors.diagnosis && (
                <p className="mt-1 text-sm text-red-600">{errors.diagnosis}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do khám
              </label>
              <textarea
                name="note"
                value={form.note || ""}
                onChange={handleChange}
                placeholder="Nhập lý do khám và ghi chú"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0 min-h-[80px] resize-none"
                title="Nhập lý do khám và ghi chú thêm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Huyết áp tâm thu <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="systolicBloodPressure"
                  value={form.systolicBloodPressure || 120}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                  min={80}
                  max={200}
                  title="Nhập huyết áp tâm thu (mmHg)"
                  placeholder="120"
                  required
                />
                {errors.systolicBloodPressure && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.systolicBloodPressure}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Huyết áp tâm trương <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="diastolicBloodPressure"
                  value={form.diastolicBloodPressure || 80}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                  min={40}
                  max={120}
                  title="Nhập huyết áp tâm trương (mmHg)"
                  placeholder="80"
                  required
                />
                {errors.diastolicBloodPressure && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.diastolicBloodPressure}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhịp tim <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="heartRate"
                  value={form.heartRate || 70}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                  min={40}
                  max={200}
                  title="Nhập nhịp tim (bpm)"
                  placeholder="70"
                  required
                />
                {errors.heartRate && (
                  <p className="mt-1 text-sm text-red-600">{errors.heartRate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đường huyết <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="bloodSugar"
                  value={form.bloodSugar || 90}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                  min={50}
                  max={500}
                  title="Nhập nồng độ đường huyết (mg/dL)"
                  placeholder="90"
                  required
                />
                {errors.bloodSugar && (
                  <p className="mt-1 text-sm text-red-600">{errors.bloodSugar}</p>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isFollowUp"
                checked={form.isFollowUp || false}
                onChange={handleChange}
                className="h-4 w-4 text-base-600 focus:ring-base-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Cần tái khám
              </label>
            </div>

            {form.isFollowUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày tái khám
                </label>
                <input
                  type="date"
                  name="followUpDate"
                  value={form.followUpDate || ""}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                />
              </div>
            )}

            {/* Prescription Details Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Chi tiết đơn thuốc
                </label>
                <button
                  type="button"
                  onClick={addPrescriptionDetail}
                  className="px-3 py-2 text-sm font-medium text-white bg-rose-800 rounded-lg hover:bg-rose-900"
                >
                  + Thêm thuốc
                </button>
              </div>
              {form.prescriptionDetails && form.prescriptionDetails.length > 0 ? (
                form.prescriptionDetails.map((detail, index) => (
                  <div
                    key={index}
                    className="p-4 mb-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h6 className="font-medium text-gray-700">Thuốc {index + 1}</h6>
                      <button
                        type="button"
                        onClick={() => removePrescriptionDetail(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Xóa
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Thuốc
                        </label>
                        <select
                          value={detail.medicineId}
                          onChange={(e) =>
                            updatePrescriptionDetail(
                              index,
                              "medicineId",
                              Number(e.target.value)
                            )
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                          title="Chọn thuốc từ danh sách"
                        >
                          <option value={0}>Chọn thuốc</option>
                          {medicines.map((med) => (
                            <option key={med.medicineId} value={med.medicineId}>
                              {med.medicineName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Liều lượng
                        </label>
                        <input
                          type="text"
                          value={detail.dosage}
                          onChange={(e) =>
                            updatePrescriptionDetail(index, "dosage", e.target.value)
                          }
                          placeholder="VD: 500mg"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                          title="Nhập liều lượng thuốc"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số lần
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={getFrequencyTimes(index)}
                            onChange={(e) => updateFrequencyTimes(index, e.target.value)}
                            placeholder="2"
                            className="w-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                            min="1"
                            title="Nhập số lần dùng"
                          />
                        
                          <select
                            value={getFrequencyUnit(index)}
                            onChange={(e) => updateFrequencyUnit(index, e.target.value)}
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                            title="Chọn đơn vị thời gian"
                          >
                            <option value="ngày">ngày</option>
                            <option value="tuần">tuần</option>
                            <option value="tháng">tháng</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Thời gian
                        </label>
                        <input
                          type="text"
                          value={detail.duration}
                          onChange={(e) =>
                            updatePrescriptionDetail(index, "duration", e.target.value)
                          }
                          placeholder="VD: 7 ngày"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                          title="Nhập thời gian dùng thuốc"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số lượng
                        </label>
                        <input
                          type="number"
                          value={detail.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            console.log("Updating quantity for index", index + ":", value, typeof value);
                            updatePrescriptionDetail(
                              index,
                              "quantity",
                              value
                            );
                          }}
                          min="1"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                          title="Nhập số lượng thuốc"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ghi chú
                        </label>
                        <textarea
                          value={detail.prescriptionNotes || ""}
                          onChange={(e) =>
                            updatePrescriptionDetail(
                              index,
                              "prescriptionNotes",
                              e.target.value
                            )
                          }
                          placeholder="Ghi chú thêm về cách dùng thuốc"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0 min-h-[80px] resize-none"
                          title="Nhập ghi chú về cách dùng"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg border">
                  Chưa có thuốc nào trong đơn. Nhấn "Thêm thuốc" để thêm.
                </p>
              )}
            </div>
          </form>
        </div>
        
        <div className="flex-shrink-0 pt-4 px-2">
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={handleClose}
              type="button"
              className="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
            >
              Hủy
            </button>
            <button
              form="edit-medical-record-form"
              type="submit"
              disabled={loading}
              className="flex justify-center rounded-lg bg-base-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-base-900 disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : "Cập nhật bệnh án"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
