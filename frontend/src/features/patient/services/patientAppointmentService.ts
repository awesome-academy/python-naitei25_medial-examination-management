import { appointmentService, appointmentNoteService } from '../../../shared/services/appointmentService'
import { scheduleService } from '../../../shared/services/scheduleService'
import { transformAvailableSlotsToTimeSlots } from '../../../shared/utils/appointmentTransform'
import type { 
  CreateAppointmentRequest, 
  AppointmentDetail,
  AvailableSlot 
} from '../../../shared/types/appointment'
import type { TimeSlot } from '../../../shared/types'

export class PatientAppointmentService {
  // Tạo appointment mới từ booking details
  async createAppointmentFromBooking(bookingDetails: {
    doctorId: number
    patientId: number
    scheduleId: number
    selectedDate: string
    selectedTime: string
    symptoms: string[]
  }): Promise<AppointmentDetail> {
    try {
      // Convert time string to slot format
      const [startTime, endTime] = this.parseTimeSlot(bookingDetails.selectedTime)
      
      const appointmentData: CreateAppointmentRequest = {
        doctor: bookingDetails.doctorId,
        patient: bookingDetails.patientId,
        schedule: bookingDetails.scheduleId,
        slot_start: startTime,
        slot_end: endTime,
        symptoms: bookingDetails.symptoms.join(', '),
        status: 'PENDING'
      }

      const appointment = await appointmentService.createAppointment(appointmentData)
      return appointmentService.getAppointmentById(appointment.id)
    } catch (error) {
      console.error('Error creating appointment:', error)
      throw new Error('Không thể tạo lịch hẹn')
    }
  }

  // Lấy available time slots cho doctor và date
  async getAvailableTimeSlots(doctorId: number, date: string): Promise<{
    morning: TimeSlot[]
    afternoon: TimeSlot[]
  }> {
    try {
      // Lấy schedules của doctor cho ngày đó
      const schedules = await scheduleService.getDoctorSchedules(doctorId, { workDate: date })
      
      if (schedules.length === 0) {
        return { morning: [], afternoon: [] }
      }

      // Lấy available slots cho schedule đầu tiên (có thể cải thiện logic này)
      const schedule = schedules[0]
      const availableSlots = await appointmentService.getAvailableSlots(schedule.id, date)
      
      return transformAvailableSlotsToTimeSlots(availableSlots)
    } catch (error) {
      console.error('Error fetching available slots:', error)
      return { morning: [], afternoon: [] }
    }
  }

  // Hủy appointment
  async cancelAppointment(appointmentId: number): Promise<void> {
    try {
      await appointmentService.updateAppointment(appointmentId, {
        id: appointmentId,
        status: 'CANCELLED'
      })
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      throw new Error('Không thể hủy lịch hẹn')
    }
  }

  // Thêm note cho appointment
  async addAppointmentNote(appointmentId: number, content: string, noteType = 'GENERAL'): Promise<void> {
    try {
      await appointmentNoteService.createNote(appointmentId, {
        note_type: noteType,
        content
      })
    } catch (error) {
      console.error('Error adding appointment note:', error)
      throw new Error('Không thể thêm ghi chú')
    }
  }

  private parseTimeSlot(timeString: string): [string, string] {
    // Parse time string like "09:00 - 09:30" to ["09:00", "09:30"]
    const [start, end] = timeString.split(' - ')
    return [start.trim(), end.trim()]
  }

  // Kiểm tra xem có thể đặt lịch không
  async canBookAppointment(doctorId: number, date: string, time: string): Promise<boolean> {
    try {
      const availableSlots = await this.getAvailableTimeSlots(doctorId, date)
      const allSlots = [...availableSlots.morning, ...availableSlots.afternoon]
      
      return allSlots.some(slot => slot.time === time && slot.isAvailable)
    } catch (error) {
      console.error('Error checking appointment availability:', error)
      return false
    }
  }
}

export const patientAppointmentService = new PatientAppointmentService()
