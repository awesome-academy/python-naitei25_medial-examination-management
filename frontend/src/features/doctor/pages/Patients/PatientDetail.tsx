"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
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
    Empty,
    Select,
    Tag,
    Tooltip,
} from "antd"
import {
    PlusOutlined,
    EyeOutlined,
    FileTextOutlined,
    EnvironmentOutlined,
    MessageOutlined,
    ReloadOutlined,
    CloseOutlined,
    MedicineBoxOutlined,
    UserOutlined,
} from "@ant-design/icons"
import { PrescriptionModal } from "../../components/PrecriptionModal"
import { ServiceOrderModal } from "../../components/ServiceOrderModal"
import { PrescriptionHistoryModal } from "../../components/PrescriptionHistoryModal"
import { TestResultDetailModal } from "../../components/TestResultDetailModal"
import { usePatientDetail } from "../../hooks/usePatientDetail"
import { usePrescriptionHistory } from "../../hooks/usePrescriptionHistory"
import { useAppointmentContext } from "../../context/AppointmentContext"
import { NoteType } from "../../types/appointmentNote"
import type { Prescription } from "../../types/prescription"
import type { ServiceOrder } from "../../types/serviceOrder"
import { pharmacyService } from "../../services/pharmacyServices"
import { appointmentService } from "../../services/appointmentService"
import { stringToDate, dateToString } from "../../services/dateHelpServices"
import { useTranslation } from "react-i18next"
import { getAppointmentStatusColor } from "../../services/appointmentService"

const { Title, Text } = Typography
const { TabPane } = Tabs
const { Option } = Select

