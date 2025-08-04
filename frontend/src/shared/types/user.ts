export interface User {
  userId: number
  email: string | null 
  phone: string
  role: "A" | "P" | "D" | "RECEPTIONIST"
  createdAt: string
}

export interface UserRequest {
  email?: string
  phone: string
  password: string
  role: "A" | "P" | "D" | "RECEPTIONIST"
}

export interface UserUpdateRequest {
  phone?: string
  email?: string | null
  password?: string
  role?: "A" | "P" | "D" | "RECEPTIONIST"
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface AuthUser {
  userId?: number;
  id?: number;
  name: string;
  email: string;
  phone: string;
  role: "D" | "A" | "RECEPTIONIST" | "P";
  createdAt: string;
}

// Response type for getCurrentUser endpoint - same as User
export interface UserResponse extends User {}
