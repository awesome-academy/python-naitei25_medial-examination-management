import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { message } from 'antd';
import { paymentService } from '../../../shared/services/paymentService';
import LoadingSpinner from '../../../shared/components/common/LoadingSpinner';
import ErrorMessage from '../../../shared/components/common/ErrorMessage';

const PaymentPage: React.FC = () => {
  console.log('PaymentPage component rendering...');
  
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { billId } = useParams<{ billId: string }>();
  const { pathname, search } = useLocation();
  
  // Kiểm tra URL pattern để xác định trạng thái
  const isSuccess = pathname.includes('/success');
  const isCancel = pathname.includes('/cancel');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bill, setBill] = useState<any>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [paymentProcessed, setPaymentProcessed] = useState(false);

  // Parse URL parameters để lấy thông tin từ PayOS callback
  const urlParams = new URLSearchParams(search);
  const orderCode = urlParams.get('orderCode');
  const status = urlParams.get('status');
  const payosCode = urlParams.get('code');
  const payosId = urlParams.get('id');
  const cancelFlag = urlParams.get('cancel');

  console.log('PaymentPage loaded with:', {
    pathname,
    search,
    billId,
    isSuccess,
    isCancel,
    orderCode,
    status,
    payosCode,
    payosId,
    cancelFlag
  });

  // Early return nếu không có billId
  if (!billId) {
    console.error('No billId found in params!');
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <ErrorMessage message="No billId found in URL params" />
        <Button onClick={() => navigate('/dashboard')} className="mt-4">
          {t('common.goBack')}
        </Button>
      </div>
    );
  }

    useEffect(() => {
    console.log('PaymentPage useEffect - fetchBill triggered');
    const fetchBill = async () => {
        try {
        setLoading(true);
        setError(null);
        console.log('Fetching bill info for billId:', billId);
        
        const response = await paymentService.getPaymentInfo(Number(billId));
        console.log('Bill info response:', response);
        
        if (!response.data) {
            throw new Error('No data returned from API');
        }
        
        // Gán dữ liệu bill từ response.data
        setBill({
            id: billId,
            amount: response.data.amount,
            status: response.data.status,
            created_at: response.data.createdAt,
            description: response.data.description,
            orderCode: response.data.orderCode
        });
        
        // Gán appointment (nếu có) hoặc null
        setAppointment(response.data.appointment || null);
        } catch (err: any) {
        console.error('Error fetching bill:', err.response?.data || err.message);
        setError(err.response?.data?.message || err.message || t('common.error'));
        } finally {
        setLoading(false);
        }
    };

    fetchBill();
    }, [billId, t]);

    useEffect(() => {
    console.log('PaymentPage useEffect - processPaymentCallback triggered');
    const processPaymentCallback = async () => {
        if (billId && (isSuccess || isCancel) && !paymentProcessed) {
        try {
            setPaymentProcessed(true);
            console.log('Processing payment callback:', { 
            isSuccess, isCancel, status, orderCode, payosCode, payosId, cancelFlag 
            });
            
            if (isSuccess && status === 'PAID' && cancelFlag === 'false') {
            await paymentService.updatePaymentStatus(Number(billId), 'success', {
                orderCode,
                status,
                payosCode,
                payosId
            });
            message.success(t('payment.paymentSuccess'));
            } else if (isCancel || cancelFlag === 'true') {
            await paymentService.updatePaymentStatus(Number(billId), 'cancel', {
                orderCode,
                status,
                payosCode,
                payosId
            });
            message.error(t('payment.paymentCancelled'));
            }
            
            // Refresh bill và appointment data
            setTimeout(async () => {
            try {
                console.log('Refreshing bill data...');
                const response = await paymentService.getPaymentInfo(Number(billId));
                setBill({
                id: billId,
                amount: response.data.amount,
                status: response.data.status,
                created_at: response.data.createdAt,
                description: response.data.description,
                orderCode: response.data.orderCode
                });
                setAppointment(response.data.appointment || null);
            } catch (error) {
                console.error('Error refreshing bill data:', error);
                setError(error.response?.data?.message || error.message || t('payment.callbackError'));
            }
            }, 1000);
        } catch (error: any) {
            console.error('Error processing payment callback:', error.response?.data || error.message);
            if (error.response?.status === 405) {
            console.warn('Method not allowed. Check backend endpoint /transactions/<bill_id>/success/');
            setTimeout(async () => {
                try {
                const response = await paymentService.getPaymentInfo(Number(billId));
                setBill({
                    id: billId,
                    amount: response.data.amount,
                    status: response.data.status,
                    created_at: response.data.createdAt,
                    description: response.data.description,
                    orderCode: response.data.orderCode
                });
                setAppointment(response.data.appointment || null);
                } catch (refreshError) {
                setError(refreshError.response?.data?.message || refreshError.message || t('payment.callbackError'));
                }
            }, 2000);
            } else {
            setError(error.response?.data?.message || error.message || t('payment.callbackError'));
            }
        }
        }
    };

    processPaymentCallback();
    }, [billId, isSuccess, isCancel, status, orderCode, payosCode, payosId, cancelFlag, paymentProcessed, t]);

  const handlePay = async () => {
    try {
      const response = await paymentService.createPaymentLink(Number(billId));
      if (response) {
        window.location.href = response;
      } else {
        message.error(t('payment.noPaymentLink'));
      }
    } catch (err: any) {
      message.error(t('payment.createPaymentLinkFailed'));
    }
  };

  const handleCancel = () => {
    navigate('/appointments');
  };

  const handleReturnToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <ErrorMessage message={error} />
        <div className="flex justify-center mt-4">
          <Button onClick={handleCancel} className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-3 rounded-lg">
            {t('common.goBack')}
          </Button>
        </div>
      </div>
    );
  }

  if (!bill || !appointment) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <ErrorMessage message={t('payment.billNotFound')} />
        <div className="flex justify-center mt-4">
          <Button onClick={handleCancel} className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-3 rounded-lg">
            {t('common.goBack')}
          </Button>
        </div>
      </div>
    );
  }

  const isPaid = bill.status === 'S' || bill.status === 'PAID';
  const isCancelled = bill.status === 'C' || bill.status === 'CANCELLED';

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      {/* Debug info */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <strong>Debug Info:</strong>
        <br />billId: {billId}
        <br />pathname: {pathname}
        <br />isSuccess: {String(isSuccess)}
        <br />isCancel: {String(isCancel)}
        <br />PayOS status: {status}
        <br />Bill status: {bill.status}
        <br />Order Code: {orderCode}
      </div>

      <Card className="shadow-lg border border-gray-200 rounded-lg">
        <CardHeader className={`text-white rounded-t-lg p-6 ${
          isPaid ? 'bg-gradient-to-r from-green-500 to-green-700' 
          : isCancelled ? 'bg-gradient-to-r from-red-500 to-red-700'
          : 'bg-gradient-to-r from-yellow-500 to-yellow-700'
        }`}>
          <CardTitle className="text-2xl font-bold text-center">
            {isPaid ? t('payment.successTitle') 
            : isCancelled ? t('payment.cancelTitle') 
            : t('payment.paymentTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Thông tin đặt lịch khám */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-inner space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">
              {t('appointment.details')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-600">{t('appointment.id')}:</span>
                <p className="text-gray-900 font-medium">{appointment.id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">{t('appointment.doctor')}:</span>
                <p className="text-gray-900 font-medium">{appointment.doctorInfo?.fullName || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">{t('appointment.date')}:</span>
                <p className="text-gray-900 font-medium">{new Date(appointment.date).toLocaleDateString('vi-VN')}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">{t('appointment.time')}:</span>
                <p className="text-gray-900 font-medium">
                  {appointment.slot_start ? `${appointment.slot_start.substring(0, 5)} - ${appointment.slot_end?.substring(0, 5) || ''}` : 'N/A'}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">{t('appointment.status')}:</span>
                <p className="text-yellow-600 font-semibold">{appointment.status || 'PENDING'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">{t('appointment.patient')}:</span>
                <p className="text-gray-900 font-medium">
                  {appointment.patientInfo ? `${appointment.patientInfo.first_name} ${appointment.patientInfo.last_name}` : 'N/A'}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">{t('appointment.session')}:</span>
                <p className="text-gray-900 font-medium">
                  {appointment.schedule?.shift === 'M' ? t('appointment.session.morning') 
                  : appointment.schedule?.shift === 'A' ? t('appointment.session.afternoon') 
                  : appointment.schedule?.shift || 'N/A'}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">{t('payment.amount')}:</span>
                <p className="text-gray-900 font-medium">{appointment.doctorInfo?.price?.toLocaleString('vi-VN') || 'N/A'} VND</p>
              </div>
            </div>
            {appointment.symptoms && (
              <div className="mt-4">
                <span className="font-medium text-gray-600">{t('appointment.symptoms')}:</span>
                <p className="text-gray-900 mt-2 p-3 bg-blue-50 rounded-lg">{appointment.symptoms}</p>
              </div>
            )}
            {appointment.schedule && (
              <div className="mt-4">
                <span className="font-medium text-gray-600">{t('appointment.location')}:</span>
                <p className="text-gray-900 mt-2">
                  <span className="font-medium">Room {appointment.schedule.room}</span>
                  {appointment.schedule.floor && ` - Floor ${appointment.schedule.floor}`}
                  {appointment.schedule.building && ` - Building ${appointment.schedule.building}`}
                </p>
                <p className="text-sm text-gray-500">
                  {t('appointment.scheduleTime', { 
                    start: appointment.schedule.start_time?.substring(0, 5), 
                    end: appointment.schedule.end_time?.substring(0, 5) 
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Thông tin thanh toán */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-inner space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">
              {t('payment.billDetails')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-600">{t('payment.billId')}:</span>
                <p className="text-gray-900 font-medium">{bill.id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">{t('payment.amount')}:</span>
                <p className="text-gray-900 font-medium">{bill.amount?.toLocaleString('vi-VN')} VND</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">{t('payment.status')}:</span>
                <p className={`font-semibold ${
                  isPaid ? 'text-green-600' : isCancelled ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {isPaid ? t('payment.statusPaid') 
                  : isCancelled ? t('payment.statusCancelled') 
                  : t('payment.statusPending')}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">{t('payment.date')}:</span>
                <p className="text-gray-900 font-medium">{new Date(bill.created_at).toLocaleDateString('vi-VN')}</p>
              </div>
              {orderCode && (
                <div>
                  <span className="font-medium text-gray-600">Order Code:</span>
                  <p className="text-gray-900 font-medium">{orderCode}</p>
                </div>
              )}
              {payosId && (
                <div>
                  <span className="font-medium text-gray-600">PayOS ID:</span>
                  <p className="text-gray-900 font-medium">{payosId}</p>
                </div>
              )}
            </div>
            {bill.bill_details && bill.bill_details.length > 0 && (
              <div className="mt-4">
                <span className="font-medium text-gray-600">{t('payment.billDetailsList')}:</span>
                <ul className="mt-2 space-y-2">
                  {bill.bill_details.map((detail: any) => (
                    <li key={detail.id} className="bg-white p-3 rounded-lg shadow-sm">
                      <p>{t(`serviceType.${detail.item_type}`)} - {detail.quantity} x {detail.unit_price.toLocaleString('vi-VN')} VND</p>
                      <p className="text-sm text-gray-500">Total: {detail.total_price.toLocaleString('vi-VN')} VND</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {isPaid ? (
            <div className="space-y-4">
              <div className="text-center text-green-600 font-semibold text-lg">
                ✅ {t('payment.paymentSuccess')}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleReturnToDashboard}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  {t('common.returnToDashboard')}
                </Button>
                <Button
                  onClick={() => navigate('/appointments')}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  {t('appointment.viewAppointments')}
                </Button>
              </div>
            </div>
          ) : isCancelled ? (
            <div className="space-y-4">
              <div className="text-center text-red-600 font-semibold text-lg">
                ❌ {t('payment.paymentCancelled')}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handlePay}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  {t('payment.tryAgain')}
                </Button>
                <Button
                  onClick={handleCancel}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-3 rounded-lg font-semibold"
                >
                  {t('common.goBack')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handlePay}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 ease-in-out"
              >
                {t('payment.payNow')}
              </Button>
              <Button
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-3 rounded-lg font-semibold transition duration-200 ease-in-out"
              >
                {t('payment.cancel')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPage;