import { api } from './api';
import type { Bill } from '../types/payment';

const paymentService = {
  async createBillFromAppointment(appointmentId: number, patientId: number, price: number) {
    if (isNaN(price) || price <= 0) {
      throw new Error('Giá khám không hợp lệ hoặc bằng 0');
    }

    const totalCost = price;
    const insuranceDiscount = price * 0.1; 
    const amount = totalCost - insuranceDiscount;

    const payload = {
      appointment_id: appointmentId,
      patient_id: patientId,
      total_cost: totalCost,
      insurance_discount: insuranceDiscount,
      amount: amount,
      status: 'U', 
      bill_details: [] 
    };

    console.log('Gửi payload đến /bills/:', payload);

    try {
      const response = await api.post('/bills/', payload);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi tạo hóa đơn:', error.response?.data || error.message);
      throw error;
    }
  },

  async getBillByAppointmentId(appointmentId: number): Promise<Bill | null> {
    try {
      const response = await api.get(`/bills/`, {
        params: { appointment_id: appointmentId }
      });
      console.log('Bill response:', response.data);
      // Giả sử API trả về danh sách, lấy bill đầu tiên hoặc null nếu không có
      return response.data.content?.[0] || null;
    } catch (error: any) {
      console.error('Lỗi khi lấy hóa đơn theo appointment:', error.response?.data || error.message);
      throw error;
    }
  },

  async createPaymentLink(billId: number) {
    try {
      const response = await api.post(`/transactions/create-payment/${billId}/`);
      return response.data.data;
    } catch (error: any) {
      console.error('Lỗi khi tạo link thanh toán:', error.response?.data || error.message);
      throw error;
    }
  },

  async getPaymentInfo(billId: number, orderCode?: string) {
    try {
      let endpoint: string;
      if (orderCode) {
        endpoint = `/transactions/payment-info/${orderCode}/`;
      } else {
        endpoint = `/transactions/payment-info/${billId}/`;
      }
      const response = await api.get(endpoint);
      console.log('Payment info response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi lấy thông tin thanh toán:', error.response?.data || error.message);
      throw error;
    }
  },

  async updatePaymentStatus(orderCode: string, status: 'success' | 'cancel', paymentData?: any) {
    try {
      const endpoint = status === 'success' 
        ? `/transactions/${orderCode}/success/`
        : `/transactions/${orderCode}/cancel/`;
      const payload = {
        orderCode: paymentData?.orderCode,
        status: paymentData?.status,
        payosCode: paymentData?.payosCode,
        payosId: paymentData?.payosId,
        timestamp: new Date().toISOString()
      };
      console.log(`Cập nhật payment status cho order ${orderCode}:`, payload);
      const response = await api.post(endpoint, payload);
      console.log('Update payment status response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi cập nhật payment status:', error.response?.data || error.message);
      throw error;
    }
  },

  async verifyPaymentStatus(billId: number, orderCode?: string) {
    try {
      const params = orderCode ? { orderCode } : {};
      const response = await api.get(`/transactions/verify/${billId}/`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi verify payment:', error.response?.data || error.message);
      throw error;
    }
  },

  async getPaymentStatus(billId: number) {
    try {
      const response = await api.get(`/transactions/status/${billId}/`);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi lấy payment status:', error.response?.data || error.message);
      throw error;
    }
  },

  async retryPayment(billId: number) {
    try {
      const response = await api.post(`/transactions/retry-payment/${billId}/`);
      return response.data.data;
    } catch (error: any) {
      console.error('Lỗi khi retry payment:', error.response?.data || error.message);
      throw error;
    }
  },
};

export { paymentService };