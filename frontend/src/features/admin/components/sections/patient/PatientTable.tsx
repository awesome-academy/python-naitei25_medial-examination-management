"use client";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import SearchInput from "../../common/SearchInput";
import Badge from "../../ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { DeleteConfirmationModal } from "../../ui/modal/DeleteConfirmationModal";
import { patientService } from "../../../services/patientService";
import type { Patient } from "../../../types/patient";
import { format } from "date-fns";
import { Pagination } from "../../ui/Pagination";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 10;

export default function PatientTable() {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Enhanced filter and sort state
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "birthday" | "createdAt" | "gender">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchField, setSearchField] = useState<"all" | "name" | "phone" | "email" | "identity" | "insurance">("all");
  const navigate = useNavigate();

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await patientService.getAllPatients();
      setPatients(data);
      setFilteredPatients(data);
    } catch (err) {
      console.error("API error:", err);
      setPatients([]);
      setFilteredPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleView = (patientId: number) => {
    navigate(`/admin/patients/${patientId}`);
  };

  const handleDelete = (patientId: number) => {
    setPatientToDelete(patientId);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (patientToDelete === null) return;
    try {
      await patientService.deletePatient(patientToDelete);
      const updatedPatients = patients.filter((patient) => patient.patientId !== patientToDelete);
      setPatients(updatedPatients);
      // Filters will be applied automatically via useEffect
      // Hiển thị thông báo thành công
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      console.error("Error deleting patient:", err);
    } finally {
      setModalOpen(false);
      setPatientToDelete(null);
    }
  };

  // Apply comprehensive filters and sorting
  const applyFiltersAndSort = () => {
    let filtered = [...patients];
    
    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(patient => {
        switch (searchField) {
          case "name":
            return patient.fullName.toLowerCase().includes(searchLower);
          case "phone":
            return patient.phone?.toLowerCase().includes(searchLower);
          case "email":
            return patient.email?.toLowerCase().includes(searchLower);
          case "identity":
            return patient.identityNumber.includes(searchTerm);
          case "insurance":
            return patient.insuranceNumber?.includes(searchTerm);
          default: // "all"
            return (
              patient.fullName.toLowerCase().includes(searchLower) ||
              patient.identityNumber.includes(searchTerm) ||
              (patient.insuranceNumber && patient.insuranceNumber.includes(searchTerm)) ||
              (patient.phone && patient.phone.toLowerCase().includes(searchLower)) ||
              (patient.email && patient.email.toLowerCase().includes(searchLower))
            );
        }
      });
    }
    
    // Gender filter
    if (genderFilter) {
      filtered = filtered.filter(patient => patient.gender === genderFilter);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;
      if (sortBy === "name") {
        compareValue = a.fullName.localeCompare(b.fullName);
      } else if (sortBy === "birthday") {
        compareValue = new Date(a.birthday).getTime() - new Date(b.birthday).getTime();
      } else if (sortBy === "createdAt") {
        compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "gender") {
        compareValue = a.gender.localeCompare(b.gender);
      }
      return sortOrder === "asc" ? compareValue : -compareValue;
    });
    
    setFilteredPatients(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Apply filters whenever any filter criteria changes
  useEffect(() => {
    applyFiltersAndSort();
  }, [patients, searchTerm, searchField, genderFilter, sortBy, sortOrder]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      applyFiltersAndSort();
    } catch (err) {
      setFilteredPatients([]);
      console.error("Error during search:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate pagination values
  const totalItems = filteredPatients.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );


  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] px-3">
      <div className="flex justify-start items-center px-5 pt-5">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("patientTable.title")}
        </h2>
        <span className="ml-5 text-sm bg-base-600/20 text-base-600 py-1 px-4 rounded-full font-bold">
          {t("patientTable.totalPatients", { count: totalItems })}
        </span>
      </div>
      {loading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-base-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {t("patientTable.loading")}
          </p>
        </div>
      )}
      {!loading && (
        <>
          {/* Enhanced Search and Filter Controls */}
          <div className="p-4 space-y-4">
            {/* Search Controls */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[300px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("patientTable.search")}
                </label>
                <SearchInput
                  inputRef={inputRef}
                  placeholder={t("patientTable.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
              </div>
              
              <div className="min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("patientTable.searchIn")}
                </label>
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value as typeof searchField)}
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{t("patientTable.allFields")}</option>
                  <option value="name">{t("patientTable.name")}</option>
                  <option value="phone">{t("patientTable.phone")}</option>
                  <option value="email">{t("patientTable.email")}</option>
                  <option value="identity">{t("patientTable.identity")}</option>
                  <option value="insurance">{t("patientTable.insurance")}</option>
                </select>
              </div>
              
              <button
                className="h-11 px-6 rounded-lg bg-base-700 text-white text-sm font-medium shadow-theme-xs hover:bg-base-600 focus:outline-hidden focus:ring-3 focus:ring-base-600/50"
                onClick={handleSearch}
              >
                {t("common.search")}
              </button>
            </div>
            
            {/* Filter and Sort Controls */}
            <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-3 rounded-lg">
              {/* Gender Filter */}
              <div className="min-w-[120px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("patientTable.gender")}
                </label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t("common.all")}</option>
                  <option value="MALE">{t("gender.male")}</option>
                  <option value="FEMALE">{t("gender.female")}</option>
                  <option value="OTHER">{t("gender.other")}</option>
                </select>
              </div>
              
              {/* Sort By */}
              <div className="min-w-[140px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("patientTable.sortBy")}
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">{t("patientTable.name")}</option>
                  <option value="birthday">{t("patientTable.birthday")}</option>
                  <option value="createdAt">{t("patientTable.createdAt")}</option>
                  <option value="gender">{t("patientTable.gender")}</option>
                </select>
              </div>
              
              {/* Sort Order */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSortOrder("asc")}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    sortOrder === "asc"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {t("patientTable.asc")}
                </button>
                <button
                  onClick={() => setSortOrder("desc")}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    sortOrder === "desc"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {t("patientTable.desc")}
                </button>
              </div>
              
              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSearchField("all");
                  setGenderFilter("");
                  setSortBy("name");
                  setSortOrder("asc");
                }}
                className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {t("patientTable.clearFilters")}
              </button>
            </div>
            
            {/* Results Summary */}
            {(searchTerm || genderFilter) && (
              <div className="text-sm text-gray-600">
                {t("patientTable.showing", { count: filteredPatients.length, total: patients.length })}
                {searchTerm && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {t("patientTable.searchTag", { term: searchTerm })}
                  </span>
                )}
                {genderFilter && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    {t("patientTable.genderTag", { gender: genderFilter })}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-6 py-3 font-medium text-slate-500 text-start text-theme-sm dark:text-slate-400"
                  >
                    {t("patientTable.name")}
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 font-medium text-slate-500 text-start text-theme-sm dark:text-slate-400"
                  >
                    {t("patientTable.identity")}
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 font-medium text-slate-500 text-start text-theme-sm dark:text-slate-400"
                  >
                    {t("patientTable.insurance")}
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 font-medium text-slate-500 text-start text-theme-sm dark:text-slate-400"
                  >
                    {t("patientTable.phone")}
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 font-medium text-slate-500 text-start text-theme-sm dark:text-slate-400"
                  >
                    {t("patientTable.email")}
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 font-medium text-slate-500 text-start text-theme-sm dark:text-slate-400"
                  >
                    {t("patientTable.gender")}
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-4 py-3 font-medium text-slate-500 text-start text-theme-sm dark:text-slate-400"
                  >
                    {t("patientTable.birthday")}
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 font-medium text-slate-500 text-start text-theme-sm dark:text-slate-400"
                  >
                    {t("patientTable.actions")}
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {paginatedPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                      {t("patientTable.noResults")}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPatients.map((patient) => (
                  <TableRow key={patient.patientId}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {patient.fullName}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {patient.identityNumber}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {patient.insuranceNumber}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {patient.phone}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {patient.email || t("common.notAvailable")}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <Badge
                        size="sm"
                        color={
                          patient.gender === "MALE"
                            ? "success"
                            : patient.gender === "FEMALE"
                            ? "warning"
                            : "error"
                        }
                      >
                        {patient.gender === "MALE"
                          ? t("gender.male")
                          : patient.gender === "FEMALE"
                          ? t("gender.female")
                          : t("gender.other")}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {format(new Date(patient.birthday), "dd-MM-yyyy")}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-md dark:text-gray-400">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(patient.patientId)}
                          className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-blue-200 transition-colors dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {t("common.view")}
                        </button>
                        <button
                          onClick={() => handleDelete(patient.patientId)}
                          className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {t("common.delete")}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={PAGE_SIZE}
                totalItems={totalItems}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
          {/* Thông báo thành công */}
          {showSuccessMessage && (
            <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {t("patientTable.deleteSuccess")}
            </div>
          )}
          <DeleteConfirmationModal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            onConfirm={handleConfirmDelete}
            title={t("patientTable.confirmDeleteTitle")}
            message={t("patientTable.confirmDeleteMessage")}
          />
        </>
      )}
    </div>
  );
}
