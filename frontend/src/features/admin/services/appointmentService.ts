import type {
  Service,
  ServiceDto,
  Appointment,
  ServiceOrder,
  AppointmentUpdateRequest,
  AppointmentRequest,
  AppointmentResponse,
} from "../types/appointment";
import { api } from "../../../shared/services/api";

export const appointmentService = {
  // Get all services
  async getAllServices(): Promise<Service[]> {
    const response = await api.get<Service[]>("/appointments/services");
    return response.data;
  },

  // Get service by ID
  async getServiceById(serviceId: number): Promise<Service> {
    const response = await api.get<Service>(
      `/appointments/services/${serviceId}`
    );
    return response.data;
  },

  // Create service
  async createService(serviceData: ServiceDto): Promise<Service> {
    const response = await api.post<Service>(
      "/appointments/services",
      serviceData
    );
    return response.data;
  },

  // Update service
  async updateService(
    serviceId: number,
    serviceData: Partial<ServiceDto>
  ): Promise<Service> {
    const response = await api.put<Service>(
      `/appointments/services/${serviceId}`,
      serviceData
    );
    return response.data;
  },

  // Delete service
  async deleteService(serviceId: number): Promise<string> {
    const response = await api.delete<string>(
      `/appointments/services/${serviceId}`
    );
    return response.data;
  },

  // Get all orders
  async getAllOrders(serviceId: number): Promise<ServiceOrder[]> {
    const response = await api.get<ServiceOrder[]>(
      `/appointments/services/${serviceId}/service-orders`
    );
    return response.data;
  },

  // Get all appointments by patient ID
  async getAppointmentsByPatientId(
    patientId: number,
    pageNo: number = 0,
    pageSize: number = 10
  ): Promise<any> {
    const response = await api.get(
      `/appointments/patient/${patientId}?pageNo=${pageNo}&pageSize=${pageSize}`
    );
    return response.data;
  },

  // Get appointment by ID
  async getAppointmentById(appointmentId: number): Promise<Appointment> {
    const response = await api.get<Appointment>(
      `/appointments/${appointmentId}`
    );
    return response.data;
  },

  // Create appointment
  async createAppointment(
    appointmentData: Omit<AppointmentRequest, "appointmentId" | "createdAt">
  ): Promise<AppointmentRequest> {
    const response = await api.post<AppointmentRequest>(
      "/appointments",
      appointmentData
    );
    return response.data;
  },

  // Update appointment
  async updateAppointment(
    appointmentId: number,
    appointmentData: Omit<
      AppointmentUpdateRequest,
      "appointmentId" | "createdAt"
    >
  ): Promise<AppointmentUpdateRequest> {
    const response = await api.put<AppointmentUpdateRequest>(
      `/appointments/${appointmentId}`,
      appointmentData
    );
    return response.data;
  },

  // Delete appointment
  async deleteAppointment(appointmentId: number): Promise<string> {
    const response = await api.delete<string>(`/appointments/${appointmentId}`);
    return response.data;
  },

  // Get all appointments (PageResponse)
  async getAllAppointments(
    pageNo: number = 0,
    pageSize: number = 10
  ): Promise<{
    content: AppointmentResponse[];
    totalPages: number;
    totalElements: number;
    pageNo: number;
    pageSize: number;
  }> {
    const response = await api.get(
      `/appointments?pageNo=${pageNo}&pageSize=${pageSize}`
    );
    return response.data;
  },

  // Get schedules by date
  async getSchedulesByDate(date: string) {
    const response = await api.get(`/schedules/date/${date}`);
    return response.data;
  },

  // Get schedule by id
  async getScheduleById(id: number) {
    const response = await api.get(`/schedules/${id}`);
    return response.data;
  },

  // Get all patients

};
