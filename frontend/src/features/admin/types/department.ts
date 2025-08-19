export interface Department {
  id: string;
  name: string;
  head: string;
  team: {
    images: string[];
  };
  location: string;
  staffCount: number;
  description: string;
  foundedYear: number;
  phoneNumber?: string;
  email?: string;
}

export interface DepartmentFromAPI {
  id: number; 
  department_name: string;
  description: string;
  location?: string;
  head_doctor_id?: string;
  headDoctorName?: string;
  headDoctorImage?: string;
  staffCount: number;
  staffImages?: string[];
  foundedYear?: number;
  phoneNumber?: string;
  email?: string;
  createdAt?: string;
  examinationRoomDtos?: ExaminationRoom[];
}

export interface ExaminationRoom {
  roomId: number;
  roomName: string;
  departmentId: number;
  capacity: number;
  isAvailable: boolean;
  equipment?: string;
  createdAt: string;
}

// Helper function to transform API data to frontend format
export const transformDepartmentData = (apiDepartment: DepartmentFromAPI, index?: number): Department => {
  return {
    id: apiDepartment.id,
    name: apiDepartment.department_name || "Khoa chưa có tên",
    head: apiDepartment.headDoctorName || "Chưa cập nhật trưởng khoa",
    team: {
      images: apiDepartment.staffImages || [],
    },
    location: apiDepartment.location || "Chưa cập nhật vị trí",
    staffCount: apiDepartment.staffCount || 0,
    description: apiDepartment.description || "Chưa có mô tả",
    foundedYear: apiDepartment.foundedYear || 2020,
    phoneNumber: apiDepartment.phoneNumber,
    email: apiDepartment.email,
  };
};
