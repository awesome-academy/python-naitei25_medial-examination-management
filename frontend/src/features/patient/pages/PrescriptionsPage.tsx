import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { prescriptionService } from '../../../shared/services/prescriptionService';
import { patientService } from '../../../shared/services/patientService';
import { useAuth } from '../../../shared/context/AuthContext';
import LoadingSpinner from '../../../shared/components/common/LoadingSpinner';
import ErrorMessage from '../../../shared/components/common/ErrorMessage';
import { FileText, Download } from 'lucide-react';

interface Prescription {
  id: number;
  created_at: string;
  diagnosis: string;
  prescription_details?: Array<{ id: number }>;
}

const PrescriptionsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getCurrentUserId } = useAuth();

  const [prescriptions, setPrescriptions] = React.useState<Prescription[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const cardsPerPage = 9;

  // Tính toán slice dữ liệu
  const totalPages = Math.ceil(prescriptions.length / cardsPerPage);
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = prescriptions.slice(indexOfFirstCard, indexOfLastCard);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = getCurrentUserId();
        if (!userId) {
          setError(t('common.noUserId'));
          setLoading(false);
          return;
        }
        setLoading(true);
        const patient = await patientService.getPatientByUserId(userId);
        const data = await prescriptionService.getPrescriptionsByPatient(patient.id);
        setPrescriptions(data);
      } catch (err: any) {
        setError(err.message || t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getCurrentUserId, t]);

  const handleViewDetails = (id: number) => {
    navigate(`/patient/prescriptions/${id}`);
  };

  const handleDownloadPdf = async (id: number) => {
    try {
      const pdfUrl = await prescriptionService.downloadPrescriptionPdf(id);
      window.open(pdfUrl, '_blank');
    } catch (err) {
      setError(t('common.downloadFailed'));
    }
  };

  // Hàm tạo danh sách số trang rút gọn
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 1; // số trang hiển thị quanh trang hiện tại

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (currentPage > maxVisible + 2) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - maxVisible);
      const end = Math.min(totalPages - 1, currentPage + maxVisible);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - (maxVisible + 1)) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  if (loading) return <LoadingSpinner message={t('common.loading')} />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold text-blue-600">{t('navigation.prescriptions')}</h1>
      {currentCards.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentCards.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <h2 className="text-lg font-semibold">
                      {t('prescription.prescriptionId', { id: p.id })}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">
                    {t('prescription.createdAt')}: {new Date(p.created_at).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">
                    {t('prescription.diagnosis')}: {p.diagnosis || t('common.noDiagnosis')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('prescription.detailsCount')}: {p.prescription_details?.length ?? 0}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleViewDetails(p.id)}
                    className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
                  >
                    {t('common.viewDetails')}
                  </button>
                  <button
                    onClick={() => handleDownloadPdf(p.id)}
                    className="flex items-center justify-center w-12 h-10 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-6 space-x-2">
            {getPageNumbers().map((page, index) =>
              page === '...' ? (
                <span key={index} className="px-3 py-2 text-gray-500">...</span>
              ) : (
                <button
                  key={index}
                  onClick={() => setCurrentPage(page as number)}
                  className={`px-4 py-2 rounded-lg border ${
                    currentPage === page
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">{t('common.noPrescriptionsFound')}</p>
        </div>
      )}
    </div>
  );
};

export default PrescriptionsPage;
