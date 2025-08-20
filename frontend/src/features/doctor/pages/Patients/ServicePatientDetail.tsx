"use client"

import type React from "react"
import { examinationRoomService } from "../../services/examinationRoomServices"
import { patientService } from "../../services/patientServices"
import { useState, useEffect } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import {
    Row,
    Col,
    Form,
    Input,
    Button,
    Typography,
    Spin,
    message,
    Select,
    DatePicker,
    Space,
    Popconfirm,
    Upload,
    Tabs,
    Tag,
} from "antd"
import {
    SaveOutlined,
    ArrowLeftOutlined,
    DeleteOutlined,
    ReloadOutlined,
    UploadOutlined,
    UserOutlined,
    MessageOutlined,
    CloseOutlined,
    PlusOutlined,
} from "@ant-design/icons"
import type { ServiceOrder } from "../../types/serviceOrder"
import { getServiceOrderById, updateServiceOrder, deleteServiceOrder } from "../../services/serviceOrderService"
import type { Appointment } from "../../types/appointment"
import dayjs from "dayjs"
import { api } from "../../../../shared/services/api"

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs

interface AppointmentNote {
    noteId: number
    content: string
    createdAt: string
    noteType: string
    doctorName?: string
}

const PatientDetail: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [form] = Form.useForm()
    const location = useLocation()
    const navigate = useNavigate()
    const { orderId: orderIdParam } = useParams<{ orderId: string }>()
    const [appointment, setAppointment] = useState<Appointment | null>(null)
    const [currentServiceOrder, setCurrentServiceOrder] = useState<ServiceOrder | null>(null)
    const [roomNote, setRoomNote] = useState<string>("")
    // Thêm state để lưu thông tin bệnh nhân
    const [patientDetail, setPatientDetail] = useState<any>(null)
    // Lấy thông tin bệnh nhân khi currentServiceOrder có appointmentId

    useEffect(() => {
        const fetchRoomNote = async () => {
            if (currentServiceOrder?.roomId && !roomNote) {
                try {
                    const room = await examinationRoomService.getExaminationRoomById(currentServiceOrder.roomId)
                    setRoomNote(room.room_note || room.note || "")
                } catch (e) {
                    setRoomNote("")
                }
            }
        }
        fetchRoomNote()
    }, [currentServiceOrder, roomNote])

    // Only get orderId from URL param
    const orderId = orderIdParam

    const [appointmentNotes, setAppointmentNotes] = useState<AppointmentNote[]>([])
    const [noteText, setNoteText] = useState("")
    const [notesLoading, setNotesLoading] = useState(false)

    useEffect(() => {
        if (orderId) {
            fetchServiceOrder()
        }
    }, [form, orderId])

    const fetchServiceOrder = async () => {
        if (!orderId) {
            message.error("Không tìm thấy thông tin đơn xét nghiệm")
            return
        }

        setLoading(true)
        try {
            const raw = await getServiceOrderById(orderId)
            // Map backend fields to camelCase
            const freshServiceOrder = {
                orderId: raw.order_id,
                appointmentId: raw.appointment_id,
                roomId: raw.room_id,
                serviceId: raw.service_id,
                serviceName: raw.service_name,
                price: raw.price,
                orderStatus: raw.order_status,
                result: raw.result,
                number: raw.number,
                orderTime: raw.order_time,
                resultTime: raw.result_time,
                createdAt: raw.created_at,
                resultFileUrl: raw.result_file_url,
                resultFilePublicId: raw.result_file_public_id,
            }
            setCurrentServiceOrder(freshServiceOrder)
            // Lấy thông tin bệnh nhân ngay sau khi lấy freshServiceOrder
            if (freshServiceOrder.appointmentId) {
                try {
                    const detail = await patientService.getPatientDetail(freshServiceOrder.appointmentId)
                    setPatientDetail(detail)
                } catch (error) {
                    setPatientDetail(null)
                }
            } else {
                setPatientDetail(null)
            }
            // Set display name for file: orderId_serviceName.pdf
            const displayFileName = `${freshServiceOrder.orderId}_${freshServiceOrder.serviceName || "result"}.pdf`
            form.setFieldsValue({
                serviceName: freshServiceOrder?.serviceName || "",
                orderStatus: freshServiceOrder?.orderStatus,
                result: freshServiceOrder?.result
                    ? [
                        {
                            uid: "existing_result",
                            name: displayFileName,
                            status: "C",
                            url: freshServiceOrder.result,
                        },
                    ]
                    : [],
                orderTime: freshServiceOrder?.orderTime ? dayjs(freshServiceOrder.orderTime) : null,
                resultTime: freshServiceOrder?.resultTime ? dayjs(freshServiceOrder.resultTime) : null,
            })
        } catch (error) {
            console.error("Error fetching service order:", error)
            message.error("Không thể tải thông tin đơn xét nghiệm")
        } finally {
            setLoading(false)
        }
    }

        useEffect(() => {
        const fetchPatientDetail = async () => {
            if (currentServiceOrder?.appointment_id) {
                try {
                    // Gọi service để lấy thông tin bệnh nhân
                    const detail = await patientService.getPatientDetail(currentServiceOrder.appointmentId)
                    setPatientDetail(detail)
                } catch (error) {
                    setPatientDetail(null)
                }
            } else {
                setPatientDetail(null)
            }
        }
        fetchPatientDetail()
    }, [currentServiceOrder])

    const fetchNotes = async () => {
        if (!currentServiceOrder?.appointmentId) {
            return
        }

        setNotesLoading(true)
        try {
            const response = await api.get(`/appointment-notes/appointment/${currentServiceOrder.appointmentId}/notes/`)
            setAppointmentNotes(response.data || [])
        } catch (error) {
            console.error("Error fetching notes:", error)
            message.error("Không thể tải ghi chú")
        } finally {
            setNotesLoading(false)
        }
    }

    useEffect(() => {
        if (currentServiceOrder) {
            fetchNotes()
        }
    }, [currentServiceOrder])

    const handleSave = async () => {
        try {
            const values = await form.validateFields()

            if (!currentServiceOrder) {
                message.error("Không tìm thấy thông tin đơn xét nghiệm")
                return
            }

            setSaving(true)

            let finalResultUrl = currentServiceOrder.result || ""

            const fileList = values.result
            const isNewFileUpload = fileList.length > 0 && fileList[0].originFileObj
            const isExistingFileRemoved = currentServiceOrder.result && fileList.length === 0

            if (isNewFileUpload) {
                const file = fileList[0].originFileObj
                const formData = new FormData()
                formData.append("file", file)

                try {
                    message.loading("Đang tải lên tệp PDF...", 0)
                    const response = await api.post(
                        `/service-orders/${currentServiceOrder.orderId}/result/`, // ensure trailing slash
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        },
                    )
                    // Backend returns { message, data: { ..serializer fields.. } }
                    const uploadedData = (response.data as any)?.data
                    finalResultUrl = uploadedData?.result || uploadedData?.file || finalResultUrl
                    message.destroy()
                    message.success("Tải lên tệp PDF thành công!")
                } catch (uploadError: any) {
                    message.destroy()
                    console.error("Lỗi khi tải lên tệp PDF:", uploadError)
                    let errorMessage = "Lỗi không xác định"
                    if (uploadError.response?.data?.message) {
                        errorMessage = uploadError.response.data.message
                    } else if (uploadError.message) {
                        errorMessage = uploadError.message
                    }
                    message.error(`Tải lên tệp PDF thất bại: ${errorMessage}`)
                    setSaving(false)
                    return
                }
            } else if (isExistingFileRemoved) {
                finalResultUrl = ""
            }

            const localDateTime = dayjs().format("YYYY-MM-DDTHH:mm:ss")

            const updateData: Partial<ServiceOrder> = {
                ...currentServiceOrder,
                orderStatus: form.getFieldValue("orderStatus"),
                result: finalResultUrl,
                resultTime: form.getFieldValue("orderStatus") === "C" && !currentServiceOrder.resultTime ? localDateTime : currentServiceOrder.resultTime,
            }

            const updatedOrder = await updateServiceOrder(currentServiceOrder.serviceId, orderId, updateData as ServiceOrder)

            message.success("Cập nhật kết quả xét nghiệm thành công")
            setCurrentServiceOrder(updatedOrder)
            handleRefreshAll()
        } catch (error) {
            console.error("Lỗi khi cập nhật đơn xét nghiệm:", error)
            message.error("Có lỗi xảy ra khi cập nhật kết quả")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!currentServiceOrder) {
            message.error("Không tìm thấy thông tin đơn xét nghiệm")
            return
        }

        setDeleting(true)
        try {
            await deleteServiceOrder(currentServiceOrder.serviceId, orderId)
            message.success("Xóa đơn xét nghiệm thành công")
            navigate(-1)
        } catch (error) {
            console.error("Error deleting service order:", error)
            message.error("Có lỗi xảy ra khi xóa đơn xét nghiệm")
        } finally {
            setDeleting(false)
        }
    }

    const handleBack = () => {
        navigate(-1)
    }

    const getStatusBadge = (status: string) => {
        let color = "#6b7280"
        let bgColor = "#f3f4f6"
        let text = "Không xác định"

        switch (status) {
            case "O":
                color = "#d97706"
                bgColor = "#fef3c7"
                text = "Đang chờ"
                break
            case "C":
                color = "#059669"
                bgColor = "#d1fae5"
                text = "Đã hoàn thành"
                break
        }

        return (
            <Tag
                style={{
                    color,
                    backgroundColor: bgColor,
                    border: `1px solid ${color}`,
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 500,
                }}
            >
                {text}
            </Tag>
        )
    }

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return "Chưa có"
        try {
            return new Date(dateString).toLocaleString("vi-VN")
        } catch (e) {
            return "Định dạng không hợp lệ"
        }
    }

    const handleAddNote = async () => {
        if (!noteText.trim() || !currentServiceOrder?.appointmentId) {
            return
        }

        try {
            const response = await api.post(`/appointments/${currentServiceOrder.appointmentId}/notes`, {
                content: noteText,
                noteType: "DOCTOR",
            })
            setAppointmentNotes([...appointmentNotes, response.data])
            setNoteText("")
            message.success("Thêm ghi chú thành công")
        } catch (error) {
            console.error("Error adding note:", error)
            message.error("Thêm ghi chú thất bại")
        }
    }

    const handleDeleteNote = async (noteId: number) => {
        if (!currentServiceOrder?.appointmentId) {
            return
        }

        try {
            await api.delete(`/appointments/${currentServiceOrder.appointmentId}/notes/${noteId}`)
            setAppointmentNotes(appointmentNotes.filter((note) => note.noteId !== noteId))
            message.success("Xóa ghi chú thành công")
        } catch (error) {
            console.error("Error deleting note:", error)
            message.error("Xóa ghi chú thất bại")
        }
    }

    const handleRefreshAll = () => {
        fetchServiceOrder()
        fetchNotes()
    }

    const handleDownloadFile = (url: string, fileName: string) => {
        const link = document.createElement("a")
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    if (loading && !currentServiceOrder) {
        return (
            <div className="flex-1 min-h-screen bg-gray-50 flex items-center justify-center">
                <Spin size="large" />
            </div>
        )
    }

    if (!currentServiceOrder) {
        return (
            <div className="flex-1 min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Text type="danger">Không tìm thấy thông tin đơn xét nghiệm</Text>
                    <div className="mt-4">
                        <Button onClick={fetchServiceOrder}>Thử lại</Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 min-h-screen bg-gray-50 p-6">
            <main>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="mb-6">
                        <Row gutter={24} align="middle">
                            <Col span={12}>
                                <Title level={4}>Chi tiết đơn xét nghiệm #{currentServiceOrder.orderId}</Title>
                            </Col>
                            <Col span={12} style={{ textAlign: "right" }}>
                                <Text strong>Trạng thái:</Text>{" "}
                                {getStatusBadge(currentServiceOrder.orderStatus)}
                            </Col>
                        </Row>
                    </div>

                    <div className="flex justify-end mb-4">
                        <Space>
                            <Button icon={<ReloadOutlined />} onClick={handleRefreshAll} loading={loading}>
                                Làm mới
                            </Button>
                            <Popconfirm
                                title="Xóa đơn xét nghiệm"
                                description="Bạn có chắc chắn muốn xóa đơn xét nghiệm này?"
                                onConfirm={handleDelete}
                                okText="Xóa"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                            >
                                <Button danger icon={<DeleteOutlined />} loading={deleting}>
                                    Xóa đơn
                                </Button>
                            </Popconfirm>
                        </Space>
                    </div>

                    <Form form={form} layout="vertical" onFinish={handleSave}>
                        <Row gutter={24}>
                            <Col span={12}>
                                <Form.Item label="Tên xét nghiệm" name="serviceName">
                                    <Input disabled style={{ color: "black" }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Nơi thực hiện">
                                    <Input
                                        value={
                                            roomNote
                                                || `Phòng ${currentServiceOrder.roomId}`
                                        }
                                        disabled
                                        style={{ color: "black" }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Thời gian đặt" name="orderTime">
                                    <DatePicker
                                        showTime
                                        disabled
                                        style={{ width: "100%" }}
                                        format="HH:mm DD/MM/YYYY"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Thời gian trả kết quả"
                                    name="resultTime"
                                    initialValue={dayjs().add(1, "hour")}
                                >
                                    <DatePicker
                                        placeholder="Chưa có kết quả"
                                        showTime
                                        style={{ width: "100%" }}
                                        format="HH:mm DD/MM/YYYY"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Trạng thái"
                                    name="orderStatus"
                                    rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
                                >
                                    <Select style={{ width: "180px" }}>
                                        <Option value="O">Đang chờ</Option>
                                        <Option value="C">Đã hoàn thành</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                {currentServiceOrder?.result && (
                                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <span className="text-blue-600 mr-2">📄</span>
                                                <Text strong className="text-blue-800">
                                                    File kết quả hiện tại: {`${currentServiceOrder.orderId || ""}_${currentServiceOrder.serviceName || "result"}.pdf`}
                                                </Text>
                                            </div>
                                            <Space>
                                                <Button
                                                    size="small"
                                                    type="link"
                                                    onClick={() => window.open(currentServiceOrder.result, "_blank")}
                                                >
                                                    Xem
                                                </Button>
                                                <Button
                                                    size="small"
                                                    type="link"
                                                    onClick={() =>
                                                        handleDownloadFile(
                                                            currentServiceOrder.result!,
                                                            `${currentServiceOrder.orderId}_${currentServiceOrder.serviceName || "result"}.pdf`
                                                        )
                                                    }
                                                >
                                                    Tải xuống
                                                </Button>
                                            </Space>
                                        </div>
                                    </div>
                                )}

                                <Form.Item
                                    label="Kết quả xét nghiệm"
                                    name="result"
                                    valuePropName="fileList"
                                    getValueFromEvent={(e) => {
                                        if (Array.isArray(e)) return e
                                        return e?.fileList || []
                                    }}
                                    rules={[
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                const orderStatus = getFieldValue("orderStatus")
                                                const hasFile = Array.isArray(value) && value.length > 0

                                                if (orderStatus === "C" && !hasFile) { // backend COMPLETED uses 'C'
                                                    return Promise.reject(new Error("Vui lòng tải lên kết quả PDF khi đánh dấu hoàn thành!"))
                                                }
                                                return Promise.resolve()
                                            },
                                        }),
                                    ]}
                                >
                                    <Upload
                                        // Prevent AntD from auto-posting to current page (causing 404)
                                        beforeUpload={(file) => {
                                            const isPdf = file.type === "application/pdf"
                                            if (!isPdf) {
                                                message.error("Chỉ được phép tải lên tệp PDF!")
                                            }
                                            return false // block auto upload; we'll upload manually in handleSave
                                        }}
                                        customRequest={({ onSuccess }) => {
                                            // Immediately mark as success so it appears in list
                                            setTimeout(() => onSuccess && onSuccess("ok"), 0)
                                        }}
                                        maxCount={1}
                                        accept=".pdf"
                                        listType="text"
                                        onPreview={(file) => {
                                            if (file.url) {
                                                window.open(file.url, "_blank")
                                            }
                                        }}
                                        onDownload={(file) => {
                                            if (file.url) {
                                                handleDownloadFile(file.url, file.name || "result.pdf")
                                            }
                                        }}
                                        onRemove={() => {
                                            form.setFieldsValue({ result: [] })
                                            return true
                                        }}
                                        showUploadList={{
                                            showPreviewIcon: true,
                                            showDownloadIcon: true,
                                            showRemoveIcon: true,
                                        }}
                                    >
                                        <Button icon={<UploadOutlined />}>
                                            {form.getFieldValue("result")?.length > 0 ? "Thay đổi file PDF" : "Tải lên file PDF"}
                                        </Button>
                                    </Upload>
                                </Form.Item>
                            </Col>
                        </Row>
                        <div className="flex justify-end space-x-4">
                            <Button onClick={handleBack}>Hủy</Button>
                            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                                Lưu kết quả
                            </Button>
                        </div>
                    </Form>

                    <div className="mt-6">
                        <Tabs defaultActiveKey="1">
                            <TabPane tab="Thông tin bệnh nhân" key="1">
                                {patientDetail?.patientInfo ? (
                                    <div className="p-6 bg-white rounded-2xl border border-gray-200">
                                        <div className="flex flex-row justify-between items-center mb-6">
                                            <div className="flex flex-col items-center mb-6">
                                                <img
                                                    src={
                                                        patientDetail.patientInfo.avatar ||
                                                        "https://png.pngtree.com/png-clipart/20210608/ourlarge/pngtree-dark-gray-simple-avatar-png-image_3418404.jpg"
                                                    }
                                                    alt="Patient"
                                                    className="w-24 h-24 rounded-full mb-3"
                                                />
                                                <p className="text-black font-semibold text-xl">{patientDetail.patientInfo.first_name} {patientDetail.patientInfo.last_name}</p>
                                                <p className="text-gray-600">Mã bệnh nhân: {patientDetail.patientInfo.id}</p>
                                                <p className="text-gray-600">
                                                    {patientDetail.patientInfo.gender === "M"
                                                        ? "Nam"
                                                        : patientDetail.patientInfo.gender === "F"
                                                            ? "Nữ"
                                                            : "N/A"}
                                                    ,{" "}
                                                    {patientDetail.patientInfo.birthday
                                                        ? new Date().getFullYear() - new Date(patientDetail.patientInfo.birthday).getFullYear()
                                                        : "N/A"}{" "}
                                                    tuổi
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-base-700 font-medium">Thông tin cá nhân</h3>
                                            </div>

                                            <div className="grid grid-cols-2">
                                                <div className="w-[200px] py-2">
                                                    <div className="mb-1">
                                                        <span className="text-gray-500 text-sm">Địa chỉ</span>
                                                    </div>
                                                    <p className="text-black text-sm">{patientDetail.patientInfo.address || "Không có"}</p>
                                                </div>

                                                <div className="py-2 text-right">
                                                    <div className="mb-1">
                                                        <span className="text-gray-500 text-sm w-full text-right">CMND/CCCD</span>
                                                    </div>
                                                    <p className="text-black text-sm">{patientDetail.patientInfo.identity_number || "Không có"}</p>
                                                </div>

                                                <div className="py-2">
                                                    <div className="mb-1">
                                                        <span className="text-gray-500 text-sm">Ngày sinh</span>
                                                    </div>
                                                    <p className="text-black text-sm">
                                                        {patientDetail.patientInfo.birthday
                                                            ? new Date(patientDetail.patientInfo.birthday).toLocaleDateString("vi-VN")
                                                            : "N/A"}
                                                    </p>
                                                </div>

                                                <div className="py-2 text-right">
                                                    <div className="mb-1">
                                                        <span className="text-gray-500 text-sm w-full text-right">Số BHYT</span>
                                                    </div>
                                                    <p className="text-black text-sm">{patientDetail.patientInfo.insurance_number || "Không có"}</p>
                                                </div>

                                                <div className="py-2">
                                                    <div className="mb-1">
                                                        <span className="text-gray-500 text-sm">Chiều cao (cm)</span>
                                                    </div>
                                                    <p className="text-black text-sm">{patientDetail.patientInfo.height || "Chưa có dữ liệu"}</p>
                                                </div>

                                                <div className="py-2 text-right">
                                                    <div className="mb-1">
                                                        <span className="text-gray-500 text-sm w-full text-right">Cân nặng (kg)</span>
                                                    </div>
                                                    <p className="text-black text-sm">{patientDetail.patientInfo.weight || "Không xác định"}</p>
                                                </div>

                                                <div className="py-2">
                                                    <div className="mb-1">
                                                        <span className="text-gray-500 text-sm">Nhóm máu</span>
                                                    </div>
                                                    <p className="text-black text-sm">{patientDetail.patientInfo.blood_type || "Không xác định"}</p>
                                                </div>

                                                <div className="py-2 text-right">
                                                    <div className="mb-1">
                                                        <span className="text-gray-500 text-sm w-full text-right">Dị ứng</span>
                                                    </div>
                                                    <p className="text-black text-sm">{patientDetail.patientInfo.allergies || "Không xác định"}</p>
                                                </div>

                                                <div className="py-2">
                                                    <div className="mb-1">
                                                        <span className="text-gray-500 text-sm">Số điện thoại</span>
                                                    </div>
                                                    <p className="text-black text-sm">{patientDetail.patientInfo.phone || "Chưa có"}</p>
                                                </div>

                                                <div className="py-2 text-right">
                                                    <div className="mb-1">
                                                        <span className="text-gray-500 text-sm w-full text-right">Email</span>
                                                    </div>
                                                    <p className="text-black text-sm">{patientDetail.patientInfo.email || "Chưa có"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-gray-500">
                                        Không có thông tin bệnh nhân
                                    </div>
                                )}
                            </TabPane>
                            <TabPane tab="Ghi chú" key="2">
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-gray-700 font-medium">Ghi chú</h3>
                                        <Button icon={<ReloadOutlined />} onClick={fetchNotes}>
                                            Làm mới
                                        </Button>
                                    </div>

                                    <div className="mb-4">
                                        <Input.TextArea
                                            rows={4}
                                            placeholder="Nhập ghi chú mới..."
                                            value={noteText}
                                            onChange={(e) => setNoteText(e.target.value)}
                                        />
                                        <div className="flex justify-end mt-2">
                                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNote}>
                                                Thêm ghi chú
                                            </Button>
                                        </div>
                                    </div>

                                    {notesLoading ? (
                                        <div className="text-center py-4">
                                            <Spin />
                                        </div>
                                    ) : appointmentNotes.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500">Không có ghi chú nào</div>
                                    ) : (
                                        appointmentNotes.map((note) => (
                                            <div key={note.noteId} className="border border-gray-200 rounded-lg p-4 mb-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center mb-2">
                                                            <MessageOutlined style={{ marginRight: 8 }} />
                                                            <span className="font-medium">
                                                                {note.noteType === "DOCTOR" ? note.doctorName || "Bác sĩ" : "Bệnh nhân"}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-700">{note.content}</p>
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            {formatDateTime(note.createdAt)}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={<CloseOutlined />}
                                                        onClick={() => handleDeleteNote(note.noteId)}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabPane>
                        </Tabs>
                    </div>

                    <div className="mt-6">
                        <Button icon={<ReloadOutlined />} onClick={handleRefreshAll}>
                            Làm mới tất cả
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default PatientDetail