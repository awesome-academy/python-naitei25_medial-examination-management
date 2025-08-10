import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { prescriptionService } from '../../../shared/services/prescriptionService';
import LoadingSpinner from '../../../shared/components/common/LoadingSpinner';
import ErrorMessage from '../../../shared/components/common/ErrorMessage';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Pill, Download } from 'lucide-react';

interface PrescriptionDetail {
  id: number;
  prescription: number;
  medicine: { medicine_id: number; medicine_name: string };
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  prescription_notes?: string;
}

const PrescriptionDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [details, setDetails] = React.useState<PrescriptionDetail[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await prescriptionService.getPrescriptionDetails(Number(id));
        setDetails(data);
      } catch (err: any) {
        setError(err.message || t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, t]);

  const handleBack = () => navigate(-1);
  const handleDownloadPdf = async () => {
    try {
      const pdfUrl = await prescriptionService.downloadPrescriptionPdf(Number(id));
      window.open(pdfUrl, '_blank');
    } catch (err) {
      setError(t('common.downloadFailed'));
    }
  };

  if (loading) return <LoadingSpinner message={t('common.loading')} />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack}>
          <ChevronLeft className="mr-2 h-4 w-4" /> {t('common.goBack')}
        </Button>
        <Button variant="outline" onClick={handleDownloadPdf}>
          <Download className="mr-2 h-4 w-4" /> {t('common.downloadPdf')}
        </Button>
      </div>

      <h1 className="text-2xl font-bold text-blue-600">
        {t('common.prescriptionId')}: {id}
      </h1>

      <h2 className="text-xl font-semibold mt-6">{t('common.medicineList')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {details.length ? (
          details.map((detail) => (
            <div
              key={detail.id}
              className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <Pill className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold">{detail.medicine.medicine_name}</h3>
              </div>
              <p className="text-gray-600">{t('common.dosage')}: {detail.dosage}</p>
              <p className="text-gray-600">{t('common.frequency')}: {detail.frequency}</p>
              <p className="text-gray-600">{t('common.duration')}: {detail.duration}</p>
              <p className="text-gray-600">{t('common.quantity')}: {detail.quantity}</p>
              {detail.prescription_notes && (
                <p className="text-gray-600">{t('common.notes')}: {detail.prescription_notes}</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-600">{t('common.noMedicinesFound')}</p>
        )}
      </div>
    </div>
  );
};

export default PrescriptionDetailPage;
