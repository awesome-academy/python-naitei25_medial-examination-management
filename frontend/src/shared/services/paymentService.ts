import { api } from './api';
import { storage } from '../utils/storage';
import { LocalStorageKeys } from '../constants/storageKeys';
import { patientService } from './patientService';

const paymentService = {
  async createBillFromAppointment(appointment: any) {
    if (!appointment || !appointment.id || !appointment.doctorInfo || !appointment.doctorInfo.price) {
      throw new Error('Dữ liệu cuộc hẹn không hợp lệ hoặc thiếu thông tin giá bác sĩ');
    }

    const consultationPrice = parseFloat(appointment.doctorInfo.price);
    if (isNaN(consultationPrice) || consultationPrice <= 0) {
      throw new Error('Giá khám không hợp lệ hoặc bằng 0');
    }

    const userId = Number(storage.getRaw(LocalStorageKeys.CURRENT_USER_ID));
    if (isNaN(userId)) {
      throw new Error('Không tìm thấy user_id trong localStorage');
    }

    let patientId: number;
    try {
      const patient = await patientService.getPatientByUserId(userId);
      patientId = patient.id;
    } catch (error: any) {
      throw new Error('Không thể lấy patient_id: ' + (error.message || 'Lỗi không xác định'));
    }

    const totalCost = consultationPrice;
    const insuranceDiscount = consultationPrice * 0.1;
    const amount = totalCost - insuranceDiscount;

    const payload = {
      appointment_id: appointment.id,
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
      const params = orderCode ? { orderCode } : {};
      const response = await api.get(`/transactions/payment-info/${billId}/`, { params });
      console.log('Payment info response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi lấy thông tin thanh toán:', error.response?.data || error.message);
      throw error;
    }
  },

  // Method mới để cập nhật status thanh toán từ callback PayOS
  async updatePaymentStatus(billId: number, status: 'success' | 'cancel', paymentData?: any) {
    try {
      const endpoint = status === 'success' 
        ? `/transactions/${billId}/success` 
        : `/transactions/${billId}/cancel`;
      const payload = {
        orderCode: paymentData?.orderCode,
        status: paymentData?.status,
        payosCode: paymentData?.payosCode,
        payosId: paymentData?.payosId,
        timestamp: new Date().toISOString()
      };
      console.log(`Cập nhật payment status cho bill ${billId}:`, payload);
      const response = await api.post(endpoint, payload);
      console.log('Update payment status response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi cập nhật payment status:', error.response?.data || error.message);
      throw error;
    }
  },

  // Method để verify payment status với backend
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

  // Method để lấy payment status hiện tại
  async getPaymentStatus(billId: number) {
    try {
      const response = await api.get(`/transactions/status/${billId}/`);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi lấy payment status:', error.response?.data || error.message);
      throw error;
    }
  },

  // Method để retry payment nếu cần
  async retryPayment(billId: number) {
    try {
      const response = await api.post(`/transactions/retry-payment/${billId}/`);
      return response.data.data;
    } catch (error: any) {
      console.error('Lỗi khi retry payment:', error.response?.data || error.message);
      throw error;
    }
  }
};

export { paymentService };