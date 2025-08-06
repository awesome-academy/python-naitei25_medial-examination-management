import { useState, useEffect } from "react";
import { Modal } from "../../ui/modal";
import {
  CreatePrescriptionRequest,
  PrescriptionDetailRequest,
  Medicine,
} from "../../../types/pharmacy";
import { medicineService } from "../../../services/pharmacyService";

interface AddMedicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePrescriptionRequest) => Promise<void>;
  patientId: number;
  appointmentId?: number;
}

export default function AddMedicalRecordModal({
  isOpen,
  onClose,
  onSubmit,
  patientId,
  appointmentId,
}: AddMedicalRecordModalProps) {
  const [form, setForm] = useState<CreatePrescriptionRequest>({
    appointmentId: appointmentId || 0,
    patientId,
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.diagnosis.trim()) {
      newErrors.diagnosis = "Chẩn đoán là bắt buộc";
    }

    if (form.systolicBloodPressure < 80 || form.systolicBloodPressure > 200) {
      newErrors.systolicBloodPressure = "Huyết áp tâm thu phải từ 80-200 mmHg";
    }

    if (form.diastolicBloodPressure < 40 || form.diastolicBloodPressure > 120) {
      newErrors.diastolicBloodPressure =
        "Huyết áp tâm trương phải từ 40-120 mmHg";
    }

    if (form.heartRate < 40 || form.heartRate > 200) {
      newErrors.heartRate = "Nhịp tim phải từ 40-200 bpm";
    }

    if (form.bloodSugar < 50 || form.bloodSugar > 500) {
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

    if (!validateForm()) {
      return;
    }

    // Debug: Log the form data before submitting
    console.log("Form data before submission:", form);
    console.log("Prescription details:", form.prescriptionDetails);
    
    // Validate and clean prescription details
    const cleanedForm = {
      ...form,
      prescriptionDetails: form.prescriptionDetails.map(detail => {
        const quantity = typeof detail.quantity === 'number' ? detail.quantity : parseInt(String(detail.quantity)) || 1;
        const medicineId = typeof detail.medicineId === 'number' ? detail.medicineId : parseInt(String(detail.medicineId)) || 0;
        
        console.log(`Processing prescription detail - Medicine ID: ${medicineId}, Quantity: ${quantity}`);
        
        return {
          ...detail,
          quantity: Math.max(1, quantity), // Ensure quantity is at least 1
          medicineId: medicineId
        };
      })
    };
    
    // Validate prescription details after cleaning
    const invalidDetails = cleanedForm.prescriptionDetails.filter(detail => 
      detail.medicineId === 0 || detail.quantity < 1 || !detail.dosage || !detail.frequency || !detail.duration
    );
    
    if (invalidDetails.length > 0) {
      console.error("Invalid prescription details found:", invalidDetails);
      alert("Vui lòng điền đầy đủ thông tin cho tất cả thuốc trong đơn");
      return;
    }

    console.log("Cleaned form data:", cleanedForm);

    try {
      setLoading(true);
      
      // Use Promise.resolve to ensure proper async handling
      await Promise.resolve(onSubmit(cleanedForm));

      // Reset form after successful submission
      setForm({
        appointmentId: appointmentId || 0,
        patientId,
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
      setFrequencyInputs({});
      setErrors({});
      
      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        onClose();
      }, 100);
      
    } catch (error) {
      console.error("Error creating medical record:", error);
      alert("Thêm bệnh án thất bại! Vui lòng kiểm tra lại thông tin.");
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
      quantity: 1, // Default quantity should be 1
      prescriptionNotes: "",
    };
    const newIndex = form.prescriptionDetails.length;
    
    console.log(`Adding new prescription detail at index ${newIndex}:`, newDetail);
    
    // Initialize frequency inputs for the new detail
    setFrequencyInputs(prev => ({
      ...prev,
      [newIndex]: { times: '', unit: 'ngày' }
    }));
    
    setForm((prev) => {
      const updatedForm = {
        ...prev,
        prescriptionDetails: [...prev.prescriptionDetails, newDetail],
      };
      console.log('Updated form after adding detail:', updatedForm.prescriptionDetails);
      return updatedForm;
    });
  };

  const updatePrescriptionDetail = (
    index: number,
    field: keyof PrescriptionDetailRequest,
    value: string | number
  ) => {
    // Process value based on field type
    let processedValue = value;
    if (field === 'quantity') {
      // Ensure quantity is always a positive integer
      const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
      processedValue = Math.max(1, isNaN(numValue) ? 1 : numValue);
      console.log(`Updating quantity for index ${index}: ${value} -> ${processedValue} (type: ${typeof processedValue})`);
    } else if (field === 'medicineId') {
      // Ensure medicineId is a number
      const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
      processedValue = isNaN(numValue) ? 0 : numValue;
    }
    
    setForm((prev) => ({
      ...prev,
      prescriptionDetails: prev.prescriptionDetails.map((detail, i) =>
        i === index ? { ...detail, [field]: processedValue } : detail
      ),
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
      prescriptionDetails: prev.prescriptionDetails.filter(
        (_, i) => i !== index
      ),
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-[700px] lg:p-8 mt-[5vh] mb-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
    >
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 px-2 pb-4">
          <h5 className="mb-4 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            Thêm bệnh án mới
          </h5>
        </div>
        
        <div className="flex-1 px-2">
          <form id="medical-record-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chẩn đoán <span className="text-red-500">*</span>
              </label>
              <input
                name="diagnosis"
                value={form.diagnosis}
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
                value={form.note}
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
                  value={form.systolicBloodPressure}
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
                  value={form.diastolicBloodPressure}
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
                  value={form.heartRate}
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
                  value={form.bloodSugar}
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
                checked={form.isFollowUp}
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
                  value={form.followUpDate}
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
              {form.prescriptionDetails.map((detail, index) => {
                console.log(`Rendering detail ${index}:`, detail, `quantity: ${detail.quantity}`);
                return (
                <div
                  key={index}
                  className="p-4 mb-4 bg-gray-50 rounded-lg border"
                >
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
                          updatePrescriptionDetail(
                            index,
                            "dosage",
                            e.target.value
                          )
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                        placeholder="VD: 500mg"
                      />
                    </div>
                    
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số lần
                      </label>
                      <input
                        type="number"
                        value={getFrequencyTimes(index)}
                        onChange={(e) =>
                          updateFrequencyTimes(index, e.target.value)
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                        placeholder="VD: 2"
                        title="Nhập số lần sử dụng thuốc"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Đơn vị thời gian
                      </label>
                      <select
                        value={getFrequencyUnit(index)}
                        onChange={(e) =>
                          updateFrequencyUnit(index, e.target.value)
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                        title="Chọn đơn vị thời gian"
                      >
                        <option value="ngày">ngày</option>
                        <option value="tuần">tuần</option>
                        <option value="tháng">tháng</option>
                        <option value="giờ">giờ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thời gian dùng
                      </label>
                      <input
                        type="text"
                        value={detail.duration}
                        onChange={(e) =>
                          updatePrescriptionDetail(
                            index,
                            "duration",
                            e.target.value
                          )
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                        placeholder="VD: 7 ngày"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số lượng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={detail.quantity || 1}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          const quantity = inputValue === '' ? 1 : Math.max(1, parseInt(inputValue, 10) || 1);
                          console.log(`Updating quantity for detail ${index}: input="${inputValue}" -> quantity=${quantity}`);
                          updatePrescriptionDetail(
                            index,
                            "quantity",
                            quantity
                          );
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                        min={1}
                        step={1}
                        title="Nhập số lượng thuốc (tối thiểu 1)"
                        placeholder="1"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú
                    </label>
                    <textarea
                      value={detail.prescriptionNotes}
                      onChange={(e) =>
                        updatePrescriptionDetail(
                          index,
                          "prescriptionNotes",
                          e.target.value
                        )
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0 resize-none"
                      placeholder="Nhập ghi chú cho đơn thuốc"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => removePrescriptionDetail(index)}
                      className="px-3 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200"
                    >
                      Xóa thuốc
                    </button>
                    <button
                      type="button"
                      onClick={addPrescriptionDetail}
                      className="px-3 py-2 text-sm font-medium text-base-500 bg-base-500/20 rounded-lg hover:bg-base-800/20"
                    >
                      Thêm thuốc
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </form>
        </div>

        <div className="flex-shrink-0 px-2 pt-4 border-t border-gray-200 bg-white">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2.5 text-sm font-medium text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              form="medical-record-form"
              className="px-4 py-2.5 text-sm font-medium text-white bg-base-600 rounded-lg hover:bg-base-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Đang lưu..." : "Lưu bệnh án"}
            </button>
          </div>
        </div>
      </div>
    </Modal>

  );
}
