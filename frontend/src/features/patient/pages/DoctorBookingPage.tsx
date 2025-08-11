import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import DoctorBookingHeader from "../components/common/Doctor/DoctorBookingHeader"
import DateSelector from "../components/common/Doctor/DateSelector"
import TimeSlotSelector from "../components/common/Doctor/TimeSlotSelector"
import InsuranceOption from "../components/common/Doctor/InsuranceOption"
// import SimilarDoctorCard from "../components/doctors/SimilarDoctorCard"
import { useApi } from "../hooks/useApi"
import { patientApiService } from "../services/patientApiService"
import { patientAppointmentService } from "../services/patientAppointmentService"
import type { Doctor, DayOption, TimeOfDay, BookingDetails } from "../../../shared/types"
import { Button } from "@/components/ui/button"
import { usePatientContext } from "../context/PatientContext"
import LoadingSpinner from "../../../shared/components/common/LoadingSpinner"
import ErrorMessage from "../../../shared/components/common/ErrorMessage"

const DoctorBookingPage: React.FC = () => {
  const navigate = useNavigate()
  const params = useParams()
  const doctorId = Number.parseInt(params.id as string)
  
  // Kiểm tra PatientContext có tồn tại không
  let patientContext
  try {
    patientContext = usePatientContext()
  } catch (error) {
    console.error("PatientContext not found:", error)
    // Fallback state management nếu context không có
    patientContext = null
  }

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<TimeOfDay | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [hasInsurance, setHasInsurance] = useState<boolean | null>(null)

  // Validate doctorId
  if (!doctorId || isNaN(doctorId)) {
    return <ErrorMessage message="ID bác sĩ không hợp lệ" />
  }

  // Lấy thông tin bác sĩ từ API
  const { 
    data: doctor, 
    loading: doctorLoading, 
    error: doctorError 
  } = useApi(() => patientApiService.getDoctorById(doctorId), [doctorId])

  // Lấy available time slots khi có selectedDate
  const { 
    data: availableSlots, 
    loading: slotsLoading 
  } = useApi(
    () => selectedDate ? patientAppointmentService.getAvailableTimeSlots(doctorId, selectedDate) : Promise.resolve({ morning: [], afternoon: [] }),
    [doctorId, selectedDate]
  )

  useEffect(() => {
    // Set default date to today if available
    const today = new Date()
    const todayFormatted = today.toISOString().split("T")[0]
    setSelectedDate(todayFormatted)
    setSelectedTimeOfDay("morning")
  }, [])

  const handleBackClick = () => {
    navigate(-1)
  }

  const getDayOptions = (): DayOption[] => {
    const today = new Date()
    const options: DayOption[] = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const formattedDate = date.toISOString().split("T")[0]
      const dayLabel =
        i === 0 ? "Hôm Nay" : i === 1 ? "Ngày mai" : `Th ${date.getDay() === 0 ? "CN" : date.getDay() + 1}`

      options.push({
        label: dayLabel,
        date: formattedDate,
        dayOfWeek: date.toLocaleDateString("vi-VN", { weekday: "short" }),
        isAvailable: true // Sẽ được cập nhật dựa trên API response
      })
    }
    return options
  }

  const handleSelectDate = (date: string) => {
    setSelectedDate(date)
    setSelectedTimeSlot(null)
    setSelectedTimeOfDay("morning")
  }

  const handleSelectTimeOfDay = (timeOfDay: TimeOfDay) => {
    setSelectedTimeOfDay(timeOfDay)
    setSelectedTimeSlot(null)
  }

  const handleSelectTimeSlot = (time: string) => {
    setSelectedTimeSlot(time)
  }

  const handleSelectInsurance = (value: boolean) => {
    setHasInsurance(value)
  }

  const handleNext = () => {
    if (doctor && selectedDate && selectedTimeSlot && hasInsurance !== null) {
      const bookingDetails: BookingDetails = {
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty,
        doctorAvatar: doctor.avatar,
        doctorRoom: doctor.room || "",
        doctorConsultationFee: doctor.consultationFee || 0,
        selectedDate: selectedDate,
        selectedTime: selectedTimeSlot,
        hasInsurance: hasInsurance,
        selectedSymptoms: [],
        paymentMethodType: null,
        selectedCardId: null,
        totalAmount: 0,
        insuranceDiscount: 0,
      }

      // Sử dụng context nếu có, nếu không thì lưu vào localStorage
      if (patientContext && patientContext.setBookingDetails) {
        patientContext.setBookingDetails(bookingDetails)
      } else {
        // Fallback: save to localStorage
        try {
          localStorage.setItem('bookingDetails', JSON.stringify(bookingDetails))
        } catch (error) {
          console.error('Error saving booking details:', error)
        }
      }

      navigate(`/patient/doctors/${doctor.id}/book/symptoms`)
    } else {
      alert("Vui lòng chọn ngày, giờ và tùy chọn bảo hiểm.")
    }
  }

  if (doctorLoading) {
    return <LoadingSpinner message="Đang tải thông tin bác sĩ..." />
  }

  if (doctorError || !doctor) {
    return <ErrorMessage message={doctorError || "Không tìm thấy thông tin bác sĩ"} />
  }

  return (
    <>
      <DoctorBookingHeader title="Đặt lịch hẹn" onBackClick={handleBackClick} />
      <div className="mx-auto py-6 px-4 sm:px-6 lg:px-8 pb-20">
        {/* Doctor Info */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex items-center space-x-4 mb-8">
          <img
            src={doctor.avatar || "/images/placeholder-doctor.png"}
            alt={doctor.name}
            className="h-16 w-16 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">{doctor.name}</p>
            <p className="text-sm text-cyan-500">{doctor.specialty}</p>
            {doctor.room && <p className="text-sm text-gray-600">{doctor.room}</p>}
            {doctor.consultationFee && (
              <p className="text-base font-bold text-cyan-500 mt-1">
                {doctor.consultationFee.toLocaleString("vi-VN")} VND
              </p>
            )}
          </div>
        </div>

        {/* Choose Time Section */}
        <div className="space-y-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 uppercase">Chọn thời gian</h3>
          <DateSelector days={getDayOptions()} selectedDate={selectedDate} onSelectDate={handleSelectDate} />
          
          {slotsLoading ? (
            <LoadingSpinner size="sm" message="Đang tải khung giờ..." />
          ) : (
            <TimeSlotSelector
              morningSlots={availableSlots?.morning || []}
              afternoonSlots={availableSlots?.afternoon || []}
              selectedTimeOfDay={selectedTimeOfDay}
              selectedTimeSlot={selectedTimeSlot}
              onSelectTimeOfDay={handleSelectTimeOfDay}
              onSelectTimeSlot={handleSelectTimeSlot}
            />
          )}
        </div>

        {/* Health Insurance Section */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-gray-900">Bảo hiểm Y Tế</h3>
          <InsuranceOption hasInsurance={hasInsurance} onSelect={handleSelectInsurance} />
        </div>

        {/* Continue Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg lg:static lg:shadow-none lg:p-0 lg:mt-8">
          <Button
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 text-lg font-semibold"
            disabled={!selectedDate || !selectedTimeSlot || hasInsurance === null}
            onClick={handleNext}
          >
            Tiếp theo
          </Button>
        </div>
      </div>
    </>
  )
}

export default DoctorBookingPage