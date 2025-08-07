"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Modal, Form, Input, Button, Typography, message, Row, Col, Card } from "antd"
import { SaveOutlined, ReloadOutlined, ExperimentOutlined, CalendarOutlined, EnvironmentOutlined } from "@ant-design/icons"
import type { ServiceOrder } from "../types/serviceOrder"
import type { ExaminationRoom } from "../types/examinationRoom"
import { updateServiceOrder } from "../services/serviceOrderService"

const { Title, Text } = Typography
const { TextArea } = Input

interface TestResultDetailModalProps {
  isOpen: boolean
  onClose: () => void
  serviceOrder: ServiceOrder | null
  appointment?: any
  examinationRoom?: ExaminationRoom | null
  onUpdate?: (updatedOrder: ServiceOrder) => void
}

export const TestResultDetailModal: React.FC<TestResultDetailModalProps> = ({
  isOpen,
  onClose,
  serviceOrder,
  appointment,
  examinationRoom,
  onUpdate,
}) => {
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && serviceOrder) {
      form.setFieldsValue({
        result: serviceOrder.result || "",
        orderStatus: serviceOrder.orderStatus,
      })
    }
  }, [isOpen, serviceOrder, form])

  const handleSave = async () => {
    if (!serviceOrder) {
      message.error("Không tìm thấy thông tin đơn xét nghiệm")
      return
    }

    try {
      const values = await form.validateFields()
      setSaving(true)

      const updateData: Partial<ServiceOrder> = {
        ...serviceOrder,
        orderStatus: values.orderStatus || serviceOrder.orderStatus,
        result: values.result || "",
        resultTime: values.orderStatus === "COMPLETED" ? new Date().toISOString() : serviceOrder.resultTime,
      }

      const updatedOrder = await updateServiceOrder(
        serviceOrder.service.serviceId,
        serviceOrder.orderId,
        updateData as ServiceOrder,
      )

      if (onUpdate) {
        onUpdate(updatedOrder)
      }

      message.success("Cập nhật kết quả xét nghiệm thành công")
      onClose()
    } catch (error) {
      console.error("Error updating service order:", error)
      message.error("Có lỗi xảy ra khi cập nhật kết quả")
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ORDERED":
        return "#d97706"
      case "COMPLETED":
        return "#059669"
      default:
        return "#6b7280"
    }
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Chưa có"
    try {
      return new Date(dateString).toLocaleString("vi-VN")
    } catch (e) {
      return "Định dạng không hợp lệ"
    }
  }

  const getRoomDisplayName = useMemo(() => {
    if (!examinationRoom) return `Phòng ${serviceOrder?.roomId}`
    return `${examinationRoom.note} - Tòa ${examinationRoom.building} - Tầng ${examinationRoom.floor}`
  }, [examinationRoom, serviceOrder?.roomId])

  if (!serviceOrder) {
    return null
  }

  return (
    <Modal
      title={
        <div className="flex items-center">
          <ExperimentOutlined style={{ marginRight: 8 }} />
          <span>Chi tiết kết quả thực hiện chỉ định</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
    >
      <div className="p-4">
        <Card title={<div style={{ color: "#036672" }}>Thông tin chung</div>}>
          <Row gutter={24}>
            <Col span={12}>
              <div>
                <Text type="secondary">Tên bệnh nhân:</Text>
                <div className="font-medium">{appointment?.patientInfo?.fullName || "Đang tải..."}</div>
              </div>
              <div>
                <Text type="secondary">Mã bệnh nhân:</Text>
                <div className="font-medium">{appointment?.patientInfo?.patientId || "Đang tải..."}</div>
              </div>
              {appointment?.patientInfo?.allergies && (
                <div className="text-sm">
                  <Text type="secondary">Dị ứng:</Text>
                  <div className="font-medium">{appointment.patientInfo.allergies}</div>
                </div>
              )}
            </Col>
            <Col span={12}>
              <div>
                <Text type="secondary">Dịch vụ:</Text>
                <div className="font-medium">{serviceOrder.service.serviceName}</div>
              </div>
              <div>
                <Text type="secondary">Phòng:</Text>
                <div className="font-medium">{getRoomDisplayName}</div>
              </div>
              <div>
                <Text type="secondary">Thời gian đặt:</Text>
                <div className="font-medium">{formatDateTime(serviceOrder.orderTime)}</div>
              </div>
            </Col>
          </Row>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary">Trạng thái hiện tại:</Text>
                <span
                  className="ml-2 px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    color: getStatusColor(serviceOrder.orderStatus),
                    backgroundColor: `${getStatusColor(serviceOrder.orderStatus)}20`,
                  }}
                >
                  {serviceOrder.orderStatus === "ORDERED" ? "Đang chờ" : "Đã hoàn thành"}
                </span>
              </div>
              <div className="text-right">
                <Text type="secondary">Giá dịch vụ:</Text>
                <div className="font-bold text-lg text-blue-600">{serviceOrder.price.toLocaleString("vi-VN")} VNĐ</div>
              </div>
            </div>
          </div>
        </Card>

        <Card title={<div style={{ color: "#036672" }}>Kết quả</div>} className="mt-4">
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item
              name="result"
              rules={[
                {
                  required: serviceOrder.orderStatus === "COMPLETED",
                  message: "Vui lòng nhập kết quả xét nghiệm!",
                },
              ]}
            >
              <TextArea
                rows={8}
                placeholder="Nhập kết quả xét nghiệm chi tiết..."
                disabled={serviceOrder.orderStatus === "COMPLETED"}
              />
            </Form.Item>

            {serviceOrder.orderStatus === "ORDERED" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <Text type="warning">
                  <strong>Lưu ý:</strong> Xét nghiệm này đang trong trạng thái chờ kết quả. Bạn có thể cập nhật kết quả
                  khi đã có thông tin từ phòng xét nghiệm.
                </Text>
              </div>
            )}

            {serviceOrder.orderStatus === "COMPLETED" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <Text type="success">
                  <strong>Hoàn thành:</strong> Kết quả xét nghiệm đã được cập nhật vào lúc{" "}
                  {formatDateTime(serviceOrder.resultTime)}
                </Text>
              </div>
            )}

            <Form.Item name="orderStatus" label="Trạng thái" rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}>
              <Select disabled={serviceOrder.orderStatus === "COMPLETED"}>
                <Select.Option value="ORDERED">Đang chờ</Select.Option>
                <Select.Option value="COMPLETED">Hoàn thành</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Card>

        <div className="flex justify-end space-x-3 mt-4">
          <Button onClick={onClose}>Đóng</Button>
          {serviceOrder.orderStatus === "ORDERED" && (
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
              Cập nhật kết quả
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
            Làm mới
          </Button>
        </div>
      </div>
    </Modal>
  )
}
