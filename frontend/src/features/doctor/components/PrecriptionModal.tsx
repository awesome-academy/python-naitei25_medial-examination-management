"use client";
import type React from "react";
import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Table,
  Typography,
  InputNumber,
  Spin,
  message,
} from "antd";
import {
  SearchOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { usePatientDetail } from "../hooks/usePatientDetail";
import type { Medicine } from "../types/medicine";
import type { PrescriptionDetail } from "../types/prescriptionDetail";
import type { Prescription } from "../types/prescription";
import { dateToString } from "../services/dateHelpServices";
import { PrescriptionPDF } from "./PrescriptionPDF";
import { useAppointmentContext } from "../context/AppointmentContext";
import { useTranslation } from "react-i18next";
import { pharmacyService } from "../services/pharmacyServices";

const { Text } = Typography;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId?: number;
  existingPrescription?: Prescription | null;
  onPrescriptionSaved?: () => void;
  formParent: any;
}

const isValidPrescription = (pres?: Prescription | null) => {
  return !!(
    pres &&
    (pres.diagnosis?.trim() || (pres.prescription_details?.length ?? 0) > 0)
  );
};

export const PrescriptionModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
  existingPrescription,
  onPrescriptionSaved,
  formParent,
}) => {
  const { t } = useTranslation();
  const {
    patientDetail,
    prescription,
    medications,
    currentPrescriptionId,
    setCurrentPrescriptionId,
    searchInput,
    searchLoading,
    saving,
    searchMedicines,
    addMedicine,
    updateMedicationField,
    deleteMedication,
    savePrescription,
    loadExistingPrescription,
    checkExistingPrescription,
    setSearchInput,
    setMedications,
  } = usePatientDetail(appointmentId);
  const { appointments } = useAppointmentContext();
  const [form] = Form.useForm();
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [savedPrescription, setSavedPrescription] =
    useState<Prescription | null>(null);
  const [showPDF, setShowPDF] = useState(false);
  const appointment = appointments.find(
    (appt) => appt.appointmentId === appointmentId
  );
  const isCompleted = appointment?.appointmentStatus === "COMPLETED";
  const patientName = appointment?.patientInfo
    ? `${appointment.patientInfo.first_name || ""} ${
        appointment.patientInfo.last_name || ""
      }`.trim()
    : t("labels.unknownPatient");
  const patientCode =
    existingPrescription?.patient ||
    patientDetail?.patient ||
    t("labels.unknownPatientCode");
  useEffect(() => {
    if (isOpen && appointmentId) {
      if (
        isValidPrescription(existingPrescription) &&
        existingPrescription?.appointment === appointmentId
      ) {
        console.log("Loading existing prescription:", existingPrescription);
        loadExistingPrescription(existingPrescription!);
        form.setFieldsValue({ doctorNotes: existingPrescription!.note || "" });
      } else {
        checkExistingPrescription()
          .then((existing) => {
            console.log("checkExistingPrescription result:", existing);
            if (
              isValidPrescription(existing) &&
              existing?.appointment === appointmentId
            ) {
              message.warning(t("errors.prescriptionAlreadyExists"));
              loadExistingPrescription(existing);
              form.setFieldsValue({ doctorNotes: existing.note || "" });
            } else {
              form.resetFields();
              setMedications([]);
              setCurrentPrescriptionId(null);
            }
          })
          .catch((err) => {
            console.error("Error checking existing prescription:", err);
            form.resetFields();
            setMedications([]);
            setCurrentPrescriptionId(null);
          });
      }
    }
  }, [
    isOpen,
    appointmentId,
    existingPrescription,
    checkExistingPrescription,
    loadExistingPrescription,
    form,
    setMedications,
    t,
  ]);
  useEffect(() => {
    if (!isOpen) {
      form.resetFields();
      setSearchInput("");
      setMedications([]);
    }
  }, [isOpen, form, setSearchInput, setMedications]);
  const handleSearch = async (value: string) => {
    if (isCompleted) return;
    setSearchInput(value);
    if (value.trim()) {
      const results = await searchMedicines(value);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };
  const handleAddMedicine = (medicine: Medicine) => {
    if (isCompleted) return;
    addMedicine(medicine);
    setSearchInput("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleSave = async () => {
    if (isCompleted) {
      message.warning(t("errors.cannotEditCompleted"));
      return;
    }
    if (!appointmentId || !medications || medications.length === 0) {
      message.error(t("errors.noMedicationsAdded"));
      return;
    }
    try {
      const values = await form.validateFields();
      const parentFormValues = await formParent.validateFields();
      const prescriptionData = {
        appointment: appointmentId,
        patient: patientDetail?.patient || existingPrescription?.patient || 0,
        follow_up_date: parentFormValues.followUpDate
          ? dateToString(parentFormValues.followUpDate)
          : null,
        is_follow_up: parentFormValues.isFollowUp || false,
        diagnosis:
          parentFormValues.diagnosis || existingPrescription?.diagnosis || "",
        systolic_blood_pressure: parentFormValues.systolicBloodPressure || 0,
        diastolic_blood_pressure: parentFormValues.diastolicBloodPressure || 0,
        heart_rate: parentFormValues.heartRate || 0,
        blood_sugar: parentFormValues.bloodSugar || 0,
        note: values.doctorNotes || "",
        prescription_details: medications.map((med) => ({
          id: med.id || undefined, // Thêm id từ medications, để undefined nếu là thuốc mới
          medicine_id: med.medicine_id,
          prescription_notes: med.prescriptionNotes || t("labels.noNotes"),
          dosage: med.dosage || "",
          frequency: med.frequency || t("options.frequency.onceMorning"),
          duration: med.duration || "",
          quantity: med.quantity || 1,
        })),
      };
      console.log("prescriptionData gửi API:", prescriptionData);
      let saved;
      if (currentPrescriptionId) {
        console.log("Cập nhật đơn thuốc với ID:", currentPrescriptionId);
        saved = await pharmacyService.updatePrescription(
          currentPrescriptionId,
          prescriptionData
        );
      } else {
        const existing = await checkExistingPrescription();
        if (isValidPrescription(existing)) {
          message.error(t("errors.prescriptionAlreadyExists"));
          return;
        }

        console.log("Tạo đơn thuốc mới");
        saved = await savePrescription(prescriptionData);
      }
      if (saved) {
        console.log("Đơn thuốc lưu thành công:", saved);
        setSavedPrescription(saved);
        message.success(t("success.prescriptionSaved"));
        onPrescriptionSaved?.();
        onClose();
      }
    } catch (error) {
      console.error("Error saving prescription:", error);
      message.error(t("errors.savePrescriptionFailed"));
    }
  };
  const columns = [
    {
      title: t("table.medicine"),
      dataIndex: ["medicine", "medicineName"],
      key: "medicineName",
      render: (text: string, record: PrescriptionDetail) => {
        if (!record.medicine) return <div>{t("labels.noInformation")}</div>;
        return (
          <div>
            <div className="font-medium">{record.medicine.medicine_name}</div>
            <div className="text-sm text-gray-500">
              {record.medicine.category}
            </div>
          </div>
        );
      },
    },
    {
      title: t("table.dosage"),
      dataIndex: "dosage",
      key: "dosage",
      render: (text: string, record: PrescriptionDetail, index: number) => (
        <Input
          value={text || ""}
          onChange={(e) =>
            updateMedicationField(index, "dosage", e.target.value)
          }
          className="w-full text-center"
          placeholder="1"
          disabled={isCompleted}
        />
      ),
    },
    {
      title: t("table.frequency"),
      dataIndex: "frequency",
      key: "frequency",
      render: (text: string, record: PrescriptionDetail, index: number) => (
        <Select
          value={text || t("options.frequency.onceMorning")}
          onChange={(value) => updateMedicationField(index, "frequency", value)}
          style={{ width: "100%" }}
          disabled={isCompleted}
          options={[
            {
              value: t("options.frequency.onceMorning"),
              label: t("options.frequency.onceMorning"),
            },
            {
              value: t("options.frequency.onceNoon"),
              label: t("options.frequency.onceNoon"),
            },
            {
              value: t("options.frequency.onceAfternoon"),
              label: t("options.frequency.onceAfternoon"),
            },
            {
              value: t("options.frequency.onceEvening"),
              label: t("options.frequency.onceEvening"),
            },
          ]}
        />
      ),
    },
    {
      title: t("table.duration"),
      dataIndex: "duration",
      key: "duration",
      render: (text: string, record: PrescriptionDetail, index: number) => (
        <Input
          value={text || ""}
          onChange={(e) =>
            updateMedicationField(index, "duration", e.target.value)
          }
          className="w-full text-center"
          disabled={isCompleted}
        />
      ),
    },
    {
      title: t("table.quantity"),
      dataIndex: "quantity",
      key: "quantity",
      render: (text: number, record: PrescriptionDetail, index: number) => (
        <InputNumber
          value={text || 1}
          onChange={(value) =>
            updateMedicationField(index, "quantity", value || 1)
          }
          className="w-full text-center"
          min={1}
          disabled={isCompleted}
        />
      ),
    },
    {
      title: "",
      key: "action",
      render: (_: any, record: PrescriptionDetail, index: number) =>
        !isCompleted && (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteMedication(index)}
          />
        ),
    },
  ];
  return (
    <>
      <Modal
        title={
          currentPrescriptionId
            ? t("titles.editPrescription")
            : t("titles.createPrescription")
        }
        open={isOpen}
        onCancel={onClose}
        footer={null}
        width={1200}
        destroyOnClose={true}
      >
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className="flex-1">
              <Text strong>
                {t("labels.patient")}: {patientName}
              </Text>
              <div>
                <Text type="secondary">
                  {t("labels.patientCode")}: {patientCode}
                </Text>
              </div>
            </div>
            <div className="text-right">
              <Text strong>
                {t("labels.date")}: {new Date().toLocaleDateString("vi-VN")}
              </Text>
            </div>
          </div>
          {/* Search thuốc */}
          <div className="flex items-center mb-4">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder={t("placeholders.searchMedicine")}
                prefix={<SearchOutlined />}
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
                suffix={searchLoading ? <Spin size="small" /> : null}
                disabled={isCompleted}
              />
              {!isCompleted &&
                showSearchResults &&
                searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                    {searchResults.map((medicine) => (
                      <div
                        key={medicine.medicineId}
                        className="p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleAddMedicine(medicine)}
                      >
                        <div className="font-medium">
                          {medicine.medicine_name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
          {/* Table thuốc */}
          {medications.length > 0 && (
            <Table
              columns={columns}
              dataSource={medications}
              rowKey={(record, index) =>
                `${record.medicine?.medicineId || 0}-${index}`
              }
              pagination={false}
              className="mb-6"
            />
          )}
          <Form form={form} layout="vertical">
            <Form.Item label={t("labels.doctorNotes")} name="doctorNotes">
              <Input.TextArea rows={4} disabled={isCompleted} />
            </Form.Item>
          </Form>
        </div>
        <div className="flex justify-between">
          <div>
            {(savedPrescription && isValidPrescription(savedPrescription)) ||
            (Array.isArray(prescription) &&
              prescription.some(isValidPrescription)) ? (
              <Button
                icon={<DownloadOutlined />}
                onClick={() => setShowPDF(true)}
                type="default"
              >
                {t("buttons.viewPDF")}
              </Button>
            ) : null}
          </div>
          <div className="flex space-x-3">
            <Button onClick={onClose}>{t("buttons.cancel")}</Button>
            <Button
              type="primary"
              onClick={handleSave}
              loading={saving}
              disabled={isCompleted || !medications || medications.length === 0}
            >
              {" "}
              {currentPrescriptionId
                ? t("buttons.updatePrescription")
                : t("buttons.savePrescription")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* PDF Modal */}
      <Modal
        title={t("titles.prescriptionPDF")}
        open={showPDF}
        onCancel={() => setShowPDF(false)}
        footer={null}
        width={1000}
      >
        {(savedPrescription && isValidPrescription(savedPrescription)) ||
        (Array.isArray(prescription) &&
          prescription.some(isValidPrescription)) ? (
          <PrescriptionPDF
            prescription={
              savedPrescription && isValidPrescription(savedPrescription)
                ? savedPrescription
                : prescription!.find(isValidPrescription)!
            }
            patientName={patientName}
            patientInfo={patientDetail?.patientInfo}
            showControls={true}
          />
        ) : null}
      </Modal>
    </>
  );
};
