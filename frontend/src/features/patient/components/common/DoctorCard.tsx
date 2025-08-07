import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Stethoscope } from 'lucide-react';
import type { Doctor } from '../../../../shared/types/doctor';
import { ACADEMIC_DEGREE_LABELS } from '../../../../shared/types/doctor';

interface DoctorCardProps {
  doctor: Doctor & { avatar?: string; price?: number };
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const avatarUrl = doctor.avatar || 'https://via.placeholder.com/300x150';
  const formatPrice = (price?: number) => {
    if (!price) return t('common.priceNotAvailable');
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const goToBooking = () => {
    navigate(`/patient/doctors/${doctor.id}?book=true`);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow duration-200 border border-gray-200"
      onClick={goToBooking}   // 🔹 Chuyển thẳng sang trang đặt lịch
    >
      <CardHeader className="p-0">
        <div 
          className="h-32 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${avatarUrl})` }}
          role="img"
          aria-label={`${doctor.first_name} ${doctor.last_name} avatar`}
        />
      </CardHeader>
      <CardContent className="pt-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
            BS. {doctor.first_name} {doctor.last_name}
          </CardTitle>
          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
        </div>
        <CardDescription className="text-sm text-gray-600 line-clamp-2 mb-2">
          {t('common.specialization')}: {doctor.specialization}
        </CardDescription>
        <div className="flex items-center justify-center text-sm text-cyan-600 mb-2">
          <Stethoscope className="h-4 w-4 mr-1" />
          <span>{ACADEMIC_DEGREE_LABELS[doctor.academic_degree] || doctor.academic_degree}</span>
        </div>
        <div className="text-sm text-gray-600 mb-3">
          {t('common.price')}: {formatPrice(doctor.price)}
        </div>
        <Button 
          onClick={(e) => {
            e.stopPropagation(); // tránh gọi onClick của Card
            goToBooking();
          }}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 rounded-lg"
        >
          {t('common.bookAppointment')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DoctorCard;
