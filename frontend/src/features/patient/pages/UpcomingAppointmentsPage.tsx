"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  XCircleIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "lucide-react"
import { appointmentService } from "../../../shared/services/appointmentService"
import { paymentService } from "../../../shared/services/paymentService"
import type { Appointment } from "../../../shared/types/appointment"

const UpcomingAppointmentsPage: React.FC = () => {
  const { t } = useTranslation()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  useEffect(() => {
    fetchUpcomingAppointments()
  }, [])

  const fetchUpcomingAppointments = async () => {
    try {
      setLoading(true)
      const data = await appointmentService.getUpcomingAppointments()
      setAppointments(data)
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách lịch khám")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy lịch khám này?")) {
      return
    }

    try {
      setCancellingId(appointmentId)
      await appointmentService.cancelAppointment(appointmentId, "Hủy bởi bệnh nhân")
      await fetchUpcomingAppointments() // Refresh list
    } catch (err: any) {
      alert("Không thể hủy lịch khám: " + err.message)
    } finally {
      setCancellingId(null)
    }
  }

  const handlePayment = async (appointment: Appointment) => {
    try {
      const bill = await paymentService.createBillFromAppointment(appointment)
      const paymentLink = await paymentService.createPaymentLink(bill.id)
      window.open(paymentLink.checkoutUrl, "_blank")
    } catch (err: any) {
      alert("Không thể tạo thanh toán: " + err.message)
    }
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
      PENDING: {
        label: "Chờ xác nhận",
        className: "bg-yellow-100 text-yellow-800",
        icon: <AlertCircleIcon className="w-4 h-4" />,
      },
      CONFIRMED: {
        label: "Đã xác nhận",
        className: "bg-green-100 text-green-800",
        icon: <CheckCircleIcon className="w-4 h-4" />,
      },
      CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-800", icon: <XCircleIcon className="w-4 h-4" /> },
      COMPLETED: {
        label: "Đã hoàn thành",
        className: "bg-blue-100 text-blue-800",
        icon: <CheckCircleIcon className="w-4 h-4" />,
      },
      IN_PROGRESS: {
        label: "Đang khám",
        className: "bg-purple-100 text-purple-800",
        icon: <ClockIcon className="w-4 h-4" />,
      },
      NO_SHOW: {
        label: "Không đến",
        className: "bg-gray-100 text-gray-800",
        icon: <XCircleIcon className="w-4 h-4" />,
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lịch Khám Sắp Tới</h1>
        <Link
          to="/patient/book-appointment"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Đặt lịch mới
        </Link>
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
          <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Không có lịch khám sắp tới</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Bạn chưa có lịch khám nào được đặt. Hãy đặt lịch khám với bác sĩ phù hợp.
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
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Triệu chứng:</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      {appointment.symptoms}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-xs text-gray-500">Đặt lịch: {formatDateTime(appointment.createdAt)}</div>

                  <div className="flex space-x-2">
                    {appointment.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handlePayment(appointment)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          Thanh toán
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          disabled={cancellingId === appointment.id}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {cancellingId === appointment.id ? "Đang hủy..." : "Hủy lịch"}
                        </button>
                      </>
                    )}

                    {appointment.status === "CONFIRMED" && (
                      <button
                        onClick={() => handlePayment(appointment)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Thanh toán
                      </button>
                    )}

                    {appointment.doctorId && (
                      <Link
                        to={`/patient/doctors/${appointment.doctorId}?book=true`}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                      >
                        Xem bác sĩ
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UpcomingAppointmentsPage
