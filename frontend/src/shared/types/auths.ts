import type { User } from "./user";
import type { Doctor } from "./doctor";

export interface AuthUser extends User {
  // Extends the User type
}

export interface DoctorInfo extends Doctor {
  // Extends the Doctor type
}

export interface AdminInfo extends User {
  // Admin-specific fields can be added here if needed
}

export interface ReceptionistInfo extends User {
    // Receptionist-specific fields can be added here if needed
}

export interface AuthState {
  user: AuthUser | null;
  doctorInfo: DoctorInfo | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  doctorInfo?: DoctorInfo;
}
