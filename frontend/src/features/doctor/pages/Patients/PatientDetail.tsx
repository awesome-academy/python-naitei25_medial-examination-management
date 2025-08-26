"use client";
import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Form,
  Input,
  DatePicker,
  Button,
  Checkbox,
  Typography,
  Spin,
  Tabs,
  InputNumber,
  message,
  Select,
  Tag,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  MessageOutlined,
  ReloadOutlined,
  CloseOutlined,
  MedicineBoxOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { PrescriptionModal } from "../../components/PrecriptionModal";
import { ServiceOrderModal } from "../../components/ServiceOrderModal";
import { PrescriptionHistoryModal } from "../../components/PrescriptionHistoryModal";
import { TestResultDetailModal } from "../../components/TestResultDetailModal";
import { usePatientDetail } from "../../hooks/usePatientDetail";
import { usePrescriptionHistory } from "../../hooks/usePrescriptionHistory";
import { useAppointmentContext } from "../../context/AppointmentContext";
import { NoteType } from "../../types/appointmentNote";
import type { Prescription } from "../../types/prescription";
import type { ServiceOrder } from "../../types/serviceOrder";
import { pharmacyService } from "../../services/pharmacyServices";
import { appointmentService } from "../../services/appointmentService";
import { stringToDate, dateToString } from "../../services/dateHelpServices";
import { useTranslation } from "react-i18next";
import { getAppointmentStatusColor } from "../../services/appointmentService";
import { deleteServiceOrder } from "../../services/serviceOrderService";
import { api } from "../../../../shared/services/api";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const PatientDetail: React.FC = () => {
  const { t } = useTranslation();
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
  const [isPrescriptionHistoryModalOpen, setIsPrescriptionHistoryModalOpen] =
    useState(false);
  const [isTestResultDetailModalOpen, setIsTestResultDetailModalOpen] =
    useState(false);
  const [selectedServiceOrder, setSelectedServiceOrder] =
    useState<ServiceOrder | null>(null);
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);
  const [noteText, setNoteText] = useState("");

  // Thêm state để quản lý việc user đã modify form
  const [userHasModified, setUserHasModified] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const { appointmentId } = location.state || {};
  const { appointments } = useAppointmentContext();

  const {
    patientDetail,
    prescription,
    serviceOrders,
    appointmentNotes,
    loading,
    serviceOrdersLoading,
    notesLoading,
    saving,
    prescriptionLoading,
    createAppointmentNote,
    deleteAppointmentNote,
    refreshAll,
    refreshSpecific,
    fetchPrescription,
  } = usePatientDetail(appointmentId);

  const {
    prescriptionHistory,
    loading: historyLoading,
    refreshHistory,
  } = usePrescriptionHistory(patientDetail?.patientInfo?.id);

  // Xử lý callback sau khi thêm/sửa đơn thuốc
  const handlePrescriptionSaved = async () => {
    setUserHasModified(true); // Đánh dấu user đã modify
    await refreshAll(appointmentId);
  };

  const [examinationComletedLoading, setExaminationComletedLoading] =
    useState(false);
  const [pendingTestStatusLoading, setPendingTestStatusLoading] =
    useState(false);
  // Xử lý khi user thay đổi các trường input
  const handleFieldChange = useCallback(() => {
    setUserHasModified(true);
  }, []);

  // Cập nhật useEffect để tránh reset form khi user đã modify
  useEffect(() => {
    if (patientDetail && (!userHasModified || !formInitialized)) {
      const formValues: any = {
        name:
          `${patientDetail.patientInfo?.first_name || ""} ${
            patientDetail.patientInfo?.last_name || ""
          }`.trim() || t("labels.unknownPatient"),
        clinic: patientDetail.schedule?.room || t("labels.unknownClinic"),
        doctor: patientDetail.doctorInfo?.fullName || t("labels.unknownDoctor"),
        appointmentTime: `${(patientDetail.slotStart || "").slice(0, 5)} - ${(
          patientDetail.slotEnd || ""
        ).slice(0, 5)}`,
        appointmentDate:
          patientDetail.schedule?.workDate || t("labels.unknownDate"),
        symptoms: patientDetail?.symptoms || "",
        note: patientDetail?.note || "",
      };

      if (prescription && prescription.appointment === appointmentId) {
        Object.assign(formValues, {
          diagnosis: prescription?.diagnosis || "",
          doctorNotes: prescription?.note || "",
          isFollowUp: prescription?.is_follow_up || false,
          followUpDate: stringToDate(prescription?.follow_up_date) || null,
          systolicBloodPressure:
            prescription?.systolic_blood_pressure || undefined,
          diastolicBloodPressure:
            prescription?.diastolic_blood_pressure || undefined,
          heartRate: prescription?.heart_rate || undefined,
          bloodSugar: prescription?.blood_sugar || undefined,
        });
      }

      form.setFieldsValue(formValues);

      if (!formInitialized) {
        setFormInitialized(true);
      }
    }
  }, [
    patientDetail,
    prescription,
    appointmentId,
    form,
    t,
    userHasModified,
    formInitialized,
  ]);

  const prescriptionsForCurrentAppointment = Array.isArray(prescription)
    ? prescription.filter((p) => p.appointment === appointmentId)
    : prescription && prescription.appointment === appointmentId
    ? [prescription]
    : [];

  const ChangeToPendingTestStatus = async () => {
    if (!appointmentId) {
      message.error(t("errors.noAppointmentFound"));
      return;
    }
    setPendingTestStatusLoading(true);

    try {
      const updateAppointmentData = {
        appointmentId: patientDetail?.appointmentId,
        doctorId: patientDetail?.doctorInfo?.doctorId,
        patientId: patientDetail?.patientInfo?.patientId,
        scheduleId: patientDetail?.schedule?.scheduleId,
        symptoms: patientDetail?.symptoms,
        note: patientDetail?.note,
        number: patientDetail?.number,
        slotStart: patientDetail?.slotStart,
        slotEnd: patientDetail?.slotEnd,
        appointmentStatus: "PENDING_TEST_RESULT",
      };

      await appointmentService.updateAppointmentById(
        appointmentId,
        updateAppointmentData
      );
      message.success(t("success.pendingTestResult"));
    } catch (error) {
      console.error(t("errors.failedToUpdateStatus"), error);
      message.error(t("errors.statusUpdateFailed"));
    } finally {
      setPendingTestStatusLoading(false);
    }
  };
  const handleCompleteExamination = async () => {
    if (!appointmentId) {
      message.error(t("errors.noAppointmentFound"));
      return;
    }
    setExaminationComletedLoading(true);
    try {
      const values = await form.validateFields();

      const requiredVitalSigns = [
        "systolicBloodPressure",
        "diastolicBloodPressure",
        "heartRate",
        "bloodSugar",
        "diagnosis",
        "doctorNotes",
      ];
      const missingVitalSigns = requiredVitalSigns.filter(
        (field) => !values[field]
      );

      if (missingVitalSigns.length > 0) {
        message.error(t("errors.missingRequiredFields"));
        return;
      }

      const updateData = {
        diagnosis: values.diagnosis || "",
        note: values.doctorNotes || "",
        is_follow_up: values.isFollowUp || false,
        follow_up_date: values.followUpDate
          ? dateToString(values.followUpDate)
          : null,
        systolic_blood_pressure: values.systolicBloodPressure,
        diastolic_blood_pressure: values.diastolicBloodPressure,
        heart_rate: values.heartRate,
        blood_sugar: values.bloodSugar,
      };
      let latestPrescription = prescription;
      if (Array.isArray(prescription) && prescription.length > 0) {
        latestPrescription = prescription.reduce((latest, curr) => {
          const latestDate = new Date(latest?.created_at || 0).getTime();
          const currDate = new Date(curr?.created_at || 0).getTime();
          return currDate > latestDate ? curr : latest;
        }, prescription[0]);
      }
      await pharmacyService.updatePrescription(
        latestPrescription.id,
        updateData
      );
      const updateAppointmentData = {
        appointmentId: patientDetail?.appointmentId,
        doctor: patientDetail?.doctorInfo?.id,
        patient: patientDetail?.patientInfo?.id,
        schedule: patientDetail?.schedule?.scheduleId,
        symptoms: patientDetail?.symptoms,
        note: patientDetail?.note,
        number: patientDetail?.number || 1,
        slotStart: patientDetail?.slotStart,
        slotEnd: patientDetail?.slotEnd,
        status: "D",
      };

      await appointmentService.updateAppointmentById(
        appointmentId,
        updateAppointmentData
      );
      message.success(t("success.examinationCompleted"));
      await refreshAll(appointmentId);
    } catch (error) {
      console.error(t("errors.failedToCompleteExamination"), error);
      message.error(t("errors.examinationCompletionFailed"));
    } finally {
      setExaminationComletedLoading(false);
    }
  };
  const handleAddNote = () => {
    if (isCompleted) {
      message.warning(t("errors.cannotEditCompleted"));
      return;
    }
    if (!appointmentId) {
      message.error(t("errors.noAppointmentFound"));
      return;
    }
    if (noteText.trim()) {
      createAppointmentNote(appointmentId, {
        noteType: NoteType.DOCTOR,
        content: noteText.trim(),
      });
      setNoteText("");
    } else {
      message.error(t("errors.emptyNote"));
    }
  };

  const handleDeleteNote = async (appointmentId?: number, noteId?: number) => {
    if (isCompleted) {
      message.warning(t("errors.cannotEditCompleted"));
      return;
    }
    if (!noteId) {
      message.error(t("errors.noNoteId"));
      return;
    }
    try {
      await api.delete(`/appointment-notes/${noteId}/`);
      message.success(t("success.deleteNote"));
      refreshAll(appointmentId);
    } catch (error) {
      console.error("Error deleting note:", error);
      message.error(t("errors.deleteNoteFailed"));
    }
  };
  // Xóa service order
  const handleDeleteServiceOrder = async (
    orderId: number,
    appointmentId: number
  ) => {
    try {
      await deleteServiceOrder(orderId);
      message.success(t("success.deleteServiceOrder"));
      if (appointmentId) {
        await refreshAll(appointmentId);
      }
    } catch (error) {
      message.error(t("errors.deleteServiceOrderFailed"));
    }
  };
  const handleViewPrescriptionHistory = (prescription: Prescription) => {
    if (!prescription) return;

    setSelectedPrescription(prescription);
    setIsPrescriptionHistoryModalOpen(true);
  };

  const handleViewTestResult = useCallback((serviceOrder: ServiceOrder) => {
    if (!serviceOrder) return;

    setSelectedServiceOrder(serviceOrder);
    setIsTestResultDetailModalOpen(true);
  }, []);

  const formatDate = useCallback(
    (dateString?: string) => {
      if (!dateString) return "";
      try {
        return new Date(dateString).toLocaleDateString("vi-VN");
      } catch (e) {
        return t("errors.invalidDateFormat");
      }
    },
    [t]
  );

  const handleClosePrescriptionModal = useCallback(() => {
    setIsPrescriptionModalOpen(false);
    if (appointmentId) {
      refreshSpecific(appointmentId, ["prescription"]);
    }
  }, [appointmentId, refreshSpecific]);
  const formatDateTime = useCallback(
    (dateString?: string) => {
      if (!dateString) return "";
      try {
        return new Date(dateString).toLocaleString("vi-VN");
      } catch (e) {
        return t("errors.invalidDateFormat");
      }
    },
    [t]
  );

  const statusMap = {
    P: "PENDING",
    C: "CONFIRMED",
    D: "COMPLETED",
    X: "CANCELLED",
  };

  const currentAppointment = appointments.find(
    (a) => a.appointmentId === patientDetail?.appointmentId
  );
  const isCompleted = currentAppointment?.status === "D";

  const getAppointmentStatusDisplay = (status?: string) => {
    let mappedStatus = status;
    if (patientDetail?.appointmentId && appointments.length > 0) {
      const contextApt = appointments.find(
        (a) => a.appointmentId === patientDetail.appointmentId
      );
      if (contextApt?.appointmentStatus) {
        mappedStatus = contextApt.appointmentStatus;
      }
    }
    if (mappedStatus && statusMap[mappedStatus]) {
      mappedStatus = statusMap[mappedStatus];
    }
    const { color, bgColor } = getAppointmentStatusColor(mappedStatus || "");
    return (
      <Tag
        color={color}
        style={{
          color,
          backgroundColor: bgColor,
          border: `1px solid ${color}`,
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: 500,
        }}
      >
        {t(`status.${(mappedStatus || "unknown").toLowerCase()}`)}
      </Tag>
    );
  };

  const todayAppointments = appointments.filter((apt) => {
    const today = new Date();
    const aptDate = new Date(apt.schedule?.workDate || "");
    return (
      aptDate.getDate() === today.getDate() &&
      aptDate.getMonth() === today.getMonth() &&
      aptDate.getFullYear() === today.getFullYear()
    );
  });
  const handlePatientChange = (selectedAppointmentId: number) => {
    navigate("/examination/patient/detail", {
      state: { appointmentId: selectedAppointmentId },
    });
  };

  if (loading && !patientDetail) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!patientDetail) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Text type="danger">{t("errors.noPatientInfo")}</Text>
          <div className="mt-4">
            <Button onClick={() => appointmentId && refreshAll(appointmentId)}>
              {t("buttons.retry")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const patientAge = patientDetail.patientInfo?.birthday
    ? new Date().getFullYear() -
      new Date(patientDetail.patientInfo.birthday).getFullYear()
    : "N/A";

  return (
    <div className="flex-1 min-h-screen">
      <main>
        <div className="">
          <div className="mb-6">
            <Row gutter={24} align="middle">
              <Col span={10}>
                <Title level={4}>{t("titles.patientDetails")}</Title>
              </Col>
              <Col span={14} style={{ textAlign: "right" }}>
                <Text strong>{t("labels.status")}:</Text>{" "}
                <Tooltip title={patientDetail.appointmentStatus}>
                  <span style={{ color: "#374151" }}>
                    {getAppointmentStatusDisplay(
                      patientDetail.appointmentStatus
                    )}
                  </span>
                </Tooltip>
              </Col>
            </Row>
          </div>

          <div className="flex flex-row">
            <div className="flex-[400px] pr-6">
              <div className="flex flex-row justify-between items-center mb-6">
                <div className="flex flex-col items-center mb-6">
                  <img
                    src={
                      patientDetail.patientInfo?.avatar ||
                      "https://static-00.iconduck.com/assets.00/avatar-default-symbolic-icon-440x512-ni4kvfm4.png"
                    }
                    alt="Patient"
                    className="w-24 h-24 rounded-full mb-3"
                  />
                  <p className="text-gray-600">
                    {t("labels.patientId")}:{" "}
                    {patientDetail.patientInfo?.id || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    {patientDetail.patientInfo?.gender === "M"
                      ? t("common.gender.male")
                      : t("common.gender.female")}
                    , {t("ui.age")} {patientAge}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-base-700 font-medium mb-4">
                  {t("sidebar.patientInfo")}
                </h3>
                <div className="grid grid-cols-2">
                  <div className="w-[200px] py-2">
                    <div className="mb-1">
                      <span className="text-gray-500 text-sm">
                        {t("personalInfo.address")}
                      </span>
                    </div>
                    <p className="text-black text-sm">
                      {patientDetail.patientInfo?.address ||
                        t("labels.notAvailable")}
                    </p>
                  </div>
                  <div className="py-2 text-right">
                    <div className="mb-1">
                      <span className="text-gray-500 text-sm">
                        {t("personalInfo.identityNumber")}
                      </span>
                    </div>
                    <p className="text-black text-sm">
                      {patientDetail.patientInfo?.identity_number ||
                        t("labels.notAvailable")}
                    </p>
                  </div>
                  <div className="py-2">
                    <div className="mb-1">
                      <span className="text-gray-500 text-sm">
                        {t("personalInfo.birthday")}
                      </span>
                    </div>
                    <p className="text-black text-sm">
                      {formatDate(patientDetail.patientInfo?.birthday)}
                    </p>
                  </div>
                  <div className="py-2 text-right">
                    <div className="mb-1">
                      <span className="text-gray-500 text-sm">
                        {t("patientAdd.form.insuranceNumber")}
                      </span>
                    </div>
                    <p className="text-black text-sm">
                      {patientDetail.patientInfo?.insurance_number ||
                        t("labels.notAvailable")}
                    </p>
                  </div>
                  <div className="py-2">
                    <div className="mb-1">
                      <span className="text-gray-500 text-sm">
                        {t("patientDetail.healthInfo.height")}
                      </span>
                    </div>
                    <p className="text-black text-sm">
                      {patientDetail.patientInfo?.height || t("labels.noData")}
                    </p>
                  </div>
                  <div className="py-2 text-right">
                    <div className="mb-1">
                      <span className="text-gray-500 text-sm">
                        {t("patientDetail.healthInfo.weight")}
                      </span>
                    </div>
                    <p className="text-black text-sm">
                      {patientDetail.patientInfo?.weight ||
                        t("labels.notSpecified")}
                    </p>
                  </div>
                  <div className="py-2">
                    <div className="mb-1">
                      <span className="text-gray-500 text-sm">
                        {t("patientDetail.healthInfo.bloodType")}
                      </span>
                    </div>
                    <p className="text-black text-sm">
                      {patientDetail.patientInfo?.blood_type ||
                        t("labels.notSpecified")}
                    </p>
                  </div>
                  <div className="py-2 text-right">
                    <div className="mb-1">
                      <span className="text-gray-500 text-sm">
                        {t("labels.allergies")}
                      </span>
                    </div>
                    <p className="text-black text-sm">
                      {patientDetail.patientInfo?.allergies ||
                        t("labels.notSpecified")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-[2px] my-4 bg-gray-200"></div>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base-700 font-medium">
                    {t("titles.prescriptionHistory")}
                  </h3>
                  <Button icon={<ReloadOutlined />} onClick={refreshHistory}>
                    {t("buttons.refresh")}
                  </Button>
                </div>
                {prescriptionLoading ? (
                  <div className="text-center py-4">
                    <Spin />
                  </div>
                ) : prescriptionsForCurrentAppointment.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    {t("empty.noPrescriptions")}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptionsForCurrentAppointment.map(
                      (prescriptionItem) => (
                        <div
                          key={prescriptionItem.id}
                          className="bg-white rounded-lg border border-gray-200 p-4"
                        >
                          <div className="flex items-center mb-2">
                            <div className="w-8 h-8 bg-base-100 rounded-full flex items-center justify-center mr-3">
                              <MedicineBoxOutlined
                                style={{ fontSize: 16 }}
                                className="text-blue-600"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {t("labels.prescription")} #
                                {prescriptionItem.id}
                              </p>
                              <p className="text-xs text-gray-500">
                                {t("labels.prescriptionDate")}:{" "}
                                {formatDate(prescriptionItem.created_at)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {t("prescriptionHistory.totalMedicineTypes")}:{" "}
                                {prescriptionItem.prescription_details
                                  ?.length || 0}
                              </p>
                              <p className="text-xs text-gray-500">
                                {t("labels.diagnosis")}:{" "}
                                {prescriptionItem.diagnosis ||
                                  t("labels.noDiagnosis")}
                              </p>
                            </div>
                            <Button
                              type="text"
                              icon={<EyeOutlined />}
                              onClick={() =>
                                handleViewPrescriptionHistory(prescriptionItem)
                              }
                            />
                          </div>
                          {prescriptionItem.is_follow_up && (
                            <p className="text-xs text-blue-500">
                              {t("labels.followUpAppointment")}:{" "}
                              {prescriptionItem.follow_up_date
                                ? formatDate(prescriptionItem.follow_up_date)
                                : t("labels.yes")}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full lg:w-3/4">
              <Form
                form={form}
                layout="vertical"
                onFieldsChange={handleFieldChange}
              >
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item label={t("labels.patientName")} name="name">
                      <Input disabled style={{ color: "black" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={t("labels.clinic")} name="clinic">
                      <Input
                        prefix={<EnvironmentOutlined />}
                        disabled
                        style={{ color: "black" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={t("labels.appointmentTime")}
                      name="appointmentTime"
                    >
                      <Input disabled style={{ color: "black" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={t("labels.appointmentDate")}
                      name="appointmentDate"
                    >
                      <Input disabled style={{ color: "black" }} />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      label={t("labels.systolicBloodPressure")}
                      name="systolicBloodPressure"
                      rules={[
                        { required: true, message: t("validation.required") },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        max={300}
                        className="w-full"
                        disabled={isCompleted}
                        onChange={handleFieldChange}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={7}>
                    <Form.Item
                      label={t("labels.diastolicBloodPressure")}
                      name="diastolicBloodPressure"
                      rules={[
                        { required: true, message: t("validation.required") },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        max={200}
                        className="w-full"
                        disabled={isCompleted}
                        onChange={handleFieldChange}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      label={t("labels.heartRate")}
                      name="heartRate"
                      rules={[
                        { required: true, message: t("validation.required") },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        max={200}
                        className="w-full"
                        disabled={isCompleted}
                        onChange={handleFieldChange}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      label={t("labels.bloodSugar")}
                      name="bloodSugar"
                      rules={[
                        { required: true, message: t("validation.required") },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        max={500}
                        className="w-full"
                        disabled={isCompleted}
                        onChange={handleFieldChange}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label={t("labels.symptoms")} name="symptoms">
                      <Input.TextArea
                        rows={4}
                        disabled={isCompleted}
                        onChange={handleFieldChange}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label={t("labels.note")} name="note">
                      <Input.TextArea
                        rows={4}
                        disabled={isCompleted}
                        onChange={handleFieldChange}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      label={t("labels.diagnosis")}
                      name="diagnosis"
                      rules={[
                        { required: true, message: t("validation.required") },
                      ]}
                    >
                      <Input.TextArea
                        rows={4}
                        disabled={isCompleted}
                        onChange={handleFieldChange}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      label={t("labels.doctorNotes")}
                      name="doctorNotes"
                      rules={[
                        { required: true, message: t("validation.required") },
                      ]}
                    >
                      <Input.TextArea
                        rows={4}
                        disabled={isCompleted}
                        onChange={handleFieldChange}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="isFollowUp" valuePropName="checked">
                      <Checkbox
                        disabled={isCompleted}
                        onChange={handleFieldChange}
                      >
                        {t("labels.followUpCheckbox")}
                      </Checkbox>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      shouldUpdate={(prev, curr) =>
                        prev.isFollowUp !== curr.isFollowUp
                      }
                    >
                      {({ getFieldValue }) => {
                        const isFollowUp = getFieldValue("isFollowUp");
                        return (
                          <Form.Item
                            label={t("labels.followUpDate")}
                            name="followUpDate"
                            rules={
                              isFollowUp
                                ? [
                                    {
                                      required: true,
                                      message: t("errors.requiredFollowUpDate"),
                                    },
                                  ]
                                : []
                            }
                          >
                            <DatePicker
                              style={{ width: "100%" }}
                              format="DD/MM/YYYY"
                              disabled={!isFollowUp || isCompleted}
                              onChange={handleFieldChange}
                            />
                          </Form.Item>
                        );
                      }}
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={24}>
                  <Col span={12}>
                    <Button
                      icon={<PlusOutlined />}
                      loading={pendingTestStatusLoading}
                      onClick={() => setIsMedicalModalOpen(true)}
                      disabled={isCompleted}
                    >
                      {t("buttons.pendingTestResult")}
                    </Button>
                  </Col>
                  <Col span={12} style={{ textAlign: "right" }}>
                    <Button
                      type="primary"
                      loading={examinationComletedLoading}
                      onClick={handleCompleteExamination}
                      disabled={isCompleted}
                    >
                      {t("buttons.completeExamination")}
                    </Button>
                  </Col>
                </Row>
              </Form>
              <div className="mt-6">
                <Tabs defaultActiveKey="1">
                  <TabPane tab={t("tabs.testResults")} key="1">
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-gray-700 font-medium">
                          {t("headers.testResults")}
                        </h3>
                      </div>
                      {serviceOrdersLoading ? (
                        <div className="text-center py-4">
                          <Spin />
                        </div>
                      ) : !serviceOrders || serviceOrders.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          {t("empty.noTestResults")}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {serviceOrders.map((order) => (
                            <div
                              key={order.orderId}
                              className="border border-gray-200 rounded-lg p-4 flex items-center"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {t("labels.serviceName")}:{" "}
                                  {order.service_name ||
                                    t("labels.notSpecified")}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {t("labels.room")}:{" "}
                                  {order.room_id || t("labels.notSpecified")}
                                </p>
                                {order.orderTime && (
                                  <p className="text-sm text-gray-500">
                                    {t("labels.orderTime")}:{" "}
                                    {formatDateTime(order.orderTime)}
                                  </p>
                                )}
                                {order.resultTime && (
                                  <p className="text-sm text-gray-500">
                                    {t("labels.resultTime")}:{" "}
                                    {formatDateTime(order.resultTime)}
                                  </p>
                                )}
                                {order.result === "COMPLETED" && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium">
                                      {t("labels.result")}:
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <Button
                                        size="small"
                                        type="default"
                                        onClick={() =>
                                          window.open(order.result, "_blank")
                                        }
                                      >
                                        {t("buttons.viewPDF")}
                                      </Button>
                                      <Button
                                        size="small"
                                        type="primary"
                                        onClick={() => {
                                          const link =
                                            document.createElement("a");
                                          link.href = order.result!;
                                          link.download = `ket-qua-dinh-${order.orderId}.pdf`;
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }}
                                      >
                                        {t("common.download")}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                <p className="text-sm text-gray-500 mt-1">
                                  {t("labels.status")}:{" "}
                                  {order.order_status === "C"
                                    ? t("status.completed")
                                    : t("status.pending")}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <Button
                                  type="text"
                                  icon={<EyeOutlined />}
                                  onClick={() => handleViewTestResult(order)}
                                />
                                <Popconfirm
                                  title={t("confirm.deleteServiceOrderTitle")}
                                  description={t(
                                    "confirm.deleteServiceOrderDesc"
                                  )}
                                  okText={t("common.delete")}
                                  cancelText={t("common.cancel")}
                                  okButtonProps={{ danger: true }}
                                  onConfirm={() =>
                                    handleDeleteServiceOrder(
                                      order.order_id,
                                      order.appointment_id
                                    )
                                  }
                                >
                                  <Button
                                    size="small"
                                    danger
                                    disabled={isCompleted}
                                    icon={<DeleteOutlined />}
                                  />
                                </Popconfirm>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabPane>
                  <TabPane tab={t("tabs.notes")} key="2">
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-gray-700 font-medium">
                          {t("headers.notes")}
                        </h3>
                      </div>
                      <div className="mb-4">
                        <Input.TextArea
                          rows={4}
                          placeholder={t("placeholders.addNewNote")}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          disabled={isCompleted}
                        />
                        <div className="flex justify-end mt-2">
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAddNote}
                            disabled={isCompleted}
                          >
                            {t("buttons.addNote")}
                          </Button>
                        </div>
                      </div>
                      {notesLoading ? (
                        <div className="text-center py-4">
                          <Spin />
                        </div>
                      ) : !appointmentNotes || appointmentNotes.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          {t("empty.noNotes")}
                        </div>
                      ) : (
                        appointmentNotes.map((note) => (
                          <div
                            key={note.noteId}
                            className="border border-gray-200 rounded-lg p-4 mb-3"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center mb-2">
                                  <MessageOutlined style={{ marginRight: 8 }} />
                                  <span className="font-medium">
                                    {note.note_type === "D"
                                      ? t("labels.doctor")
                                      : t("labels.patient")}
                                  </span>
                                </div>
                                <p className="text-gray-700">
                                  {note.content || ""}
                                </p>
                                {note.created_at && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    {formatDateTime(note.created_at)}
                                  </p>
                                )}
                              </div>
                              <Button
                                type="text"
                                danger
                                icon={<CloseOutlined />}
                                onClick={() =>
                                  handleDeleteNote(note.appointment_id, note.id)
                                }
                                disabled={isCompleted}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabPane>
                  <TabPane tab={t("tabs.prescriptions")} key="3">
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-gray-700 font-medium">
                          {t("headers.prescriptions")}
                        </h3>
                        {!isCompleted &&
                          (!prescription ||
                            prescriptionsForCurrentAppointment.length ===
                              0) && (
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={() => setIsPrescriptionModalOpen(true)}
                            >
                              {t("buttons.addPrescription")}
                            </Button>
                          )}
                      </div>
                      {prescriptionLoading ? (
                        <div className="text-center py-4">
                          <Spin />
                        </div>
                      ) : prescriptionsForCurrentAppointment.length > 0 ? (
                        <div className="space-y-4">
                          {prescriptionsForCurrentAppointment.map(
                            (prescriptionItem) => (
                              <div
                                key={prescriptionItem.id}
                                className="bg-white rounded-lg border border-gray-200 p-4"
                              >
                                <div className="flex items-center mb-2">
                                  <div className="w-8 h-8 bg-base-100 rounded-full flex items-center justify-center mr-3">
                                    <MedicineBoxOutlined
                                      style={{ fontSize: 16 }}
                                      className="text-blue-600"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">
                                      {t("labels.prescription")} #
                                      {prescriptionItem.id}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {t("labels.prescriptionDate")}:{" "}
                                      {formatDate(prescriptionItem.created_at)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {t(
                                        "prescriptionHistory.totalMedicineTypes"
                                      )}
                                      :{" "}
                                      {prescriptionItem.prescription_details
                                        ?.length || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {t("labels.diagnosis")}:{" "}
                                      {prescriptionItem.diagnosis ||
                                        t("labels.noDiagnosis")}
                                    </p>
                                  </div>
                                  <Button
                                    type="text"
                                    icon={<EyeOutlined />}
                                    onClick={() =>
                                      handleViewPrescriptionHistory(
                                        prescriptionItem
                                      )
                                    }
                                  />
                                  {!isCompleted && (
                                    <Button
                                      type="primary"
                                      onClick={() => {
                                        setSelectedPrescription(
                                          prescriptionItem
                                        );
                                        setIsPrescriptionModalOpen(true);
                                      }}
                                    >
                                      {t("buttons.editPrescription")}
                                    </Button>
                                  )}
                                </div>
                                {prescriptionItem.is_follow_up && (
                                  <p className="text-xs text-blue-500">
                                    {t("labels.followUpAppointment")}:{" "}
                                    {prescriptionItem.follow_up_date
                                      ? formatDate(
                                          prescriptionItem.follow_up_date
                                        )
                                      : t("labels.yes")}
                                  </p>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          {t("empty.noPrescriptions")}
                        </div>
                      )}
                    </div>
                  </TabPane>
                </Tabs>
              </div>
              <div className="mt-6">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => appointmentId && refreshAll(appointmentId)}
                >
                  {t("buttons.refreshAll")}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <PrescriptionModal
          isOpen={isPrescriptionModalOpen}
          onClose={handleClosePrescriptionModal}
          appointmentId={appointmentId}
          existingPrescription={selectedPrescription}
          onPrescriptionSaved={handlePrescriptionSaved}
          formParent={form}
        />
        <ServiceOrderModal
          isOpen={isMedicalModalOpen}
          onClose={() => setIsMedicalModalOpen(false)}
          appointmentId={appointmentId}
        />
        <PrescriptionHistoryModal
          isOpen={isPrescriptionHistoryModalOpen}
          onClose={() => {
            setIsPrescriptionHistoryModalOpen(false);
            setSelectedPrescription(null);
          }}
          prescription={selectedPrescription}
          patientInfo={patientDetail?.patientInfo}
        />
        <TestResultDetailModal
          isOpen={isTestResultDetailModalOpen}
          onClose={() => {
            setIsTestResultDetailModalOpen(false);
            setSelectedServiceOrder(null);
          }}
          serviceOrder={selectedServiceOrder}
          appointment={patientDetail}
          examinationRoom={null}
          onUpdate={(updatedOrder) => {
            refreshSpecific(appointmentId, ["serviceOrders"]);
          }}
        />
      </main>
    </div>
  );
};

export default PatientDetail;
