"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  XCircleIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  FileTextIcon,
  Star,
  StarOff,
} from "lucide-react"
import { appointmentService } from "../../../shared/services/appointmentService"
import { prescriptionService } from "../../../shared/services/prescriptionService"
import type { Appointment, AppointmentStatus } from "../../../shared/types/appointment"

const PastAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set())
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  const navigate = useNavigate()

  const fetchPastAppointments = useCallback(async () => {
    try {
      setLoading(true)

      const filters: { status?: AppointmentStatus | "" } = {}

      if (selectedStatus !== "all") {
        filters.status = selectedStatus as AppointmentStatus
      } else {
        filters.status = "" // Send empty string for 'all' to backend
      }

      const data = await appointmentService.getMyAppointments(currentPage, 10, filters)

      setAppointments(data?.content || [])
      setTotalPages(data?.totalPages || 1)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tải danh sách lịch khám"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [currentPage, selectedStatus])

  useEffect(() => {
    fetchPastAppointments()
  }, [fetchPastAppointments])

  const toggleNotes = (appointmentId: number) => {
    const newExpanded = new Set(expandedNotes)
    if (newExpanded.has(appointmentId)) {
      newExpanded.delete(appointmentId)
    } else {
      newExpanded.add(appointmentId)
    }
    setExpandedNotes(newExpanded)
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5)
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid Date"

    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour12: false,
    }).format(date)
  }

  const handleViewMedicalRecord = (prescriptionId?: number | null) => {
    if (!prescriptionId) return
    navigate(`/patient/medical-record/${prescriptionId}`)
  }

  const handleDownloadPrescription = async (prescriptionId?: number | null) => {
    if (!prescriptionId) {
      setError("Không có đơn thuốc để tải")
      return
    }
    try {
      const pdfUrl = await prescriptionService.downloadPrescriptionPdf(prescriptionId)
      window.open(pdfUrl, "_blank")
    } catch (err) {
      console.error("Download PDF error:", err)
      setError("Tải đơn thuốc thất bại")
    }
  }

  const getStatusBadge = (backendStatus: string) => {
    const statusMap: Record<string, string> = {
      P: "PENDING",
      C: "CONFIRMED",
      I: "IN_PROGRESS",
      D: "COMPLETED",
      X: "CANCELLED",
      N: "NO_SHOW",
    }

    const fullStatus = statusMap[backendStatus] || "UNKNOWN"

    const statusConfig = {
      COMPLETED: {
        label: "Đã hoàn thành",
        className: "bg-green-100 text-green-800",
        icon: <CheckCircleIcon className="w-4 h-4" />,
      },
      CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-800", icon: <XCircleIcon className="w-4 h-4" /> },
      NO_SHOW: {
        label: "Không đến",
        className: "bg-gray-100 text-gray-800",
        icon: <XCircleIcon className="w-4 h-4" />,
      },
      PENDING: {
        label: "Chờ xác nhận",
        className: "bg-yellow-100 text-yellow-800",
        icon: <AlertCircleIcon className="w-4 h-4" />,
      },
      CONFIRMED: {
        label: "Đã xác nhận",
        className: "bg-blue-100 text-blue-800",
        icon: <CheckCircleIcon className="w-4 h-4" />,
      },
      IN_PROGRESS: {
        label: "Đang khám",
        className: "bg-purple-100 text-purple-800",
        icon: <ClockIcon className="w-4 h-4" />,
      },
      UNKNOWN: {
        label: "Trạng thái không xác định",
        className: "bg-gray-100 text-gray-800",
        icon: <AlertCircleIcon className="w-4 h-4" />,
      },
    }

    const config = statusConfig[fullStatus as keyof typeof statusConfig]

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  const renderStars = (rating = 0) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) =>
          star <= rating ? (
            <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
          ) : (
            <StarOff key={star} className="w-4 h-4 text-gray-300" />
          ),
        )}
        <span className="ml-1 text-sm text-gray-600">({rating}/5)</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lịch Sử Khám Bệnh</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="NO_SHOW">Không đến</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="IN_PROGRESS">Đang khám</option>
          </select>
          <Link
            to="/patient/book-appointment"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đặt lịch mới
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <XCircleIcon className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <FileTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Chưa có lịch sử khám bệnh</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Bạn chưa có lịch khám nào được hoàn thành hoặc hủy bỏ.
          </p>
          <Link
            to="/patient/book-appointment"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Đặt lịch khám
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          {appointment.doctorInfo?.avatar ? (
                            <img
                              src={appointment.doctorInfo.avatar || "/placeholder.svg"}
                              alt={`BS. ${appointment.doctorInfo.fullName}`}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          BS. {appointment.doctorInfo?.fullName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {appointment.doctorInfo?.specialization}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(appointment.status)}
                      <div className="text-lg font-semibold text-blue-600 mt-2">
                        {Number(appointment.doctorInfo?.price).toLocaleString("vi-VN")}đ
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(appointment.schedule?.work_date || "")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <ClockIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatTime(appointment.slot_start || "")} - {formatTime(appointment.slot_end || "")}
                        </p>
                        <p className="text-xs text-gray-500">
                          Ca: {appointment.schedule?.shift === "M" ? "Sáng" : "Chiều"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 md:col-span-2">
                      <MapPinIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {appointment.schedule?.location}
                        </p>
                        <p className="text-xs text-gray-500">
                          Tầng {appointment.schedule?.floor}, {appointment.schedule?.building}
                          {appointment.schedule?.room_note && ` - ${appointment.schedule.room_note}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {appointment.symptoms && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Triệu chứng ban đầu:
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        {appointment.symptoms}
                      </p>
                    </div>
                  )}

                  {appointment.appointment_notes && appointment.appointment_notes.length > 0 && (
                    <div className="mb-4">
                      <button
                        onClick={() => toggleNotes(appointment.id)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <FileTextIcon className="w-4 h-4" />
                        <span>
                          {expandedNotes.has(appointment.id) ? "Ẩn" : "Xem"} kết quả khám (
                          {appointment.appointment_notes.length})
                        </span>
                      </button>

                      {expandedNotes.has(appointment.id) && (
                        <div className="mt-3 space-y-2">
                          {appointment.appointment_notes.map((note) => (
                            <div key={note.id} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                  {note.note_type === "DIAGNOSIS"
                                    ? "Chẩn đoán"
                                    : note.note_type === "PRESCRIPTION"
                                      ? "Đơn thuốc"
                                      : "Ghi chú"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(note.createdAt).toLocaleString("vi-VN")}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{note.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {appointment.status === "COMPLETED" && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Đánh giá cuộc khám:</h4>
                      {renderStars(4)}
                      <p className="text-xs text-gray-500 mt-1">Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                    {appointment.createdAt && (
                      <div className="text-xs text-gray-500">Đặt lịch: {formatDateTime(appointment.createdAt)}</div>
                    )}

                    <div className="flex space-x-2">
                      {appointment.status === "COMPLETED" && (
                        <>
                          <button className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors">
                            Đánh giá
                          </button>
                          <Link
                            to={`/patient/doctors/${appointment.doctorId}/book`}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            Đặt lại
                          </Link>
                        </>
                      )}

                      {appointment.status === "CANCELLED" && (
                        <Link
                          to={`/patient/doctors/${appointment.doctorId}/book`}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Đặt lại
                        </Link>
                      )}

                      {appointment.prescriptionId && (
                        <>
                          <button
                            onClick={() => handleViewMedicalRecord(appointment.prescriptionId)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            Xem hồ sơ khám
                          </button>
                          <button
                            onClick={() => handleDownloadPrescription(appointment.prescriptionId)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            Tải đơn thuốc
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>

              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm rounded-lg ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PastAppointmentsPage