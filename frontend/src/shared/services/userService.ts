import type {
  User,
  UserRequest,
  UserUpdateRequest,
  ChangePasswordRequest,
  PagedResponse,
} from "../types/user";
import { api } from "./api";

export const userService = {
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>("/users/me");
    return response.data;
  },

  async getUserById(userId: number): Promise<User> {
    const response = await api.get<User>(`/users/${userId}`);
    return response.data;
  },

  async getAllUsers(page = 0, size = 10): Promise<PagedResponse<User>> {
    const response = await api.get<PagedResponse<User>>(
      `/users?page=${page}&size=${size}`
    );
    return response.data;
  },

  async addUser(userData: UserRequest): Promise<User> {
    const response = await api.post<User>("/users", userData);
    return response.data;
  },

  async updateUser(userId: number, data: UserUpdateRequest): Promise<User> {
    const response = await api.put<User>(`/users/${userId}`, data);
    return response.data;
  },

  async deleteUser(userId: number): Promise<string> {
    const response = await api.delete<string>(`/users/${userId}`);
    return response.data;
  },

  async changePassword(userId: number, data: ChangePasswordRequest): Promise<string> {
    const response = await api.put<string>(
      `/users/change-password/${userId}`,
      data
    );
    return response.data;
  },

  async isCurrentUser(userId: number): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser();
      return currentUser.userId === userId;
    } catch {
      return false;
    }
  },
};
