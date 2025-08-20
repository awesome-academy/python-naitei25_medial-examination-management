import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DepartmentCard from '../components/common/Doctor/DepartmentCard';
import SearchBar from '../components/form/SearchBar';
import { useApi } from '../hooks/useApi';
import { departmentService } from '../../../shared/services/departmentService';
import LoadingSpinner from '../../../shared/components/common/LoadingSpinner';
import ErrorMessage from '../../../shared/components/common/ErrorMessage';
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const DepartmentListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'nameAsc' | 'nameDesc'>('nameAsc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { data: departments, loading, error } = useApi(() => departmentService.getDepartments(), []);

  const filteredDepartments = useMemo(() => {
    let result = departments || [];

    // Filter
    if (searchQuery.trim()) {
      result = result.filter((department) =>
        department.department_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortOption === 'nameAsc') {
      result = [...result].sort((a, b) => a.department_name.localeCompare(b.department_name));
    } else if (sortOption === 'nameDesc') {
      result = [...result].sort((a, b) => b.department_name.localeCompare(a.department_name));
    }

    return result;
  }, [departments, searchQuery, sortOption]);

  // Pagination
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDepartmentClick = (id: number) => {
    navigate(`/patient/departments/${id}/doctors`);
  };

  if (loading) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">{t('common.departmentList')}</h2>
        <SearchBar 
          value={searchQuery} 
          onChange={setSearchQuery}
          onSearch={() => {}}
          placeholder={t('common.searchDepartmentsPlaceholder')}
        />
      </div>

      {/* Stats + Sort */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {searchQuery
            ? `${filteredDepartments.length} ${t('common.searchResults')}`
            : `${departments?.length || 0} ${t('common.department')}`}
        </p>

        <Select value={sortOption} onValueChange={(v: 'nameAsc' | 'nameDesc') => setSortOption(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("common.sort")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nameAsc">{t("common.sortAZ")}</SelectItem>
            <SelectItem value="nameDesc">{t("common.sortZA")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Departments Grid */}
      {paginatedDepartments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {paginatedDepartments.map((department) => (
            <DepartmentCard
              key={department.id}
              department={department}
              onClick={handleDepartmentClick}
              showDoctorCount={false}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">
            {searchQuery ? t('common.noDepartmentsFound') : t('common.noDepartmentsAvailable')}
          </p>
        </div>
      )}

      {/* Pagination */}
{/* Pagination */}
{totalPages > 1 && (
  <div className="flex flex-col items-center gap-4 mt-10">
    {/* Info */}
    <p className="text-sm text-gray-600">
      {t("common.pageInfo", {
        currentPage,
        totalPages,
        start: (currentPage - 1) * itemsPerPage + 1,
        end: Math.min(currentPage * itemsPerPage, filteredDepartments.length),
        total: filteredDepartments.length,
      })}
    </p>

    {/* Controls */}
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage((p) => p - 1)}
      >
        {t("common.prev")}
      </Button>

      {[...Array(totalPages)].map((_, i) => (
        <Button
          key={i}
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
  </div>
)}

    </div>
  );
};

export default DepartmentListPage;
