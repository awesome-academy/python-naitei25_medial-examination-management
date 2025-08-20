"use client"

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { departmentService } from '../../../shared/services/departmentService';
import SearchBar from '../components/form/SearchBar';
import DoctorCard from '../components/common/DoctorCard';
import LoadingSpinner from '../../../shared/components/common/LoadingSpinner';
import ErrorMessage from '../../../shared/components/common/ErrorMessage';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Filter } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const DepartmentDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { data: department, loading: deptLoading, error: deptError } = useApi(
    () => departmentService.getDepartmentById(Number(id)),
    [id]
  );
  const { data: doctors, loading: doctorsLoading, error: doctorsError } = useApi(
    () => departmentService.getDoctorsByDepartmentId(Number(id)),
    [id]
  );

  const filteredAndSortedDoctors = React.useMemo(() => {
    let result = doctors?.filter(doctor =>
      `${doctor.first_name} ${doctor.last_name}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (sortOrder !== 'none') {
      result = result.sort((a, b) => {
        const priceA = a.price ?? 0;
        const priceB = b.price ?? 0;
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      });
    }

    return result;
  }, [doctors, searchQuery, sortOrder]);

  // 👉 Pagination logic
  const totalPages = Math.ceil(filteredAndSortedDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDoctors = filteredAndSortedDoctors.slice(startIndex, startIndex + itemsPerPage);

  const handleDoctorClick = (doctorId: number) => {
    navigate(`/patient/doctors/${doctorId}`);
  };

  const handleBack = () => {
    navigate('/patient/book-appointment');
  };

  if (deptLoading || doctorsLoading) {
    return <LoadingSpinner message={t('common.loadingDoctors')} />;
  }

  if (deptError) {
    return <ErrorMessage message={deptError} />;
  }

  if (doctorsError) {
    return <ErrorMessage message={doctorsError} />;
  }

  if (!department) {
    return <ErrorMessage message={t('common.departmentNotFound')} />;
  }

  return (
    <div className="space-y-6">
      {/* Department Header */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{department.department_name}</h2>
          {department.description && (
            <p className="text-gray-600">{department.description}</p>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={() => {}}
        placeholder={t('common.searchDoctorsPlaceholder')}
        className="w-full max-w-2xl"
      />

      {/* Filter Section */}
      <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            {t('common.filters')}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 p-4 bg-white rounded-lg shadow-md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.sortByPrice')}
              </label>
              <Select
                value={sortOrder}
                onValueChange={(value: 'asc' | 'desc' | 'none') => setSortOrder(value)}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('common.none')}</SelectItem>
                  <SelectItem value="asc">{t('common.priceLowToHigh')}</SelectItem>
                  <SelectItem value="desc">{t('common.priceHighToLow')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Results Count */}
      <p className="text-gray-600">
        {searchQuery
          ? `${filteredAndSortedDoctors.length} ${t('common.searchResults')}`
          : `${doctors?.length || 0} ${t('common.doctorsInDepartment')}`}
      </p>

      {/* Doctors Grid */}
      {currentDoctors.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onClick={handleDoctorClick}
                className="hover:shadow-lg transition-shadow duration-200"
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center mt-10 gap-2 flex-wrap">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              {t("common.prev")}
            </Button>

            {/* page numbers */}
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i + 1}
                variant={currentPage === i + 1 ? "default" : "outline"}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}

            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              {t("common.next")}
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? t('common.noDoctorsFound')
              : t('common.noDoctorsInDepartment')}
          </p>
          <Button variant="outline" onClick={handleBack}>
            {t('common.goBack')}
          </Button>
        </div>
      )}

      {/* Floating Action Button (Mobile Only) */}
      <div className="fixed bottom-4 right-4 sm:hidden">
        <Button
          variant="default"
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={handleBack}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default DepartmentDetailPage;
