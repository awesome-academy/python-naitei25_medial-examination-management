import { api } from "./api";
import type { DepartmentFromAPI } from "../../features/admin/types/department";     

export interface DepartmentDto {
  departmentName: string;
  description: string;
  location?: string;
  head?: string;
}

export const departmentService = {
  async getAllDepartments(): Promise<DepartmentFromAPI[]> {
    const response = await api.get<DepartmentFromAPI[]>("/doctors/departments");
    return response.data;
  },

  async getDepartmentById(departmentId: number): Promise<DepartmentFromAPI> {
    const response = await api.get<DepartmentFromAPI>(`/doctors/departments/${departmentId}`);
    return response.data;
  },

  async createDepartment(departmentData: DepartmentDto): Promise<DepartmentFromAPI> {
    const response = await api.post<DepartmentFromAPI>("/doctors/departments", departmentData);
    return response.data;
  },

  async updateDepartment(
    departmentId: number,
    departmentData: DepartmentDto
  ): Promise<DepartmentFromAPI> {
    const response = await api.put<DepartmentFromAPI>(
      `/doctors/departments/${departmentId}`,
      departmentData
    );
    return response.data;
  },

  async deleteDepartment(departmentId: number): Promise<string> {
    const response = await api.delete<string>(`/doctors/departments/${departmentId}`);
    return response.data;
  },

  async getDoctorsByDepartmentId(departmentId: number): Promise<unknown[]> {
    const response = await api.get<unknown[]>(`/doctors/departments/${departmentId}/doctors`);
    return response.data;
  },
};
