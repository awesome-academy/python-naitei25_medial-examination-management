import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { message } from 'antd';
import { appointmentService } from '../../../shared/services/appointmentService';
import { paymentService } from '../../../shared/services/paymentService';
import LoadingSpinner from '../../../shared/components/common/LoadingSpinner';
import ErrorMessage from '../../../shared/components/common/ErrorMessage';

const AppointmentConfirmationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const doctorId = Number(params.get('doctorId'));
  const date = params.get('date');
  const time = params.get('time');
  const appointmentId = Number(params.get('appointmentId'));

  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        setError(null);
        if (appointmentId) {
          const data = await appointmentService.getAppointmentById(appointmentId);
          console.log('Appointment data:', data); // Log để debug
          setAppointment(data);
        } else {
          throw new Error(t('appointment.invalidId'));
        }
      } catch (err: any) {
        console.error('Error fetching appointment:', err.response?.data || err.message);
        setError(err.response?.data?.error || err.message || t('common.error'));
        if (appointmentId) {
          setAppointment({
            id: appointmentId,
            status: 'PENDING',
            symptoms: '',
            notes: '',
            doctorInfo: { fullName: 'Loading...' }
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId, t]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      if (!appointment || !appointment.id || !appointment.doctorInfo || !appointment.doctorInfo.price) {
        throw new Error(t('appointment.invalidAppointmentData'));
      }
      await appointmentService.updateAppointment(appointmentId, { status: 'C' });
      const bill = await paymentService.createBillFromAppointment(appointment);
      console.log('Bill created:', bill);
      const paymentUrl = await paymentService.createPaymentLink(bill.id);
      console.log('Payment URL:', paymentUrl);
      window.location.href = paymentUrl;
    } catch (error: any) {
      console.error('Error during confirmation:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || error.message || t('common.error');
      message.error(errorMsg);
      setError(errorMsg);
    } finally {
      setConfirming(false);
    }
  };

  const handleBackToDoctor = () => {
    navigate(`/doctors/${doctorId}`);
  };

  if (loading) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <ErrorMessage message={error} />
        <div className="flex justify-center mt-4">
          <Button
            onClick={handleBackToDoctor}
            className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-3 rounded-lg"
          >
            {t('common.goBack')}
          </Button>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <ErrorMessage message={t('appointment.invalidId')} />
        <div className="flex justify-center mt-4">
          <Button
            onClick={handleBackToDoctor}
            className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-3 rounded-lg"
          >
            {t('common.goBack')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card className="shadow-lg border border-gray-200 rounded-lg">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-t-lg p-6">
          <CardTitle className="text-2xl font-bold text-center">
            {t('appointment.confirmationTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
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
                <p className="text-gray-900 font-medium">{date || new Date(appointment.date).toLocaleDateString('vi-VN')}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">{t('appointment.time')}:</span>
                <p className="text-gray-900 font-medium">
                  {appointment.slot_start ? `${appointment.slot_start.substring(0, 5)} - ${appointment.slot_end?.substring(0, 5) || ''}` : time || 'N/A'}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">{t('appointment.status')}:</span>
                <p className="text-yellow-600 font-semibold">{appointment.status === 'P' ? 'PENDING' : appointment.status}</p>
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
                  {appointment.schedule?.shift === 'M' ? t('appointment.session.morning') : appointment.schedule?.shift === 'A' ? t('appointment.session.afternoon') : appointment.schedule?.shift || 'N/A'}
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
                  {t('appointment.scheduleTime', { start: appointment.schedule.start_time?.substring(0, 5), end: appointment.schedule.end_time?.substring(0, 5) })}
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleConfirm}
              disabled={confirming || appointment.status !== 'P'}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 ease-in-out disabled:bg-green-400 disabled:cursor-not-allowed"
            >
              {confirming ? t('common.processing') : t('appointment.confirmAndPay')}
            </Button>
            <Button
              onClick={handleBackToDoctor}
              className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-3 rounded-lg font-semibold transition duration-200 ease-in-out"
            >
              {t('common.goBack')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentConfirmationPage;