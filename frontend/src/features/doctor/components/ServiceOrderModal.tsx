"use client"


import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Modal, Input, Select, Button, Table, Typography, message, Spin } from "antd"
import { SearchOutlined, DeleteOutlined } from "@ant-design/icons"
import type { Services } from "../types/services"
import type { ServiceOrder } from "../types/serviceOrder"
import { examinationRoomService } from "../services/examinationRoomServices"
import type { ExaminationRoom } from "../types/examinationRoom"
import { appointmentService } from "../services/appointmentService"
import { servicesService } from "../services/servicesService"
import { createServiceOrder as createServiceOrderService } from "../services/serviceOrderService"
import { useTranslation } from "react-i18next"

const { Text } = Typography

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  appointmentId?: number
}

interface MedicalOrderItem extends Omit<ServiceOrder, "orderId" | "createdAt"> {
  serviceId: number
  order_time: string
}

export const ServiceOrderModal: React.FC<ModalProps> = ({ isOpen, onClose, appointmentId }) => {
  const { t } = useTranslation()
  const [services, setServices] = useState<Services[]>([])
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [indications, setIndications] = useState<MedicalOrderItem[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [filteredServices, setFilteredServices] = useState<Services[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [examinationRooms, setExaminationRooms] = useState<ExaminationRoom[]>([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [appointmentData, setAppointmentData] = useState<any>(null)

  const searchContainerRef = useRef<HTMLDivElement>(null)

  const searchServices = useCallback(async (searchTerm: string): Promise<Services[]> => {
    try {
      setSearchLoading(true)
      const results = await servicesService.searchServices(searchTerm)
      return results
    } catch (error) {
      console.error("Error searching services:", error)
      return []
    } finally {
      setSearchLoading(false)
    }
  }, [])

  const fetchExaminationRooms = useCallback(async () => {
    try {
      setRoomsLoading(true)
      // Only fetch rooms with type = 'S'
      const rooms = await examinationRoomService.filterRooms('S')
      setExaminationRooms(rooms)
    } catch (error) {
      console.error("Error fetching examination rooms:", error)
    } finally {
      setRoomsLoading(false)
    }
  }, [])

  const addIndication = (service: Services) => {
    // ...existing code...
    const newIndication: MedicalOrderItem = {
      serviceId: service.service_id,
      order_time: new Date().toISOString(),
      appointmentId: appointmentId!,
      roomId: null, // Let user choose, use null for empty
      price: service.price,
      orderStatus: "ORDERED",
      service: {
        ...service,
        service_id: service.id, // Add service_id field for backend compatibility
        serviceName: service.serviceName || (service as any).service_name
      },
    }
    setIndications([...indications, newIndication])
    setSearchInput("")
    setFilteredServices([])
    setShowSearchResults(false)
  }

  const handleDeleteIndication = (index: number) => {
    setIndications(indications.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!appointmentId || indications.length === 0) {
      message.error(t("serviceOrder.errors.noIndicationsToSave"))
      return
    }

    try {
      setLoading(true)
      for (const indication of indications) {
        // ...existing code...
        await createServiceOrderService(appointmentId, indication.serviceId, indication.roomId, "O", indication.order_time)
      }
      message.success(t("serviceOrder.success.saveIndications"))
      onClose()
    } catch (error) {
      console.error("Error saving service orders:", error)
      message.error(t("serviceOrder.errors.cannotSaveIndications"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchInput.trim()) {
        const results = await searchServices(searchInput)
        setFilteredServices(results)
      } else {
        setFilteredServices(await searchServices(""))
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchInput, searchServices])

  useEffect(() => {
    if (isOpen && appointmentId) {
      fetchExaminationRooms()
      appointmentService.getAppointmentById(appointmentId).then(setAppointmentData).catch(console.error)
    }
  }, [isOpen, appointmentId, fetchExaminationRooms])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleRoomChange = (index: number, roomId: number) => {
    setIndications((prev) => prev.map((item, i) => i === index ? { ...item, roomId } : item))
  }

  const columns = [
    { title: t("serviceOrder.table.indication"), dataIndex: ["service", "serviceName"], key: "serviceName" },
    {
      title: t("serviceOrder.table.room"),
      dataIndex: "roomId",
      key: "roomId",
      render: (roomId: number | null, record: MedicalOrderItem, index: number) => (
        <Select
          placeholder={t("serviceOrder.placeholders.selectRoom")}
          style={{ width: '100%' }}
          value={roomId === undefined ? null : roomId}
          onChange={(value) => handleRoomChange(index, value)}
          allowClear
        >
          {examinationRooms.map(room => (
            <Select.Option key={room.roomId} value={room.roomId}>{room.note}</Select.Option>
          ))}
        </Select>
      ),
    },
    { title: t("serviceOrder.table.price"), dataIndex: "price", key: "price", render: (text: number) => `${text.toLocaleString("vi-VN")} VNĐ` },
    { title: "", key: "action", render: (_: any, __: any, index: number) => (
      <Button icon={<DeleteOutlined />} onClick={() => handleDeleteIndication(index)} danger />
    )},
  ]

  return (
    <Modal
      title={t("serviceOrder.titles.addIndication")}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Text strong>{t("serviceOrder.labels.patient")}: {appointmentData?.patientInfo?.first_name} {appointmentData?.patientInfo?.last_name}</Text>
            <div><Text type="secondary">{t("serviceOrder.labels.patientCode")}: {appointmentData?.patientInfo?.id}</Text></div>
          </div>
          <div className="text-right">
            <Text strong>{t("serviceOrder.labels.date")}: {new Date().toLocaleDateString("vi-VN")}</Text>
            <div><Text type="secondary">{t("serviceOrder.labels.time")}: {new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</Text></div>
          </div>
        </div>

        <div className="relative flex-1 max-w-md mb-4" ref={searchContainerRef}>
          <Input
            placeholder={t("serviceOrder.placeholders.searchIndication")}
            prefix={<SearchOutlined />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => setShowSearchResults(true)}
            onBlur={() => setShowSearchResults(false)}
            suffix={searchLoading ? <Spin size="small" /> : null}
          />
          {showSearchResults && filteredServices.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
              {filteredServices.map((service) => (
                <div
                  key={service.id || service.serviceId}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onMouseDown={() => addIndication(service)}
                >
                  <div className="font-medium">{service.service_name || service.serviceName}</div>
                  <div className="text-xs text-gray-400">{service.price.toLocaleString("vi-VN")} VNĐ</div>
                </div>
              ))}
            </div>
          )}
          {showSearchResults && filteredServices.length === 0 && searchInput && !searchLoading && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-3">
              <div className="text-gray-500 text-center">{t("serviceOrder.empty.noServicesFound")}</div>
            </div>
          )}
        </div>

        <Table
          columns={columns}
          dataSource={indications}
          rowKey="serviceId"
          pagination={false}
          className="mb-6"
          loading={loading}
        />

        <div className="flex justify-end space-x-3">
          <Button onClick={onClose}>{t("serviceOrder.buttons.cancel")}</Button>
          <Button type="primary" onClick={handleSave} loading={loading}>
            {t("serviceOrder.buttons.save")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
