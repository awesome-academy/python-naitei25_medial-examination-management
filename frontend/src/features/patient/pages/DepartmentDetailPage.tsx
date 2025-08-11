"use client"

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { departmentService } from '../../../shared/services/departmentService';
import type { DepartmentDetail } from '../../../shared/types/department';
import type { Doctor } from '../../../shared/types/doctor';
import SearchBar from '../components/form/SearchBar';
import DoctorCard from '../components/common/DoctorCard';
import LoadingSpinner from '../../../shared/components/common/LoadingSpinner';
import ErrorMessage from '../../../shared/components/common/ErrorMessage';
import { useTranslation } from 'react-i18next';

const DepartmentDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: department, loading: deptLoading, error: deptError } = useApi(
    () => departmentService.getDepartmentById(Number(id)),
    [id]
  );
  const { data: doctors, loading: doctorsLoading, error: doctorsError } = useApi(
    () => departmentService.getDoctorsByDepartmentId(Number(id)),
    [id]
  );

  console.log('Department:', department);
  console.log('Doctors:', doctors);
  console.log('Loading:', deptLoading, doctorsLoading);
  console.log('Error:', deptError, doctorsError);

  const filteredDoctors = doctors?.filter(doctor =>
    `${doctor.first_name} ${doctor.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDoctorClick = (doctorId: number) => {
    navigate(`/patient/doctors/${doctorId}`);
  };

  const handleSearch = () => {
    // Search is handled by filtering, no need for navigation
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
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">{department.department_name}</h2>
        {department.description && (
          <p className="text-gray-600">{department.description}</p>
        )}
        <SearchBar 
          value={searchQuery} 
          onChange={setSearchQuery}
          onSearch={handleSearch}
          placeholder={t('common.searchDoctorsPlaceholder')}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {searchQuery 
            ? `${filteredDoctors.length} ${t('common.searchResults')}`
            : `${doctors?.length || 0} ${t('common.doctorsInDepartment')}`}
        </p>
      </div>
      {filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onClick={handleDoctorClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">
            {searchQuery 
              ? t('common.noDoctorsFound')
              : t('common.noDoctorsInDepartment')}
          </p>
        </div>
      )}
    </div>
  );
};

export default DepartmentDetailPage;