const PatientDetail: React.FC = () => {
    const { t } = useTranslation()
    const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false)
    const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false)
    const [isPrescriptionHistoryModalOpen, setIsPrescriptionHistoryModalOpen] = useState(false)
    const [isTestResultDetailModalOpen, setIsTestResultDetailModalOpen] = useState(false)
    const [selectedServiceOrder, setSelectedServiceOrder] = useState<ServiceOrder | null>(null)
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
    const [noteText, setNoteText] = useState("")
    const [form] = Form.useForm()
    const location = useLocation()
    const navigate = useNavigate()
    const { appointmentId } = location.state || {}

    const { appointments } = useAppointmentContext()

    const {
        patientDetail,
        prescription,
        serviceOrders,
        appointmentNotes,
        loading,
        serviceOrdersLoading,
        notesLoading,
        saving,
        createAppointmentNote,
        deleteAppointmentNote,
        refreshAll,
        refreshSpecific,
        fetchPrescription,
    } = usePatientDetail(appointmentId)

    const {
        prescriptionHistory,
        loading: historyLoading,
        refreshHistory,
    } = usePrescriptionHistory(patientDetail?.patientInfo?.id)

    const handlePrescriptionSaved = async () => {
        await refreshAll(appointmentId)
    }

    const [examinationComletedLoading, setExaminationComletedLoading] = useState(false)
    const [pendingTestStatusLoading, setPendingTestStatusLoading] = useState(false)

    useEffect(() => {
        if (patientDetail) {
            const appointment = appointments.find((appt) => appt.appointmentId === patientDetail.appointmentId)
            let pres = prescription
            if (Array.isArray(prescription) && prescription.length > 0) {
                pres = prescription.reduce((latest, curr) => {
                    const latestDate = new Date(latest?.created_at || 0).getTime()
                    const currDate = new Date(curr?.created_at || 0).getTime()
                    return currDate > latestDate ? curr : latest
                }, prescription[0])
            }
            const formValues = {
                name: `${patientDetail.patientInfo?.first_name || ""} ${patientDetail.patientInfo?.last_name || ""}` || t("labels.unknownPatient"),
                clinic: patientDetail.schedule?.room || t("labels.unknownClinic"),
                doctor: patientDetail.doctorInfo?.fullName || t("labels.unknownDoctor"),
                doctorCode: patientDetail.doctorInfo?.id || "",
                appointmentTime: `${(patientDetail.slotStart || "").slice(0, 5)} - ${(patientDetail.slotEnd || "").slice(0, 5)}`,
                appointmentDate: patientDetail.schedule?.workDate || t("labels.unknownDate"),
                symptoms: patientDetail?.symptoms || "",
                diagnosis: pres?.diagnosis || "",
                doctorNotes: pres?.note || "",
                isFollowUp: pres?.is_follow_up || false,
                followUpDate: stringToDate(pres?.follow_up_date) || null,
                systolicBloodPressure: pres?.systolic_blood_pressure || undefined,
                diastolicBloodPressure: pres?.diastolic_blood_pressure || undefined,
                heartRate: pres?.heart_rate || undefined,
                bloodSugar: pres?.blood_sugar || undefined,
            }
            form.setFieldsValue(formValues)
        }
    }, [patientDetail, prescription, appointments, form, t])

    const ChangeToPendingTestStatus = async () => {
        if (!appointmentId) {
            message.error(t("errors.noAppointmentFound"))
            return
        }

        setPendingTestStatusLoading(true)

        try {
            const updateAppointmentData = {
                appointmentId: patientDetail?.appointmentId,
                doctorId: patientDetail?.doctorInfo?.doctorId,
                patientId: patientDetail?.patientInfo?.patientId,
                scheduleId: patientDetail?.schedule?.scheduleId,
                symptoms: patientDetail?.symptoms,
                number: patientDetail?.number,
                slotStart: patientDetail?.slotStart,
                slotEnd: patientDetail?.slotEnd,
                appointmentStatus: "PENDING_TEST_RESULT",
            }

            await appointmentService.updateAppointmentById(appointmentId, updateAppointmentData)
            message.success(t("success.pendingTestResult"))
        } catch (error) {
            console.error(t("errors.failedToUpdateStatus"), error)
            message.error(t("errors.statusUpdateFailed"))
        } finally {
            setPendingTestStatusLoading(false)
        }
    }

    const handleCompleteExamination = async () => {
        if (!appointmentId) {
            message.error(t("errors.noAppointmentFound"))
            return
        }

        setExaminationComletedLoading(true)

        try {
            const values = await form.validateFields()

            const requiredVitalSigns = [
                "systolicBloodPressure",
                "diastolicBloodPressure",
                "heartRate",
                "bloodSugar",
                "diagnosis",
                "doctorNotes",
            ]
            const missingVitalSigns = requiredVitalSigns.filter((field) => !values[field])

            if (missingVitalSigns.length > 0) {
                message.error(t("errors.missingRequiredFields"))
                return
            }

            const updateData = {
                diagnosis: values.diagnosis || "",
                note: values.doctorNotes || "",
                is_follow_up: values.isFollowUp || false,
                follow_up_date: values.followUpDate ? dateToString(values.followUpDate) : null,
                systolic_blood_pressure: values.systolicBloodPressure,
                diastolic_blood_pressure: values.diastolicBloodPressure,
                heart_rate: values.heartRate,
                blood_sugar: values.bloodSugar,
            }
            // Find the latest prescription by createdAt
            let latestPrescription = prescription
            if (Array.isArray(prescription) && prescription.length > 0) {
                latestPrescription = prescription.reduce((latest, curr) => {
                    const latestDate = new Date(latest?.created_at || 0).getTime()
                    const currDate = new Date(curr?.created_at || 0).getTime()
                    return currDate > latestDate ? curr : latest
                }, prescription[0])
            }
            await pharmacyService.updatePrescription(latestPrescription.id, updateData)

            const updateAppointmentData = {
                appointmentId: patientDetail?.appointmentId,
                doctor: patientDetail?.doctorInfo?.id,
                patient: patientDetail?.patientInfo?.id,
                schedule: patientDetail?.schedule?.scheduleId,
                symptoms: patientDetail?.symptoms,
                number: patientDetail?.number || 1,
                slotStart: patientDetail?.slotStart,
                slotEnd: patientDetail?.slotEnd,
                status: "D",
            }

            await appointmentService.updateAppointmentById(appointmentId, updateAppointmentData)
            message.success(t("success.examinationCompleted"))
            await refreshAll(appointmentId)
        } catch (error) {
            console.error(t("errors.failedToCompleteExamination"), error)
            message.error(t("errors.examinationCompletionFailed"))
        } finally {
            setExaminationComletedLoading(false)
        }
    }

    const handleAddNote = () => {
        if (!appointmentId) {
            message.error(t("errors.noAppointmentFound"))
            return
        }

        if (noteText.trim()) {
            createAppointmentNote(appointmentId, {
                noteType: NoteType.DOCTOR,
                content: noteText.trim(),
            })
            setNoteText("")
        }
    }

    const handleDeleteNote = (noteId?: number) => {
        if (!noteId) {
            message.error(t("errors.noNoteId"))
            return
        }

        deleteAppointmentNote(noteId)
    }

    const handleViewPrescriptionHistory = (prescription: Prescription) => {
        if (!prescription) return

        setSelectedPrescription(prescription)
        setIsPrescriptionHistoryModalOpen(true)
    }

    const handleViewTestResult = useCallback((serviceOrder: ServiceOrder) => {
        if (!serviceOrder) return

        setSelectedServiceOrder(serviceOrder)
        setIsTestResultDetailModalOpen(true)
    }, [])

    const formatDate = useCallback((dateString?: string) => {
        if (!dateString) return ""
        try {
            return new Date(dateString).toLocaleDateString("vi-VN")
        } catch (e) {
            return t("errors.invalidDateFormat")
        }
    }, [t])

    const handleClosePrescriptionModal = useCallback(() => {
        setIsPrescriptionModalOpen(false)
        if (appointmentId) {
            refreshSpecific(appointmentId, ["prescription"])
        }
    }, [appointmentId, refreshSpecific])

    const formatDateTime = useCallback((dateString?: string) => {
        if (!dateString) return ""
        try {
            return new Date(dateString).toLocaleString("vi-VN")
        } catch (e) {
            return t("errors.invalidDateFormat")
        }
    }, [t])

    // Use mapped status from context if available, else fallback to statusMap
    const statusMap = {
        P: "PENDING",
        C: "CONFIRMED",
        D: "COMPLETED",
        X: "CANCELLED"
    }
    const getAppointmentStatusDisplay = (status?: string) => {
        // Try to get mapped status from context appointment
        let mappedStatus = status
        if (patientDetail?.appointmentId && appointments.length > 0) {
            const contextApt = appointments.find(a => a.appointmentId === patientDetail.appointmentId)
            if (contextApt?.appointmentStatus) {
                mappedStatus = contextApt.appointmentStatus
            }
        }
        // Fallback: map raw backend status if needed
        if (mappedStatus && statusMap[mappedStatus]) {
            mappedStatus = statusMap[mappedStatus]
        }
        const { color, bgColor } = getAppointmentStatusColor(mappedStatus || "")
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
        )
    }

    const todayAppointments = appointments.filter((apt) => {
        const today = new Date()
        const aptDate = new Date(apt.schedule?.workDate || "")
        return (
            aptDate.getDate() === today.getDate() &&
            aptDate.getMonth() === today.getMonth() &&
            aptDate.getFullYear() === today.getFullYear()
        )
    })

    const handlePatientChange = (selectedAppointmentId: number) => {
        navigate("/examination/patient/detail", {
            state: { appointmentId: selectedAppointmentId },
        })
    }

    if (loading && !patientDetail) {
        return (
            <div className="flex-1 min-h-screen bg-gray-50 flex items-center justify-center">
                <Spin size="large" />
            </div>
        )
    }

    if (!patientDetail) {
        return (
            <div className="flex-1 min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Text type="danger">{t("errors.noPatientInfo")}</Text>
                    <div className="mt-4">
                        <Button onClick={() => appointmentId && refreshAll(appointmentId)}>{t("buttons.retry")}</Button>
                    </div>
                </div>
            </div>
        )
    }

    const patientAge = patientDetail.patientInfo?.birthday
        ? new Date().getFullYear() - new Date(patientDetail.patientInfo.birthday).getFullYear()
        : "N/A"

    return (
        <div className="flex-1 min-h-screen bg-gray-50 p-6">
            <main>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="mb-6">
                        <Row gutter={24} align="middle">
                            <Col span={10}>
                                <Title level={4}>{t("titles.patientDetails")}</Title>
                            </Col>
                            <Col span={14} style={{ textAlign: "right" }}>
                                <Text strong>{t("labels.status")}:</Text>{" "}
                                <Tooltip title={patientDetail.appointmentStatus}>
                                    <span style={{ color: "#374151" }}>
                                        {getAppointmentStatusDisplay(patientDetail.appointmentStatus)}
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
                                    <p className="text-gray-600">{t("labels.patientId")}: {patientDetail.patientInfo?.id || "N/A"}</p>
                                    <p className="text-gray-600">
                                        {patientDetail.patientInfo?.gender === "M" ? t("common.gender.male") : t("common.gender.female")}, {t("ui.age")} {patientAge}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-base-700 font-medium mb-4">{t("sidebar.patientInfo")}</h3>
                                <div className="grid grid-cols-2">
                                    <div className="w-[200px] py-2">
                                        <div className="mb-1">
                                            <span className="text-gray-500 text-sm">{t("personalInfo.address")}</span>
                                        </div>
                                        <p className="text-black text-sm">{patientDetail.patientInfo?.address || t("labels.notAvailable")}</p>
                                    </div>
                                    <div className="py-2 text-right">
                                        <div className="mb-1">
                                            <span className="text-gray-500 text-sm">{t("personalInfo.identityNumber")}</span>
                                        </div>
                                        <p className="text-black text-sm">{patientDetail.patientInfo?.identity_number || t("labels.notAvailable")}</p>
                                    </div>
                                    <div className="py-2">
                                        <div className="mb-1">
                                            <span className="text-gray-500 text-sm">{t("personalInfo.birthday")}</span>
                                        </div>
                                        <p className="text-black text-sm">{formatDate(patientDetail.patientInfo?.birthday)}</p>
                                    </div>
                                    <div className="py-2 text-right">
                                        <div className="mb-1">
                                            <span className="text-gray-500 text-sm">{t("patientAdd.form.insuranceNumber")}</span>
                                        </div>
                                        <p className="text-black text-sm">{patientDetail.patientInfo?.insurance_number || t("labels.notAvailable")}</p>
                                    </div>
                                    <div className="py-2">
                                        <div className="mb-1">
                                            <span className="text-gray-500 text-sm">{t("patientDetail.healthInfo.height")}</span>
                                        </div>
                                        <p className="text-black text-sm">{patientDetail.patientInfo?.height || t("labels.noData")}</p>
                                    </div>
                                    <div className="py-2 text-right">
                                        <div className="mb-1">
                                            <span className="text-gray-500 text-sm">{t("patientDetail.healthInfo.weight")}</span>
                                        </div>
                                        <p className="text-black text-sm">{patientDetail.patientInfo?.weight || t("labels.notSpecified")}</p>
                                    </div>
                                    <div className="py-2">
                                        <div className="mb-1">
                                            <span className="text-gray-500 text-sm">{t("patientDetail.healthInfo.bloodType")}</span>
                                        </div>
                                        <p className="text-black text-sm">{patientDetail.patientInfo?.bloodType || t("labels.notSpecified")}</p>
                                    </div>
                                    <div className="py-2 text-right">
                                        <div className="mb-1">
                                            <span className="text-gray-500 text-sm">{t("labels.allergies")}</span>
                                        </div>
                                        <p className="text-black text-sm">{patientDetail.patientInfo?.allergies || t("labels.notSpecified")}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="h-[2px] my-4 bg-gray-200"></div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-base-700 font-medium">{t("titles.prescriptionHistory")}</h3>
                                    <Button icon={<ReloadOutlined />} onClick={refreshHistory}>
                                        {t("buttons.refresh")}
                                    </Button>
                                </div>

                                {historyLoading ? (
                                    <div className="text-center py-4">
                                        <Spin />
                                    </div>
                                ) : !prescriptionHistory || prescriptionHistory.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500">{t("empty.noPrescriptions")}</div>
                                ) : (
                                    <div className="space-y-4">
                                        {prescriptionHistory.map((prescriptionItem) => (
                                            <div
                                                key={prescriptionItem.id}
                                                className="bg-white rounded-lg border border-gray-200 p-4"
                                            >
                                                <div className="flex items-center mb-2">
                                                    <div className="w-8 h-8 bg-base-100 rounded-full flex items-center justify-center mr-3">
                                                        <MedicineBoxOutlined style={{ fontSize: 16 }} className="text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{t("labels.prescription")} #{prescriptionItem.id}</p>
                                                        <p className="text-xs text-gray-500">{t("labels.prescriptionDate")}: {formatDate(prescriptionItem.created_at)}</p>
                                                        <p className="text-xs text-gray-500">{t("prescriptionHistory.totalMedicineTypes")}: {prescriptionItem.prescription_details?.length || 0}</p>
                                                        <p className="text-xs text-gray-500">{t("labels.diagnosis")}: {prescriptionItem.diagnosis || t("labels.noDiagnosis")}</p>
                                                    </div>
                                                    <Button
                                                        type="text"
                                                        icon={<EyeOutlined />}
                                                        onClick={() => handleViewPrescriptionHistory(prescriptionItem)}
                                                    />
                                                </div>
                                                {prescriptionItem.isFollowUp && (
                                                    <p className="text-xs text-blue-500">
                                                        {t("labels.followUpAppointment")}: {prescriptionItem.followUpDate ? formatDate(prescriptionItem.followUpDate) : t("labels.yes")}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="w-full lg:w-3/4">
                            <Form form={form} layout="vertical">
                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item label={t("labels.patientName")} name="name">
                                            <Input disabled style={{ color: "black" }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label={t("labels.clinic")} name="clinic">
                                            <Input prefix={<EnvironmentOutlined />} disabled style={{ color: "black" }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label={t("patientDetail.appointments.table.headers.doctor")} name="doctor">
                                            <Input disabled style={{ color: "black" }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label={t("common.doctorId")} name="doctorCode">
                                            <Input disabled style={{ color: "black" }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label={t("labels.appointmentTime")} name="appointmentTime">
                                            <Input disabled style={{ color: "black" }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label={t("labels.appointmentDate")} name="appointmentDate">
                                            <Input disabled style={{ color: "black" }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            label={t("labels.systolicBloodPressure")}
                                            name="systolicBloodPressure"
                                            rules={[{ required: true, message: t("validation.required") }]}
                                        >
                                            <InputNumber min={0} max={300} className="w-full" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={7}>
                                        <Form.Item
                                            label={t("labels.diastolicBloodPressure")}
                                            name="diastolicBloodPressure"
                                            rules={[{ required: true, message: t("validation.required") }]}
                                        >
                                            <InputNumber min={0} max={200} className="w-full" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={4}>
                                        <Form.Item
                                            label={t("labels.heartRate")}
                                            name="heartRate"
                                            rules={[{ required: true, message: t("validation.required") }]}
                                        >
                                            <InputNumber min={0} max={200} className="w-full" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={4}>
                                        <Form.Item
                                            label={t("labels.bloodSugar")}
                                            name="bloodSugar"
                                            rules={[{ required: true, message: t("validation.required") }]}
                                        >
                                            <InputNumber min={0} max={500} className="w-full" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item label={t("labels.symptoms")} name="symptoms">
                                            <Input.TextArea rows={4} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            label={t("labels.diagnosis")}
                                            name="diagnosis"
                                            rules={[{ required: true, message: t("validation.required") }]}
                                        >
                                            <Input.TextArea rows={4} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            label={t("labels.doctorNotes")}
                                            name="doctorNotes"
                                            rules={[{ required: true, message: t("validation.required") }]}
                                        >
                                            <Input.TextArea rows={4} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="isFollowUp" valuePropName="checked">
                                            <Checkbox>{t("labels.followUpCheckbox")}</Checkbox>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item shouldUpdate={(prev, curr) => prev.isFollowUp !== curr.isFollowUp}>
                                            {({ getFieldValue }) => {
                                                const isFollowUp = getFieldValue("isFollowUp")
                                                return (
                                                    <Form.Item
                                                        label={t("labels.followUpDate")}
                                                        name="followUpDate"
                                                        rules={
                                                            isFollowUp
                                                                ? [{ required: true, message: t("errors.requiredFollowUpDate") }]
                                                                : []
                                                        }
                                                    >
                                                        <DatePicker
                                                            style={{ width: "100%" }}
                                                            format="DD/MM/YYYY"
                                                            disabled={!isFollowUp}
                                                        />
                                                    </Form.Item>
                                                )
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
                                        >
                                            {t("buttons.pendingTestResult")}
                                        </Button>
                                    </Col>
                                    <Col span={12} style={{ textAlign: "right" }}>
                                        <Button
                                            type="primary"
                                            loading={examinationComletedLoading}
                                            onClick={handleCompleteExamination}
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
                                                <h3 className="text-gray-700 font-medium">{t("headers.testResults")}</h3>
                                            </div>
                                            {serviceOrdersLoading ? (
                                                <div className="text-center py-4">
                                                    <Spin />
                                                </div>
                                            ) : !serviceOrders || serviceOrders.length === 0 ? (
                                                <div className="text-center py-4 text-gray-500">{t("empty.noTestResults")}</div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {serviceOrders.map((order) => (
                                                        <div key={order.orderId} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                                            <div>
                                                                <p className="text-sm font-medium">{t("labels.serviceName")}: {order.service_name || t("labels.notSpecified")}</p>
                                                                <p className="text-sm text-gray-500">{t("labels.room")}: {order.room_id || t("labels.notSpecified")}</p>
                                                                {order.orderTime && (
                                                                    <p className="text-sm text-gray-500">{t("labels.orderTime")}: {formatDateTime(order.orderTime)}</p>
                                                                )}
                                                                {order.resultTime && (
                                                                    <p className="text-sm text-gray-500">{t("labels.resultTime")}: {formatDateTime(order.resultTime)}</p>
                                                                )}
                                                                {order.result === "COMPLETED" && (
                                                                    <div className="mt-2">
                                                                        <p className="text-sm font-medium">{t("labels.result")}:</p>
                                                                        <div className="flex items-center space-x-2 mt-1">
                                                                            <Button
                                                                                size="small"
                                                                                type="default"
                                                                                onClick={() => window.open(order.result, "_blank")}
                                                                            >
                                                                                {t("buttons.viewPDF")}
                                                                            </Button>
                                                                            <Button
                                                                                size="small"
                                                                                type="primary"
                                                                                onClick={() => {
                                                                                    const link = document.createElement("a")
                                                                                    link.href = order.result!
                                                                                    link.download = `ket-qua-dinh-${order.orderId}.pdf`
                                                                                    document.body.appendChild(link)
                                                                                    link.click()
                                                                                    document.body.removeChild(link)
                                                                                }}
                                                                            >
                                                                                {t("buttons.download")}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <p className="text-sm text-gray-500 mt-1">
                                                                    {t("labels.status")}: {order.status === "C" ? t("status.completed") : t("status.pending")}
                                                                </p>
                                                            </div>
                                                            <Button
                                                                type="text"
                                                                icon={<EyeOutlined />}
                                                                onClick={() => handleViewTestResult(order)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </TabPane>

                                    <TabPane tab={t("tabs.notes")} key="2">
                                        <div className="mb-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-gray-700 font-medium">{t("headers.notes")}</h3>
                                            </div>
                                            <div className="mb-4">
                                                <Input.TextArea
                                                    rows={4}
                                                    placeholder={t("placeholders.addNewNote")}
                                                    value={noteText}
                                                    onChange={(e) => setNoteText(e.target.value)}
                                                />
                                                <div className="flex justify-end mt-2">
                                                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNote}>
                                                        {t("buttons.addNote")}
                                                    </Button>
                                                </div>
                                            </div>
                                            {notesLoading ? (
                                                <div className="text-center py-4">
                                                    <Spin />
                                                </div>
                                            ) : !appointmentNotes || appointmentNotes.length === 0 ? (
                                                <div className="text-center py-4 text-gray-500">{t("empty.noNotes")}</div>
                                            ) : (
                                                appointmentNotes.map((note) => (
                                                    <div key={note.noteId} className="border border-gray-200 rounded-lg p-4 mb-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="flex items-center mb-2">
                                                                    <MessageOutlined style={{ marginRight: 8 }} />
                                                                    <span className="font-medium">
                                                                        {note.noteType === NoteType.DOCTOR ? note.doctorName || t("labels.doctor") : t("labels.patient")}
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-700">{note.content || ""}</p>
                                                                {note.createdAt && (
                                                                    <p className="text-xs text-gray-500 mt-2">
                                                                        {formatDateTime(note.createdAt)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <Button
                                                                type="text"
                                                                danger
                                                                icon={<CloseOutlined />}
                                                                onClick={() => note.noteId && handleDeleteNote(note.noteId)}
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
                                                <h3 className="text-gray-700 font-medium">{t("headers.prescriptions")}</h3>
                                                <Button
                                                    type="primary"
                                                    icon={<PlusOutlined />}
                                                    onClick={() => setIsPrescriptionModalOpen(true)}
                                                >
                                                    {t("buttons.addPrescription")}
                                                </Button>
                                            </div>
                                            {prescription && Array.isArray(prescription) && prescription.length > 0 ? (
                                                <div className="mt-4 space-y-4">
                                                    {prescription.map((pres) => (
                                                        <div
                                                            key={pres.prescriptionId}
                                                            className="bg-white rounded-lg border border-gray-200 p-4"
                                                        >
                                                            <div className="flex items-center mb-2">
                                                                <div className="w-8 h-8 bg-base-100 rounded-full flex items-center justify-center mr-3">
                                                                    <MedicineBoxOutlined style={{ fontSize: 16 }} className="text-blue-600" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium">{t("labels.prescription")} #{pres.id}</p>
                                                                    <p className="text-xs text-gray-500">{t("labels.prescriptionDate")}: {formatDate(pres.created_at)}</p>
                                                                    <p className="text-xs text-gray-500">{t("labels.diagnosis")}{pres.diagnosis || t("labels.noDiagnosis")}</p>
                                                                </div>
                                                                <Button
                                                                    type="text"
                                                                    icon={<EyeOutlined />}
                                                                    onClick={() => handleViewPrescriptionHistory(pres)}
                                                                />
                                                            </div>
                                                            {pres.isFollowUp && (
                                                                <p className="text-xs text-blue-500">
                                                                    {t("labels.followUpAppointment")}: {pres.followUpDate ? formatDate(pres.followUpDate) : t("labels.yes")}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-gray-500">{t("empty.noPrescriptions")}</div>
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
                    existingPrescription={Array.isArray(prescription) && prescription.length > 0 ? prescription[0] : prescription}
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
                        setIsPrescriptionHistoryModalOpen(false)
                        setSelectedPrescription(null)
                    }}
                    prescription={selectedPrescription}
                    patientInfo={patientDetail?.patientInfo}
                />
                <TestResultDetailModal
                    isOpen={isTestResultDetailModalOpen}
                    onClose={() => {
                        setIsTestResultDetailModalOpen(false)
                        setSelectedServiceOrder(null)
                    }}
                    serviceOrder={selectedServiceOrder}
                    appointment={patientDetail}
                    examinationRoom={null}
                    onUpdate={(updatedOrder) => {
                        refreshSpecific(appointmentId, ["serviceOrders"])
                    }}
                />
            </main>
        </div>
    )
}

export default PatientDetail