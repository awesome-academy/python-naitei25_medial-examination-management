import type { Bill, BillResponse } from "../types/payment"
import { api } from "../../../shared/services/api"
import axios from "axios"

export const paymentService = {
  // Get all bills for a patient
  async getBillsByPatientId(patientId: number): Promise<Bill[]> {
    try {
      const response = await api.get<Bill[]>(`/bills/patient/${patientId}/`)
      return response.data
    } catch (error) {
      console.error("Error fetching bills by patient ID:", error)
      throw error
    }
  },

  // Delete a bill
  async deleteBill(billId: number): Promise<string> {
    try {
      const response = await api.delete<string>(`/bills/${billId}/`)
      return response.data
    } catch (error) {
      console.error("Error deleting bill:", error)
      throw error
    }
  },

  // Get transactions by bill ID
  async getTransactionsByBillId(billId: number): Promise<any[]> {
    try {
      const response = await api.get(`/transactions/bill/${billId}/`)
      if (response.data.error === 0) {
        return response.data.data || []
      }
      throw new Error(response.data.message || "Không thể lấy danh sách giao dịch")
    } catch (error) {
      console.error("Error fetching transactions by bill ID:", error)
      throw error
    }
  },

  // Create payment link for a bill
  async createPayment(billId: number): Promise<string> {
    try {
      const response = await api.post(`/transactions/create-payment/${billId}/`)
      return response.data.data
    } catch (error) {
      console.error("Error creating payment:", error)
      throw error
    }
  },

  async processCashPayment(billId: number): Promise<{ error: number; message: string }> {
    try {
      const response = await api.post(`/transactions/cash-payment/${billId}/`)
      return response.data
    } catch (error) {
      console.error("Error processing cash payment:", error)
      throw error
    }
  },

  async handlePaymentSuccess(orderId: number): Promise<void> {
    const response = await axios.get(`/transactions/${orderId}/success`)
    if (response.data.error !== 0) {
      throw new Error(response.data.message || "Không thể cập nhật trạng thái thanh toán")
    }
  },

  async checkPaymentStatus(orderId: number): Promise<boolean> {
    try {
      const response = await api.get(`/transactions/payment-info/${orderId}/`)
      if (response.data.error === 0) {
        const paymentInfo = response.data.data
        if (paymentInfo.status === "PAID") {
          await this.handlePaymentSuccess(orderId)
          return true
        }
      }
      return false
    } catch (error) {
      console.error("Error checking payment status:", error)
      return false
    }
  },

  // // Tạo link thanh toán dịch vụ
  // async createServicePayment(billId: number): Promise<string> {
  //   try {
  //     const response = await api.post(`/transactions/create-service-payment/${billId}/`)
  //     return response.data.data
  //   } catch (error) {
  //     console.error("Error creating service payment:", error)
  //     throw error
  //   }
  // },

  // // Kiểm tra trạng thái thanh toán dịch vụ
  // async checkServicePaymentStatus(orderCode: number): Promise<boolean> {
  //   try {
  //     const response = await api.get(`/transactions/check-service-status/${orderCode}/`)
  //     if (response.data.error === 0) {
  //       return response.data.paid
  //     }
  //     throw new Error(response.data.message || "Không thể kiểm tra trạng thái thanh toán")
  //   } catch (error) {
  //     console.error("Error checking service payment status:", error)
  //     throw error
  //   }
  // },

  // Get all bills
  async getAllBills(
    page = 1,
    size = 20,
  ): Promise<{
    content: BillResponse[]
    totalPages: number
    totalElements: number
    size: number
    number: number
  }> {
    const response = await api.get(`/bills?page=${page}&size=${size}`)
    return response.data
  },
}
