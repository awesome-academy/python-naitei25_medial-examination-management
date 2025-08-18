"use client";
import MedicalRecord from "./MedicalRecord";
import AddMedicalRecordModal from "./AddMedicalRecordModal";
import EditMedicalRecordModal from "./EditMedicalRecordModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { format } from "date-fns";
import Badge from "../../ui/badge/Badge";
import type React from "react";
import { useState, useEffect } from "react";
import { patientService } from "../../../services/patientService";
import type {
  Patient,
  EmergencyContact,
  PatientUpdateDto,
  EmergencyContactDto,
} from "../../../types/patient";
import { useParams, useNavigate } from "react-router-dom";
import { appointmentService } from "../../../services/appointmentService";
import type {
  Appointment,
  AppointmentUpdateRequest,
} from "../../../types/appointment";
import type { Bill } from "../../../types/payment";
import { paymentService } from "../../../services/paymentService";
import type { ServiceOrder } from "../../../types/serviceOrder";
import { BillModal } from "./BillModal";
import type {
  PrescriptionResponse,
  UpdatePrescriptionRequest,
} from "../../../types/pharmacy";
import { pharmacyService } from "../../../services/pharmacyService";
import { DeleteConfirmationModal } from "../../ui/modal/DeleteConfirmationModal";
import { useModal } from "../../../hooks/useModal";
import { Loader2 } from "lucide-react";
import type { CreatePrescriptionRequest } from "../../../types/pharmacy";
import { AppointmentModal } from "./AppointmentModal";
import { getServiceOrdersByAppointmentId } from "../../../services/serviceOrderService";
import { servicesService } from "../../../services/servicesService";
import { Pagination } from "../../ui/Pagination";
import { useTranslation } from "react-i18next";
import { t } from "i18next";

export function MedicalRecordsContent() {
  const { t } = useTranslation();
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>(
    []
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPrescription, setSelectedPrescription] =
    useState<PrescriptionResponse | null>(null)

  const {
    isOpen: isAddModalOpen,
    openModal: openAddModal,
    closeModal: closeAddModal,
  } = useModal()
  const {
    isOpen: isEditModalOpen,
    openModal: openEditModal,
    closeModal: closeEditModal,
  } = useModal()
  const {
    isOpen: isDeleteConfirmModalOpen,
    openModal: openDeleteConfirmModal,
    closeModal: closeDeleteConfirmModal,
  } = useModal()
  const [deletingPrescriptionId, setDeletingPrescriptionId] = useState<number | null>(null)

  // Pagination state for medical records
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // 5 medical records per page

  // Filter, sort, and search state for medical records
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "diagnosis">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<PrescriptionResponse[]>([]);

  const fetchMedicalRecords = async () => {
    if (!patientId) {
      setError(t("patientDetail.medicalRecords.error.invalidPatientId"));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await pharmacyService.getPrescriptionHistoryByPatientId(Number(patientId))

      // Gắn quantity + lọc bỏ prescription/status cancel + lọc bỏ detail/status cancel
      const mappedData = data
        .map((prescription: any) => ({
          ...prescription,
          prescription_details:
            prescription.prescription_details
              ?.map((detail: any) => ({
                ...detail,
                quantity: detail.quantity !== undefined && detail.quantity !== null ? Number(detail.quantity) : 1,
              }))
              .filter((d: any) => d.status !== "cancel") ?? [],
        }))
        .filter((p: any) => p.status !== "cancel")

      setPrescriptions(mappedData)
    } catch (err) {
      console.error(t("patientDetail.medicalRecords.error.loadLog"), err);
      setError(t("patientDetail.medicalRecords.error.load"));
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicalRecords();
  }, [patientId]);

  const handleAddMedicalRecord = async (
    appointmentId: number,
    prescriptionData: CreatePrescriptionRequest
  ) => {
    try {
      const finalData = {
        ...prescriptionData,
        appointment_id: appointmentId,
        patient_id: Number(patientId),
      };

      await pharmacyService.createPrescription(finalData);
      await fetchMedicalRecords();
      closeAddModal();
    } catch (err) {
      console.error(t("patientDetail.medicalRecords.error.addLog"), err);
      alert(t("patientDetail.medicalRecords.error.add"));
    }
  };

  const handleEditMedicalRecord = (prescriptionId: number) => {
    const prescriptionToEdit = prescriptions.find((p) => p.id === prescriptionId)
    if (prescriptionToEdit) {
      setSelectedPrescription(prescriptionToEdit);
      openEditModal();
    } else {
      alert(t("patientDetail.medicalRecords.error.notFound"));
    }
  };

  const handleUpdateMedicalRecord = async (
    prescriptionId: number,
    data: UpdatePrescriptionRequest
  ) => {
    try {
      const finalData: UpdatePrescriptionRequest = {
        ...data,
        prescription_details: data.prescription_details?.map((detail: any) => ({
          id: detail.id ?? detail.detailId,
          medicine_id: detail.medicine?.medicineId ?? detail.medicine_id,
          dosage: detail.dosage,
          frequency: detail.frequency,
          duration: detail.duration,
          quantity: Number(detail.quantity),
          prescription_notes: detail.prescription_notes ?? "",
          status: detail.status ?? "active",
        })),
      }

      console.log("=== DEBUG UPDATE PAYLOAD ===", finalData)

      await pharmacyService.updatePrescription(prescriptionId, finalData)
      await fetchMedicalRecords()
      closeEditModal()
      alert(t("patientDetail.medicalRecords.success.update"))
    } catch (err) {
      console.error(t("patientDetail.medicalRecords.error.updateLog"), err);
      alert(t("patientDetail.medicalRecords.error.update"));
    }
  };

  const handleDeleteMedicalRecord = (prescriptionId: number) => {
    setDeletingPrescriptionId(prescriptionId);
    openDeleteConfirmModal();
  };

  const handleConfirmDeleteMedicalRecord = async () => {
    if (!deletingPrescriptionId) return;

    try {
      setPrescriptions((prev) =>
        prev
          .map((p) =>
            p.id === deletingPrescriptionId ? { ...p, status: "cancel" } : p
          )
          .filter((p) => p.status !== "cancel")
      )

      closeDeleteConfirmModal()
      alert(t("patientDetail.medicalRecords.success.delete"))
    } catch (err) {
      console.error("Lỗi khi xóa bệnh án:", err);
      alert(t("patientDetail.medicalRecords.error.delete"));
    }
  };

  // Filter, sort, and search logic for medical records
  const applyFiltersAndSort = () => {
    let filtered = [...prescriptions];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((prescription) =>
        prescription.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.prescriptionDetails?.some((detail) =>
          detail.medicine.medicineName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === "date") {
        compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "diagnosis") {
        compareValue = (a.diagnosis || "").localeCompare(b.diagnosis || "");
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    setFilteredPrescriptions(filtered);
    setCurrentPage(1);
  };

  // Apply filters when dependencies change
  useEffect(() => {
    applyFiltersAndSort();
  }, [prescriptions, searchTerm, sortBy, sortOrder]);

  return (
    <div className="font-outfit bg-white py-6 px-4 rounded-lg border border-gray-200">
      <div className="flex justify-between mb-4 ml-1">
        <h2 className="text-xl font-semibold">{t("patientDetail.medicalRecords.title")}</h2>
        <button
          className="flex items-center justify-center bg-base-700 py-2.5 px-5 rounded-lg text-white text-sm hover:bg-base-700/70"
          onClick={openAddModal}
        >
          {t("patientDetail.medicalRecords.add")}
          <span className="ml-2 text-lg">+</span>
        </button>
      </div>

      {/* Search, Filter, and Sort Controls */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder={t("patientDetail.medicalRecords.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "diagnosis")}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">{t('patientDetail.medicalRecords.sort.date')}</option>
              <option value="diagnosis">{t('patientDetail.medicalRecords.sort.diagnosis')}</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={sortOrder === "asc" ? t('patientDetail.medicalRecords.sort.toDesc') : t('patientDetail.medicalRecords.sort.toAsc')}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600">
          {t('patientDetail.medicalRecords.resultsCount', { shown: filteredPrescriptions.length, total: prescriptions.length })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> {t('patientDetail.medicalRecords.loading')}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
            <button
              onClick={fetchMedicalRecords}
              className="mt-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm.trim() ? t('patientDetail.medicalRecords.emptyFiltered') : t('patientDetail.medicalRecords.empty')}
          </div>
        ) : (
          (() => {
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedPrescriptions = filteredPrescriptions.slice(startIndex, endIndex);

            return paginatedPrescriptions.map((pres) => (
              <MedicalRecord
                key={pres.id}
                prescription={pres}
                onEdit={handleEditMedicalRecord}
                onDelete={handleDeleteMedicalRecord}
              />
            ));
          })()
        )}
      </div>

      {/* Pagination for Medical Records */}
      {filteredPrescriptions.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredPrescriptions.length / itemsPerPage)}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filteredPrescriptions.length}
        />
      )}

      <AddMedicalRecordModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSubmit={handleAddMedicalRecord}
        patientId={Number(patientId)}
      />
      <EditMedicalRecordModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateMedicalRecord}
        prescription={selectedPrescription}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteConfirmModalOpen}
        onClose={closeDeleteConfirmModal}
        onConfirm={handleConfirmDeleteMedicalRecord}
        title={t("patientDetail.medicalRecords.deleteConfirm.title")}
        message={t("patientDetail.medicalRecords.deleteConfirm.message")}
        confirmButtonText={t("patientDetail.medicalRecords.deleteConfirm.confirm")}
        cancelButtonText={t("patientDetail.medicalRecords.deleteConfirm.cancel")}
      />
    </div>
  );
}

// AppointmentsContent
export function AppointmentsContent() {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { patientId } = useParams();
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [statusChangeAppointment, setStatusChangeAppointment] =
    useState<{ appointmentId: number; currentStatus: string } | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<string>("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Pagination state for appointments
  const [appointmentCurrentPage, setAppointmentCurrentPage] = useState(1);
  const appointmentItemsPerPage = 10; // 10 appointments per page

  // Filter, sort, and search state for appointments
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState("");
  const [appointmentSortBy, setAppointmentSortBy] = useState<"date" | "doctor" | "status">("date");
  const [appointmentSortOrder, setAppointmentSortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const formatHHmm = (timeStr: string) => {
    if (!timeStr) return "N/A";
    const parts = timeStr.split(":");
    if (parts.length < 2) return "N/A";
    return `${parts[0]}:${parts[1]}`;
  };

  const reloadAppointments = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const data = await appointmentService.getAppointmentsByPatientId(
        Number(patientId),
        1,
        50
      );
      // Map API response to frontend format
      const mappedAppointments = data.map((appt: any) => ({
        appointmentId: appt.id,
        doctorId: appt.doctorId,
        doctorInfo: appt.doctorInfo,
        schedule: appt.schedule,
        symptoms: appt.symptoms,
        slotStart: appt.slot_start,
        slotEnd: appt.slot_end,
        appointmentStatus:
          appt.status === "P"
            ? "PENDING"
            : appt.status === "C"
              ? "CONFIRMED"
              : appt.status === "X"
                ? "CANCELLED"
                : appt.status === "D"
                  ? "COMPLETED"
                  : appt.status === "N"
                    ? "NO_SHOW"
                    : appt.status === "I"
                      ? "IN_PROGRESS"
                      : "PENDING",
        createdAt: appt.createdAt,
        prescriptionId: appt.prescriptionId,
      }));
      setAppointments(mappedAppointments);
      setFilteredAppointments(mappedAppointments);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter, sort, and search logic for appointments
  const applyAppointmentFiltersAndSort = () => {
    let filtered = [...appointments];

    // Apply search filter
    if (appointmentSearchTerm.trim()) {
      filtered = filtered.filter(appointment =>
        appointment.doctorInfo?.fullName?.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
        appointment.appointmentId.toString().includes(appointmentSearchTerm) ||
        appointment.symptoms?.toLowerCase().includes(appointmentSearchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(appointment => appointment.appointmentStatus === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;

      if (appointmentSortBy === "date") {
        compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (appointmentSortBy === "doctor") {
        compareValue = (a.doctorInfo?.fullName || "").localeCompare(b.doctorInfo?.fullName || "");
      } else if (appointmentSortBy === "status") {
        compareValue = a.appointmentStatus.localeCompare(b.appointmentStatus);
      }

      return appointmentSortOrder === "asc" ? compareValue : -compareValue;
    });

    setFilteredAppointments(filtered);
    setAppointmentCurrentPage(1); // Reset to first page when filters change
  };

  // Apply filters when dependencies change
  useEffect(() => {
    applyAppointmentFiltersAndSort();
  }, [appointments, appointmentSearchTerm, appointmentSortBy, appointmentSortOrder, statusFilter]);

  useEffect(() => {
    reloadAppointments();
  }, [patientId]);

  const handleStatusChange = async (
    appointmentId: number,
    selectedStatus: string
  ) => {
    try {
      setLoading(true);
      await appointmentService.updateAppointmentStatus(appointmentId, selectedStatus);

      // Reload appointments to reflect the change
      await reloadAppointments();

      // Show success message
      const statusLabels: Record<string, string> = {
        PENDING: "Chờ xác nhận",
        CONFIRMED: "Đã xác nhận",
        COMPLETED: "Đã khám",
        CANCELLED: "Đã hủy",
      };

      // Success notification
      showToast(`Thành công! Đã chuyển trạng thái cuộc hẹn thành: ${statusLabels[selectedStatus] || selectedStatus}`, 'success');
      setStatusChangeAppointment(null);
      setSelectedNewStatus("");
    } catch (error) {
      console.error("Error changing appointment status:", error);
      showToast("❌ Lỗi! Không thể thay đổi trạng thái cuộc hẹn!", 'error');
      setLoading(false);
    }
  };

  const openStatusChangeModal = (appointmentId: number, currentStatus: string) => {
    setStatusChangeAppointment({ appointmentId, currentStatus });
    setSelectedNewStatus(currentStatus);
  };

  const confirmStatusChange = async () => {
    if (!statusChangeAppointment || !selectedNewStatus) return;

    if (selectedNewStatus === statusChangeAppointment.currentStatus) {
      alert("Trạng thái mới giống với trạng thái hiện tại!");
      return;
    }

    const confirmed = confirm(`Bạn có chắc chắn muốn chuyển trạng thái cuộc hẹn thành "${getStatusLabel(selectedNewStatus)}"?`);
    if (confirmed) {
      setIsChangingStatus(true);
      await handleStatusChange(statusChangeAppointment.appointmentId, selectedNewStatus);
      setIsChangingStatus(false);
    }
  };

  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      PENDING: "Chờ xác nhận",
      CONFIRMED: "Đã xác nhận",
      COMPLETED: "Đã khám",
      CANCELLED: "Đã hủy",
    };
    return statusLabels[status] || status;
  };

  return (
    <div className="bg-white py-6 px-4 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 ml-1">{t("patientDetail.appointments.title")}</h2>

      {/* Search, Filter, and Sort Controls */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder={t("patientDetail.appointments.searchPlaceholder")}
              value={appointmentSearchTerm}
              onChange={(e) => setAppointmentSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t("patientDetail.appointments.status.all")}</option>
              <option value="PENDING">{t("patientDetail.appointments.status.pending")}</option>
              <option value="CONFIRMED">{t("patientDetail.appointments.status.confirmed")}</option>
              <option value="COMPLETED">{t("patientDetail.appointments.status.completed")}</option>
              <option value="CANCELLED">{t("patientDetail.appointments.status.cancelled")}</option>
              <option value="NO_SHOW">{t("patientDetail.appointments.status.noShow")}</option>
              <option value="IN_PROGRESS">{t("patientDetail.appointments.status.noShow")}</option>
            </select>
          </div>

          {/* Sort Controls */}
          <div className="flex gap-2">
            <select
              value={appointmentSortBy}
              onChange={(e) => setAppointmentSortBy(e.target.value as "date" | "doctor" | "status")}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">{t("patientDetail.appointments.sort.date")}</option>
              <option value="doctor">{t("patientDetail.appointments.sort.doctor")}</option>
              <option value="status">{t("patientDetail.appointments.sort.status")}</option>
            </select>

            <button
              onClick={() => setAppointmentSortOrder(appointmentSortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={appointmentSortOrder === "asc" ? t('patientDetail.medicalRecords.sort.toDesc') : t('patientDetail.medicalRecords.sort.toAsc')}
            >
              {appointmentSortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600">
          {t("patientDetail.appointments.resultsCount", { shown: filteredAppointments.length, total: appointments.length })}
        </div>
      </div>
      <Table>
        <TableHeader className="border-b border-gray-100 bg-slate-600/10 dark:border-white/[0.05]">
          <TableRow>
            <TableCell
              isHeader
              className="px-4 py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-gray-400"
            >
              {t("patientDetail.appointments.table.headers.id")}
            </TableCell>
            <TableCell
              isHeader
              className="px-4 py-3 font-medium text-gray-800 text-theme-sm dark:text-gray-400"
            >
              {t("patientDetail.appointments.table.headers.doctor")}
            </TableCell>
            <TableCell
              isHeader
              className="px-4 py-3 font-medium text-gray-800 text-theme-sm dark:text-gray-400"
            >
              {t("patientDetail.appointments.table.headers.status")}
            </TableCell>
            <TableCell
              isHeader
              className="px-4 py-3 font-medium text-gray-800 text-theme-sm dark:text-gray-400"
            >
              {t("patientDetail.appointments.table.headers.time")}
            </TableCell>
            <TableCell
              isHeader
              className="px-3 py-3 font-medium text-gray-800 text-theme-sm dark:text-gray-400"
            >
              {t("patientDetail.appointments.table.headers.actions")}
            </TableCell>
          </TableRow>
        </TableHeader>

        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {loading ? (
            <TableRow>
              <TableCell className="text-center text-gray-500 py-8" colSpan={5}>
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-base-600 mr-2"></div>
                  {t('common.loading')}
                </div>
              </TableCell>
            </TableRow>
          ) : filteredAppointments.length > 0 ? (
            (() => {
              const startIndex = (appointmentCurrentPage - 1) * appointmentItemsPerPage;
              const endIndex = startIndex + appointmentItemsPerPage;
              const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

              return paginatedAppointments.map((appt) => (
                <TableRow key={appt.appointmentId}>
                  <TableCell className="px-4 py-3 text-gray-700 text-theme-sm dark:text-gray-400">
                    CH{appt.appointmentId.toString().padStart(4, "0")}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-700 text-theme-sm dark:text-gray-400">
                    {appt.doctorInfo?.fullName}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-700 text-theme-sm dark:text-gray-400">
                    <Badge
                      size="sm"
                      color={
                        appt.appointmentStatus === "PENDING"
                          ? "pending"
                          : appt.appointmentStatus === "COMPLETED"
                            ? "completed"
                            : appt.appointmentStatus === "CANCELLED"
                              ? "cancelled"
                              : appt.appointmentStatus === "CONFIRMED"
                                ? "confirmed"
                                : appt.appointmentStatus === "NO_SHOW"
                                  ? "error"
                                  : appt.appointmentStatus === "IN_PROGRESS"
                                    ? "warning"
                                    : "light"
                      }
                    >
                      {appt.appointmentStatus === "PENDING"
                        ? t("patientDetail.appointments.status.pending")
                        : appt.appointmentStatus === "COMPLETED"
                          ? t("patientDetail.appointments.status.completed")
                          : appt.appointmentStatus === "CANCELLED"
                            ? t("patientDetail.appointments.status.cancelled")
                            : appt.appointmentStatus === "CONFIRMED"
                              ? t("patientDetail.appointments.status.confirmed")
                              : t("patientDetail.appointments.status.unknown")}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-700 text-theme-sm dark:text-gray-400">
                    {formatHHmm(appt.slotStart)} - {formatHHmm(appt.slotEnd)}
                  </TableCell>
                  <TableCell className="px-4 py-3 flex items-center text-gray-500 text-theme-md dark:text-gray-400">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedAppointment(appt)}
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
                      </button>
                      <button
                        onClick={() =>
                          openStatusChangeModal(
                            appt.appointmentId,
                            appt.appointmentStatus
                          )
                        }
                        className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                        title="Chọn trạng thái"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ));
            })()
          ) : (
            <TableRow>
              <TableCell className="text-center text-gray-500 py-8" colSpan={5}>
                {appointmentSearchTerm.trim() || statusFilter ? t("patientDetail.appointments.emptyFiltered") : t("patientDetail.appointments.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination for Appointments */}
      {filteredAppointments.length > 0 && (
        <Pagination
          currentPage={appointmentCurrentPage}
          totalPages={Math.ceil(filteredAppointments.length / appointmentItemsPerPage)}
          onPageChange={setAppointmentCurrentPage}
          itemsPerPage={appointmentItemsPerPage}
          totalItems={filteredAppointments.length}
        />
      )}

      {selectedAppointment && (
        <AppointmentModal
          {...selectedAppointment}
          isOpen={true}
          onClose={() => setSelectedAppointment(null)}
        />
      )}

      {/* Status Change Dropdown */}
      {statusChangeAppointment && (
        <div
          className="fixed inset-0 bg-gray-200/60 backdrop-blur-md flex items-center justify-center z-50"
          onClick={() => setStatusChangeAppointment(null)} // click ngoài để đóng
        >
          <div
            className="relative bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6 transform transition-all duration-300"
            onClick={(e) => e.stopPropagation()} // chặn click trong modal
          >
            <h3 className="text-lg font-semibold mb-4">
              {t("patientDetail.appointments.changeStatus.title")}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("patientDetail.appointments.changeStatus.current")}:{" "}
                <span className="font-semibold text-blue-600">
                  {getStatusLabel(statusChangeAppointment.currentStatus)}
                </span>
              </label>
              <select
                value={selectedNewStatus}
                onChange={(e) => setSelectedNewStatus(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t("patientDetail.appointments.changeStatus.placeholder")}</option>
                <option value="PENDING">{t("patientDetail.appointments.status.pending")}</option>
                <option value="CONFIRMED">{t("patientDetail.appointments.status.confirmed")}</option>
                <option value="COMPLETED">{t("patientDetail.appointments.status.completed")}</option>
                <option value="CANCELLED">{t("patientDetail.appointments.status.cancelled")}</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStatusChangeAppointment(null)}
                disabled={isChangingStatus}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={
                  isChangingStatus ||
                  !selectedNewStatus ||
                  selectedNewStatus === statusChangeAppointment.currentStatus
                }
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isChangingStatus ? t("patientDetail.appointments.changeStatus.processing") : t("patientDetail.appointments.changeStatus.confirm")}
              </button>
            </div>

            {/* Loading overlay */}
            {isChangingStatus && (
              <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600 font-medium">{t("patientDetail.appointments.changeStatus.loading")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-right duration-300">
          <div className={`px-6 py-4 rounded-lg shadow-lg max-w-md ${toast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
            }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-4 text-white hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// InvoicesContent
export function InvoicesContent() {
  const { t } = useTranslation();
  const [bills, setBills] = useState<Bill[]>([]);
  const [billServices, setBillServices] = useState<
    Record<number, ServiceOrder[]>
  >({});
  const { patientId } = useParams();
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state for invoices
  const [invoiceCurrentPage, setInvoiceCurrentPage] = useState(1);
  const invoiceItemsPerPage = 8; // 8 invoices per page

  // Filter, sort, and search state for invoices
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState("");
  const [invoiceSortBy, setInvoiceSortBy] = useState<"date" | "amount" | "status">("date");
  const [invoiceSortOrder, setInvoiceSortOrder] = useState<"asc" | "desc">("desc");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>("");
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);

  const reloadBills = async () => {
    try {
      setLoading(true);
      console.log("Fetching bills for patient:", patientId);

      // 1️⃣ Lấy dữ liệu bill từ backend
      const billsDataRaw = await paymentService.getBillsByPatientId(
        Number(patientId)
      );

      const billsData: Bill[] = billsDataRaw.map((b: any) => {
        let appointmentObj = null;

        if (typeof b.appointment === "number") {
          appointmentObj = { appointmentId: b.appointment };
        } else if (
          b.appointment &&
          typeof b.appointment === "object" &&
          "appointmentId" in b.appointment
        ) {
          appointmentObj = b.appointment;
        }

        return {
          billId: b.bill_id || b.id,
          appointment: appointmentObj,
          patientId: b.patient,
          totalCost: Number(b.total_cost),
          insuranceDiscount: Number(b.insurance_discount),
          amount: Number(b.amount),
          service_fee: Number(b.service_fee) || 0,
          status: (() => {
            switch (b.status) {
              case "P":
                return "PAID";
              case "U":
                return "UNPAID";
              case "B":
                return "BOOKING_PAID";
              default:
                return b.status || "UNKNOWN";
            }
          })(),
          createdAt: b.created_at,
          updatedAt: b.updated_at,
          billDetails: b.bill_details || [],
        };
      });

      console.log("Bills data:", billsData);

      const servicesData = await Promise.all(
        billsData.map(async (bill) => {
          if (bill.appointment?.appointmentId) {
            const serviceOrders = await getServiceOrdersByAppointmentId(
              bill.appointment.appointmentId
            );

            const serviceOrdersWithInfo = await Promise.all(
              serviceOrders.map(async (order: any) => {
                try {
                  const serviceInfo = await servicesService.getServiceById(order.service_id);
                  return {
                    ...order,
                    service: {
                      serviceId: serviceInfo.id,
                      serviceName: serviceInfo.service_name,
                      price: Number(serviceInfo.price),
                    },
                  };
                } catch (err) {
                  console.error(`Lỗi lấy dịch vụ id=${order.service_id}`, err);
                  return {
                    ...order,
                    service: {
                      serviceId: order.service_id,
                      serviceName: "Không xác định",
                      price: 0,
                    },
                  };
                }
              })
            );
            return { billId: bill.billId, services: serviceOrdersWithInfo };
          } else {
            return { billId: bill.billId, services: [] };
          }
        })
      );

      console.log("Services data:", servicesData);

      const servicesMap = Object.fromEntries(
        servicesData.map((item) => [item.billId, item.services])
      );

      setBillServices(servicesMap);
      setBills(billsData);
      setFilteredBills(billsData);
    } catch (err) {
      console.error("Error loading bills:", err);
      setError(t('patientDetail.invoices.error.load'));
    } finally {
      setLoading(false);
    }
  };

  // Filter, sort, and search logic for invoices
  const applyInvoiceFiltersAndSort = () => {
    let filtered = [...bills];

    // Apply search filter
    if (invoiceSearchTerm.trim()) {
      filtered = filtered.filter(bill => {
        const services = billServices[bill.billId || 0] || [];
        return (
          bill.billId?.toString().includes(invoiceSearchTerm) ||
          services.some(service =>
            service.serviceName?.toLowerCase().includes(invoiceSearchTerm.toLowerCase())
          )
        );
      });
    }

    // Apply status filter
    if (invoiceStatusFilter) {
      filtered = filtered.filter(bill => bill.status === invoiceStatusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;

      if (invoiceSortBy === "date") {
        compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (invoiceSortBy === "amount") {
        compareValue = (a.service_fee || 0) - (b.service_fee || 0);
      } else if (invoiceSortBy === "status") {
        compareValue = a.status.localeCompare(b.status);
      }

      return invoiceSortOrder === "asc" ? compareValue : -compareValue;
    });

    setFilteredBills(filtered);
    setInvoiceCurrentPage(1); // Reset to first page when filters change
  };

  // Apply filters when dependencies change
  useEffect(() => {
    applyInvoiceFiltersAndSort();
  }, [bills, invoiceSearchTerm, invoiceSortBy, invoiceSortOrder, invoiceStatusFilter, billServices]);

  useEffect(() => {
    if (patientId) {
      reloadBills();
    }
  }, [patientId]);

  const handlePayment = async (bill: Bill, method: "cash") => {
    try {
      if (method === "online") {
        let paymentUrl: string;

        if (bill.status === "UNPAID") {
          // Thanh toán tiền đặt lịch
          paymentUrl = await paymentService.createPayment(bill.billId);
        } else if (bill.status === "BOOKING_PAID") {
          // Thanh toán tiền dịch vụ
          paymentUrl = await paymentService.createServicePayment(bill.billId);
        } else {
          alert(t('patientDetail.invoices.alert.notRequired'));
          return;
        }

        window.open(paymentUrl, "_blank");

        // Check status sau khi thanh toán
        const checkPaymentStatus = setInterval(async () => {
          try {
            const updatedBills = await paymentService.getBillsByPatientId(
              Number(patientId)
            );
            const currentBill = updatedBills.find(
              (b) => b.billId === bill.billId
            );

            if (currentBill?.status === "PAID") {
              clearInterval(checkPaymentStatus);
              setBills(updatedBills);
            }
          } catch (error) {
            console.error("Lỗi kiểm tra trạng thái thanh toán:", error);
          }
        }, 2000);

        setTimeout(() => {
          clearInterval(checkPaymentStatus);
        }, 5 * 60 * 1000);
      } else {
        await paymentService.processCashPayment(bill.billId);
        reloadBills();
      }
    } catch (error: any) {
      alert(error.message || t('patientDetail.invoices.error.payFailed'));
    }
  };

  const calculateTotalFromServices = (bill: Bill) => {
    const services = billServices[bill.billId || 0] || [];
    return services.reduce((sum, svc) => sum + (Number(svc.price) || 0), 0);
  };

  return (
    <div className="bg-white py-6 px-4 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 ml-1">{t('patientDetail.invoices.title')}</h2>

      {/* Search, Filter, and Sort Controls */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('patientDetail.invoices.searchPlaceholder')}
              value={invoiceSearchTerm}
              onChange={(e) => setInvoiceSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-48">
            <select
              value={invoiceStatusFilter}
              onChange={(e) => setInvoiceStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t("patientDetail.invoices.status.all")}</option>
              <option value="PAID">{t("patientDetail.invoices.status.paid")}</option>
              <option value="UNPAID">{t("patientDetail.invoices.status.unpaid")}</option>
              <option value="BOOKING_PAID">{t("patientDetail.invoices.status.bookingPaid")}</option>
            </select>
          </div>

          {/* Sort Controls */}
          <div className="flex gap-2">
            <select
              value={invoiceSortBy}
              onChange={(e) => setInvoiceSortBy(e.target.value as "date" | "amount" | "status")}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">{t("patientDetail.invoices.sort.date")}</option>
              <option value="amount">{t("patientDetail.invoices.sort.amount")}</option>
              <option value="status">{t("patientDetail.invoices.sort.status")}</option>
            </select>

            <button
              onClick={() => setInvoiceSortOrder(invoiceSortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={invoiceSortOrder === "asc" ? t('patientDetail.medicalRecords.sort.toDesc') : t('patientDetail.medicalRecords.sort.toAsc')}
            >
              {invoiceSortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600">
          {t("patientDetail.invoices.resultsCount", {
            shown: filteredBills.filter(bill => (billServices[bill.billId || 0] || []).length > 0).length,
            total: bills.filter(bill => (billServices[bill.billId || 0] || []).length > 0).length
          })}
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 bg-slate-600/10 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-gray-400"
                >
                  {t("patientDetail.invoices.table.headers.id")}
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-gray-400"
                >
                  {t("patientDetail.invoices.table.headers.date")}
                </TableCell>
                {/* <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-gray-400"
                >
                  Dịch vụ
                </TableCell> */}
                <TableCell
                  isHeader
                  className="px-8 py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-gray-400"
                >
                  {t("patientDetail.invoices.table.headers.status")}
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-gray-400"
                >
                  {t("patientDetail.invoices.table.headers.amount")}
                </TableCell>
                <TableCell
                  isHeader
                  className="px-16 py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-gray-400"
                >
                  {t("patientDetail.invoices.table.headers.actions")}
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <TableCell className="text-center py-4" colSpan={6}>
                    {t('common.loading')}
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    className="text-center text-red-500 py-4"
                    colSpan={6}
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : bills.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="text-center text-gray-500 py-4"
                    colSpan={6}
                  >
                    {t('patientDetail.invoices.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                (() => {
                  const billsWithServices = filteredBills.filter((bill) => {
                    const services = billServices[bill.billId || 0] || [];
                    return services.length > 0;
                  });

                  if (billsWithServices.length === 0) {
                    return (
                      <TableRow>
                        <TableCell
                          className="text-center text-gray-500 py-4"
                          colSpan={6}
                        >
                          {invoiceSearchTerm.trim() || invoiceStatusFilter ? t('patientDetail.invoices.emptyFiltered') : t('patientDetail.invoices.empty')}
                        </TableCell>
                      </TableRow>
                    );
                  }

                  const startIndex = (invoiceCurrentPage - 1) * invoiceItemsPerPage;
                  const endIndex = startIndex + invoiceItemsPerPage;
                  const paginatedBills = billsWithServices.slice(startIndex, endIndex);

                  return paginatedBills.map((bill) => {
                    const services = billServices[bill.billId || 0] || [];
                    const totalFromServices = calculateTotalFromServices(bill);

                    return (
                      <TableRow key={bill.billId || Math.random()}>
                        <TableCell className="px-6 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-400">
                          #{(bill.billId || 0).toString().padStart(4, "0")}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-400">
                          {services.length > 0
                            ? format(
                              new Date(
                                services[0].order_time ||
                                services[0].created_at ||
                                bill.createdAt
                              ),
                              "dd-MM-yyyy"
                            )
                            : bill.createdAt
                              ? format(new Date(bill.createdAt), "dd-MM-yyyy")
                              : "N/A"}
                        </TableCell>
                        {/* <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-400">
                        {services.length > 0 ? (
                          <div className="space-y-1">
                            {services.slice(0, 2).map((service, index) => (
                              <div key={index} className="text-xs">
                                <span className="font-medium">{service.serviceName}</span>
                                <span className="text-gray-500 ml-1">
                                  ({(Number(service.price) || 0).toLocaleString("vi-VN")} VNĐ)
                                </span>
                              </div>
                            ))}
                            {services.length > 2 && (
                              <div className="text-xs text-gray-500">+{services.length - 2} dịch vụ khác</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Không có dịch vụ</span>
                        )}
                      </TableCell> */}
                        <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-400">
                          <Badge
                            size="sm"
                            color={
                              bill.status === "PAID"
                                ? "success"
                                : bill.status === "UNPAID"
                                  ? "error"
                                  : bill.status === "BOOKING_PAID"
                                    ? "warning"
                                    : "cancel"
                            }
                          >
                            {bill.status === "PAID"
                              ? t("patientDetail.invoices.status.paid")
                              : bill.status === "UNPAID"
                                ? t("patientDetail.invoices.status.unpaid")
                                : bill.status === "BOOKING_PAID"
                                  ? t("patientDetail.invoices.status.bookingPaid")
                                  : t("patientDetail.invoices.status.cancelled")}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700 text-start text-xs text-green-700 font-semibold">
                          {t("patientDetail.invoices.table.amountWithCurrency", {
                            amount: calculateTotalFromServices(bill).toLocaleString("vi-VN")
                          })}
                        </TableCell>


                        <TableCell className="px-4 py-3 text-gray-500 text-theme-md dark:text-gray-400">
                          <div className="flex gap-2">
                            {bill.status === "BOOKING_PAID" ? (
                              <button
                                onClick={() => handlePayment(bill, "cash")}
                                className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                {t('patientDetail.invoices.actions.payService')}
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedBill(bill)}
                                className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200 transition-colors"
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
                                {t('common.viewDetails')}
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination for Invoices */}
      {(() => {
        const billsWithServices = filteredBills.filter((bill) => {
          const services = billServices[bill.billId || 0] || [];
          return services.length > 0;
        });
        return billsWithServices.length > 0 && (
          <Pagination
            currentPage={invoiceCurrentPage}
            totalPages={Math.ceil(billsWithServices.length / invoiceItemsPerPage)}
            onPageChange={setInvoiceCurrentPage}
            itemsPerPage={invoiceItemsPerPage}
            totalItems={billsWithServices.length}
          />
        );
      })()}

      {selectedBill && (
        <BillModal
          {...selectedBill}   // spread thẳng các field của Bill
          services={billServices[selectedBill.billId || 0] || []}
          isOpen={true}
          onClose={() => setSelectedBill(null)}
        />
      )}
    </div>
  );
}

// PatientInfoContent
export function PatientInfoContent({ patient }: { patient: Patient }) {
  const { t } = useTranslation();
  const { patientId } = useParams();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<PatientUpdateDto>(
    {} as PatientUpdateDto
  );
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  useEffect(() => {
    if (patient) {
      setEditData({
        userId: patient.patientId,
        height: patient.height,
        weight: patient.weight,
        bloodType: patient.bloodType,
        avatar: patient.avatar,
        allergies: patient.allergies,
        fullName: patient.fullName,
        birthday: patient.birthday,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        insuranceNumber: patient.insuranceNumber,
        identityNumber: patient.identityNumber,
      });
    }
  }, [patient]);

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;
    try {
      setLoading(true);
      await patientService.updatePatient(Number(patientId), {
        fullName: editData.fullName,
        identityNumber: editData.identityNumber,
        insuranceNumber: editData.insuranceNumber,
        birthday: editData.birthday,
        phone: editData.phone,
        email: editData.email,
        avatar: editData.avatar,
        gender: editData.gender as "MALE" | "FEMALE" | "OTHER",
        address: editData.address,
        allergies: editData.allergies,
        height: editData.height,
        weight: editData.weight,
        bloodType: editData.bloodType,
      });
      setShowEditModal(false);
      // Re-fetch patient data to update the parent component's state
      const updatedPatient = await patientService.getPatientById(
        Number(patientId)
      );
      // This assumes PatientDetailLayout will re-render with the new patient prop
      // In a real app, you might want to pass a callback to update parent state
      // For now, relying on the parent (PatientDetail) to re-fetch if needed.
    } catch (error: any) {
      console.error("Lỗi cập nhật:", error);
      let message = "Cập nhật thông tin thất bại!";
      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.response?.data) {
        message = JSON.stringify(error.response.data);
      } else if (error?.message) {
        message = error.message;
      }
      setErrorModal(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-6 px-5 rounded-lg border border-gray-200">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">{t("patientDetail.info.title")}</h2>
        <button
          className="flex items-center justify-center bg-base-700 py-2.5 px-5 rounded-lg text-white text-sm hover:bg-base-700/70"
          onClick={() => setShowEditModal(true)}
        >
          {t("common.edit")}
        </button>
      </div>
      <div className="space-y-4 ml-1">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500 text-sm">{t("patientDetail.info.fields.fullName")}</p>
            <p className="font-medium">{patient?.fullName}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t("patientDetail.info.fields.patientId")}</p>
            <p className="font-medium">
              BN{patient?.patientId?.toString().padStart(4, "0")}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t("patientDetail.info.fields.birthday")}</p>
            <p className="font-medium">{patient?.birthday}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t("patientDetail.info.fields.gender")}</p>
            <p className="font-medium">
              {patient?.gender === "MALE"
                ? t("common.gender.male")
                : patient?.gender === "FEMALE"
                  ? t("common.gender.female")
                  : t("common.gender.other")}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t("patientDetail.info.fields.phone")}</p>
            <p className="font-medium">{patient?.phone || ""}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t("patientDetail.info.fields.email")}</p>
            <p className="font-medium">{patient?.email || ""}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t("patientDetail.info.fields.address")}</p>
            <p className="font-medium">{patient?.address}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t("patientDetail.info.fields.insuranceNumber")}</p>
            <p className="font-medium">{patient?.insuranceNumber}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t("patientDetail.info.fields.identityNumber")}</p>
            <p className="font-medium">{patient?.identityNumber}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t("patientDetail.info.fields.createdAt")}</p>
            <p className="font-medium">
              {patient?.createdAt
                ? format(new Date(patient?.createdAt), "dd-MM-yyyy")
                : ""}
            </p>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center overflow-y-auto modal z-99999">
          <div
            className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px]"
            onClick={() => setShowEditModal(false)}
          ></div>
          <div
            className="relative w-full rounded-3xl bg-white dark:bg-gray-900 max-w-[700px] lg:p-8 mt-[5vh] mb-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute right-3 top-3 z-999 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-6 sm:top-6 sm:h-11 sm:w-11"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                  fill="currentColor"
                />
              </svg>
            </button>

            <div className="flex flex-col h-full">
              <div className="flex-shrink-0 px-2 pb-4">
                <h5 className="mb-4 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-xl">
                  {t("patientDetail.info.editTitle")}
                </h5>
              </div>

              <div className="flex-1 px-2">
                <form
                  id="patient-edit-form"
                  onSubmit={handleEditSubmit}
                  className="space-y-6"
                >
                  {/* Thông tin cơ bản */}
                  <div>
                    <h6 className="text-base font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                      {t("personalInfo.basicInfo")}
                    </h6>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("patientDetail.info.form.fullName")} <span className="text-red-500">*</span>
                          </label>
                          <input
                            name="fullName"
                            value={editData.fullName || ""}
                            onChange={handleEditChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                            placeholder={t("patientDetail.info.form.placeholders.fullName")}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("patientDetail.info.form.gender")} <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="gender"
                            value={editData.gender || ""}
                            onChange={handleEditChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                            required
                          >
                            <option value="">{t("personalInfo.selectGender")}</option>
                            <option value="MALE">{t("common.gender.male")}</option>
                            <option value="FEMALE">{t("common.gender.female")}</option>
                            <option value="OTHER">{t("common.gender.other")}</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("patientDetail.info.form.birthday")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="birthday"
                          type="date"
                          value={editData.birthday || ""}
                          onChange={handleEditChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Thông tin liên hệ */}
                  <div>
                    <h6 className="text-base font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                      {t("footer.contactInfo")}
                    </h6>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("patientDetail.info.form.phone")}
                          </label>
                          <input
                            name="phone"
                            value={editData.phone || ""}
                            onChange={handleEditChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                            placeholder={t("patientDetail.info.form.placeholders.phone")}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("patientDetail.info.form.email")}
                          </label>
                          <input
                            name="email"
                            type="email"
                            value={editData.email || ""}
                            onChange={handleEditChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                            placeholder={t("patientDetail.info.form.placeholders.email")}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("patientDetail.info.form.address")}
                        </label>
                        <input
                          name="address"
                          value={editData.address || ""}
                          onChange={handleEditChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                          placeholder={t("patientDetail.info.form.placeholders.address")}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Thông tin giấy tờ */}
                  <div>
                    <h6 className="text-base font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                      {t("patientDetail.info.form.paper")}
                    </h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("patientDetail.info.form.identityNumber")}
                        </label>
                        <input
                          name="identityNumber"
                          value={editData.identityNumber || ""}
                          onChange={handleEditChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                          placeholder={t("patientDetail.info.form.placeholders.identityNumber")}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("patientDetail.info.form.insuranceNumber")}
                        </label>
                        <input
                          name="insuranceNumber"
                          value={editData.insuranceNumber || ""}
                          onChange={handleEditChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                          placeholder={t("patientDetail.info.form.placeholders.insuranceNumber")}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ảnh đại diện */}
                  <div>
                    <h6 className="text-base font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                      {t("common.avatar")}
                    </h6>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("patientDetail.info.form.avatar")}
                        </label>
                        <input
                          name="avatar"
                          value={editData.avatar || ""}
                          onChange={handleEditChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                          placeholder="Nhập đường dẫn ảnh đại diện (https://...)"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {t("patientDetail.info.form.correctURL")}
                        </p>
                      </div>

                      {editData.avatar && (
                        <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border">
                          <div className="flex-shrink-0">
                            <div className="relative">
                              <img
                                src={editData.avatar || "/placeholder.svg"}
                                alt="Preview ảnh đại diện"
                                className="w-16 h-16 object-cover rounded-full border-2 border-white shadow-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src =
                                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB4PSIxNiIgeT0iMTYiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHA0aCBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0yMCAyMXYtMmE0IDQgMCAwIDAtNC00SDhhNCA0IDAgMCAwLTQgNHYyIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIgc3Ryb2tlPSIjOUNBNEFGIiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8L3N2Zz4KPC9zdmc+";
                                  target.classList.add("opacity-50");
                                }}
                              />
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900">
                              {t("patientDetail.info.avatar.previewTitle")}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {t("patientDetail.info.avatar.previewDescription")}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setEditData((prev) => ({ ...prev, avatar: "" }))
                              }
                              className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
                            >
                              {t("patientDetail.info.avatar.remove")}
                            </button>
                          </div>
                        </div>
                      )}

                      {!editData.avatar && (
                        <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                          <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                              <svg
                                className="w-6 h-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            </div>
                            <p className="text-sm text-gray-500">
                              {t("patientDetail.info.avatar.empty")}
                            </p>
                            <p className="text-xs text-gray-400">
                              {t("patientDetail.info.avatar.hint")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              <div className="flex-shrink-0 px-2 pt-4 border-t border-gray-200 bg-white">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2.5 text-sm font-medium text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setShowEditModal(false)}
                    disabled={loading}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    form="patient-edit-form"
                    className="px-4 py-2.5 text-sm font-medium text-white bg-base-600 rounded-lg hover:bg-base-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? t('common.saving') : t("common.saveChanges")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-red-600">{t('common.error')}</h2>
            <p>{errorModal}</p>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setErrorModal(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// HealthInfoContent
export function HealthInfoContent({ patient }: { patient: Patient }) {
  const { t } = useTranslation();
  const { patientId } = useParams();
  const [patientData, setPatientData] = useState<Patient>(patient);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<PatientUpdateDto>(
    {} as PatientUpdateDto
  );
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  useEffect(() => {
    if (patient) {
      setEditData({
        userId: patient.patientId,
        fullName: patient.fullName,
        birthday: patient.birthday,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        avatar: patient.avatar,
        address: patient.address,
        insuranceNumber: patient.insuranceNumber,
        identityNumber: patient.identityNumber,
        allergies: patient.allergies,
        height: patient.height,
        weight: patient.weight,
        bloodType: patient.bloodType,
      });
    }
  }, [patient]);

  const handleEditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: name === "height" || name === "weight" ? Number(value) : value,
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;
    try {
      setLoading(true);
      await patientService.updatePatient(Number(patientId), {
        fullName: editData.fullName,
        identityNumber: editData.identityNumber,
        insuranceNumber: editData.insuranceNumber,
        birthday: editData.birthday,
        phone: editData.phone,
        email: editData.email,
        avatar: editData.avatar,
        gender: editData.gender,
        address: editData.address,
        allergies: editData.allergies,
        height: editData.height,
        weight: editData.weight,
        bloodType: editData.bloodType,
      });
      const updatedPatient = await patientService.getPatientById(
        Number(patientId)
      );

      setPatientData(updatedPatient);

      setShowEditModal(false);
    } catch (error: any) {
      setErrorModal(t("patientDetail.healthInfo.error.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-6 px-5 rounded-lg border border-gray-200">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">{t("patientDetail.healthInfo.title")}</h2>
        <button
          className="flex items-center justify-center bg-base-700 py-2.5 px-5 rounded-lg text-white text-sm hover:bg-base-700/70"
          onClick={() => setShowEditModal(true)}
        >
          {t("common.edit")}
        </button>
      </div>
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">{t("patientDetail.healthInfo.allergies")}</h3>
          <ul className="list-disc pl-5 space-y-1">
            {patient?.allergies?.split("\n").map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium mb-2">{t("patientDetail.healthInfo.metrics")}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-500 text-sm">{t("patientDetail.healthInfo.height")}</p>
              <p className="font-medium">{patient?.height} cm</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-500 text-sm">{t("patientDetail.healthInfo.weight")}</p>
              <p className="font-medium">{patient?.weight} kg</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-500 text-sm">{t("patientDetail.healthInfo.bloodType")}</p>
              <p className="font-medium">
                {patient?.bloodType || t("common.notAvailable")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center overflow-y-auto modal z-99999">
          <div
            className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px]"
            onClick={() => setShowEditModal(false)}
          ></div>
          <div
            className="relative w-full rounded-3xl bg-white dark:bg-gray-900 max-w-[500px] lg:p-8 mt-[5vh] mb-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute right-3 top-3 z-999 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-6 sm:top-6 sm:h-11 sm:w-11"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                  fill="currentColor"
                />
              </svg>
            </button>

            <div className="flex flex-col h-full">
              <div className="flex-shrink-0 px-2 pb-4">
                <h5 className="mb-4 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                  {t("patientDetail.healthInfo.editTitle")}
                </h5>
              </div>

              <div className="flex-1 px-2">
                <form
                  id="health-edit-form"
                  onSubmit={handleEditSubmit}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("patientDetail.healthInfo.allergies")}
                    </label>
                    <textarea
                      name="allergies"
                      value={editData.allergies || ""}
                      onChange={handleEditChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0 min-h-[80px] resize-none"
                      placeholder={t("patientDetail.healthInfo.allergiesPlaceholder")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("patientDetail.healthInfo.heightWithUnit")}
                      </label>
                      <input
                        name="height"
                        type="number"
                        value={editData.height ?? ""}
                        onChange={handleEditChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                        min={0}
                        placeholder={t("patientDetail.healthInfo.heightPlaceholder")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("patientDetail.healthInfo.weightWithUnit")}
                      </label>
                      <input
                        name="weight"
                        type="number"
                        value={editData.weight ?? ""}
                        onChange={handleEditChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                        min={0}
                        placeholder={t("patientDetail.healthInfo.weightPlaceholder")}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("patientDetail.healthInfo.bloodType")}
                    </label>
                    <select
                      name="bloodType"
                      value={editData.bloodType || ""}
                      onChange={handleEditChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                    >
                      <option value="">{t("patientDetail.healthInfo.selectBloodType")}</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </form>
              </div>

              <div className="flex-shrink-0 px-2 pt-4 border-t border-gray-200 bg-white">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2.5 text-sm font-medium text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setShowEditModal(false)}
                    disabled={loading}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    form="health-edit-form"
                    className="px-4 py-2.5 text-sm font-medium text-white bg-base-600 rounded-lg hover:bg-base-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? t('common.saving') : t("common.saveChanges")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-red-600">{t('common.error')}</h2>
            <p>{errorModal}</p>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setErrorModal(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export function AppointmentEditModal({
  appointment,
  isOpen,
  onClose,
  onSubmit,
}: {
  appointment: AppointmentUpdateRequest;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AppointmentUpdateRequest) => Promise<void>;
}) {
  const [formData, setFormData] = useState<AppointmentUpdateRequest>({
    ...appointment,
    // number: appointment.number, // Removed as it's not in AppointmentUpdateRequest
  });
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const { t } = useTranslation();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "number" || name === "doctorId" ? Number(value) : value,
    }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      appointmentStatus: e.target
        .value as AppointmentUpdateRequest["appointmentStatus"],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      setErrorModal(null);
    } catch (error: any) {
      // In chi tiết lỗi ra console
      console.error("Lỗi cập nhật lịch khám:", error);

      // Lấy thông tin chi tiết lỗi từ backend nếu có
      let message = "Cập nhật lịch khám thất bại!";
      if (error?.response?.data) {
        // Nếu backend trả về mảng lỗi hoặc object lỗi chi tiết
        if (Array.isArray(error.response.data)) {
          message = error.response.data
            .map((err: any) => err.message || JSON.stringify(err))
            .join("\n");
        } else if (typeof error.response.data === "object") {
          // Nếu là object, lấy từng trường lỗi
          message = Object.values(error.response.data)
            .map((msg) => (Array.isArray(msg) ? msg.join(", ") : msg))
            .join("\n");
        } else if (error.response.data.message) {
          message = error.response.data.message;
        } else {
          message = JSON.stringify(error.response.data);
        }
      } else if (error?.message) {
        message = error.message;
      }
      alert(message);
      setErrorModal(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl ">
          <h2 className="text-xl font-semibold mb-4">Chỉnh sửa lịch khám</h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Bác sĩ (ID)</label>
                <input
                  name="doctorId"
                  type="number"
                  value={formData.doctorId}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                  disabled
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Triệu chứng</label>
                <textarea
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">
                  Thời gian bắt đầu
                </label>
                <input
                  name="slotStart"
                  type="time"
                  value={formData.slotStart}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Thời gian kết thúc
                </label>
                <input
                  name="slotEnd"
                  type="time"
                  value={formData.slotEnd}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              {/* <div>
                <label className="block font-medium mb-1">Số thứ tự</label>
                <input
                  name="number"
                  type="number"
                  value={formData.number}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  min={1}
                  required
                />
              </div> */}
              <div>
                <label className="block font-medium mb-1">Tình trạng</label>
                <select
                  name="appointmentStatus"
                  value={formData.appointmentStatus || ""}
                  onChange={handleStatusChange}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="PENDING">Chờ xác nhận</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="COMPLETED">Đã khám</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  disabled={loading}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-base-600 text-white rounded-lg hover:bg-base-700"
                  disabled={loading}
                >
                  {loading ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-red-600">{t('common.error')}</h2>
            <p>{errorModal}</p>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setErrorModal(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ContactInfoContent({ patient }: { patient: Patient }) {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const { patientId } = useParams();
  const [selectedContact, setSelectedContact] =
    useState<EmergencyContact | null>(null);
  const [editContact, setEditContact] = useState<EmergencyContact | null>(null);
  const [deleteContact, setDeleteContact] = useState<EmergencyContact | null>(
    null
  );
  const [editData, setEditData] = useState<EmergencyContactDto>({
    contactName: "",
    contactPhone: "",
    relationship: "FAMILY",
  });
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Pagination state for emergency contacts
  const [contactCurrentPage, setContactCurrentPage] = useState(1);
  const contactItemsPerPage = 6; // 6 contacts per page

  // Filter, sort, and search state for emergency contacts
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [contactSortBy, setContactSortBy] = useState<"name" | "phone" | "relationship">("name");
  const [contactSortOrder, setContactSortOrder] = useState<"asc" | "desc">("asc");
  const [relationshipFilter, setRelationshipFilter] = useState<string>("");
  const [filteredContacts, setFilteredContacts] = useState<EmergencyContact[]>([]);

  const reloadContacts = async () => {
    if (!patientId) return;
    try {
      const data = await patientService.getEmergencyContacts(Number(patientId));
      setContacts(data);
    } catch (error) {
      setErrorModal(t('patientDetail.contacts.error.load'));
    }
  };

  // Apply filters and sort for emergency contacts
  const applyContactFiltersAndSort = () => {
    let filtered = [...contacts];

    // Search filter
    if (contactSearchTerm.trim()) {
      filtered = filtered.filter(contact =>
        contact.contactName?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
        contact.contactPhone?.toLowerCase().includes(contactSearchTerm.toLowerCase())
      );
    }

    // Relationship filter
    if (relationshipFilter) {
      filtered = filtered.filter(contact => contact.relationship === relationshipFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;
      if (contactSortBy === "name") {
        compareValue = (a.contactName || "").localeCompare(b.contactName || "");
      } else if (contactSortBy === "phone") {
        compareValue = (a.contactPhone || "").localeCompare(b.contactPhone || "");
      } else if (contactSortBy === "relationship") {
        compareValue = a.relationship.localeCompare(b.relationship);
      }
      return contactSortOrder === "asc" ? compareValue : -compareValue;
    });

    setFilteredContacts(filtered);
    setContactCurrentPage(1); // Reset to first page when filters change
  };

  // Apply filters whenever contacts or filter criteria change
  useEffect(() => {
    applyContactFiltersAndSort();
  }, [contacts, contactSearchTerm, contactSortBy, contactSortOrder, relationshipFilter]);

  useEffect(() => {
    // Use emergency contacts from patient data first, then fallback to API call if needed
    if (patient.emergencyContacts && patient.emergencyContacts.length > 0) {
      setContacts(patient.emergencyContacts);
    } else if (patientId) {
      reloadContacts();
    }
    // eslint-disable-next-line
  }, [patient.emergencyContacts, patientId]);

  const handleView = (contact: EmergencyContact) => {
    setSelectedContact(contact);
  };

  const handleEdit = (contact: EmergencyContact) => {
    setEditContact(contact);
    setEditData({
      contactName: contact.contactName,
      contactPhone: contact.contactPhone,
      relationship: contact.relationship as "FAMILY" | "FRIEND" | "OTHERS",
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContact || !patientId) return;

    if (
      !editData.contactName ||
      !editData.contactPhone ||
      !editData.relationship ||
      !["FAMILY", "FRIEND", "OTHERS"].includes(editData.relationship)
    ) {
      setErrorModal(t("patientDetail.contacts.error.invalid"));
      return;
    }

    setLoading(true);
    try {
      let result: EmergencyContact | null = null;

      if (editContact.contactId === 0) {
        // ➡️ Trường hợp thêm mới
        result = await patientService.addEmergencyContact(
          Number(patientId),
          editData
        );
        setContacts((prev) => [...prev, result]);
      } else {
        // ➡️ Trường hợp cập nhật
        result = await patientService.updateEmergencyContact(
          Number(patientId),
          editContact.contactId,
          editData
        );
        setContacts((prev) =>
          prev.map((c) => (c.contactId === result.contactId ? result : c))
        );
      }

      // Reset form & modal
      setEditContact(null);
      setEditData({
        contactName: "",
        contactPhone: "",
        relationship: "FAMILY",
      });
    } catch (error: any) {
      console.error(t("patientDetail.contacts.error.saveLog"), error);

      let message = t("patientDetail.contacts.error.saveFailed");
      if (error?.response?.data) {
        if (Array.isArray(error.response.data)) {
          message = error.response.data
            .map((err: any) => err.message || JSON.stringify(err))
            .join("\n");
        } else if (typeof error.response.data === "object") {
          message = Object.values(error.response.data)
            .map((msg) => (Array.isArray(msg) ? msg.join(", ") : msg))
            .join("\n");
        } else if (error.response.data.message) {
          message = error.response.data.message;
        } else {
          message = JSON.stringify(error.response.data);
        }
      } else if (error?.message) {
        message = error.message;
      }
      setErrorModal(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteContact || !patientId) return;
    setLoading(true);
    try {
      // Đúng thứ tự: patientId trước, contactId sau
      await patientService.deleteEmergencyContact(
        Number(patientId),
        deleteContact.contactId
      );

      // Cập nhật lại state không cần reload API
      setContacts((prev) =>
        prev.filter((c) => c.contactId !== deleteContact.contactId)
      );

      setDeleteContact(null);
    } catch (error: any) {
      console.error(
        `Error deleting emergency contact ${deleteContact.contactId} for patient ${patientId}:`,
        error
      );
      setErrorModal(t("patientDetail.contacts.error.deleteFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-6 px-4 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 ml-1 flex justify-between items-center">
        {t('patientDetail.contacts.title')}
        <button
          onClick={() =>
            setEditContact({
              contactId: 0, 
              contactName: "",
              contactPhone: "",
              relationship: "FAMILY",
            } as EmergencyContact)
          }
          className="ml-4 px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
        >
          {t('common.addNew')}
        </button>
      </h2>

      {/* Search, Filter, and Sort Controls for Emergency Contacts */}
      <div className="mb-4 flex flex-wrap gap-4 items-center bg-gray-50 p-3 rounded-lg">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder={t('patientDetail.contacts.searchPlaceholder')}
            value={contactSearchTerm}
            onChange={(e) => setContactSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Relationship Filter */}
        <div className="min-w-[150px]">
          <select
            value={relationshipFilter}
            onChange={(e) => setRelationshipFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t("patientDetail.contacts.filters.allRelationships")}</option>
            <option value="FAMILY">{t("patientDetail.contacts.relationship.family")}</option>
            <option value="FRIEND">{t("patientDetail.contacts.relationship.friend")}</option>
            <option value="OTHERS">{t("patientDetail.contacts.relationship.others")}</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="min-w-[120px]">
          <select
            value={contactSortBy}
            onChange={(e) => setContactSortBy(e.target.value as "name" | "phone" | "relationship")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">{t("patientDetail.contacts.sortBy.name")}</option>
            <option value="phone">{t("patientDetail.contacts.sortBy.phone")}</option>
            <option value="relationship">{t("patientDetail.contacts.sortBy.relationship")}</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="flex gap-2">
          <button
            onClick={() => setContactSortOrder("asc")}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${contactSortOrder === "asc"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            {t("common.ascending")}
          </button>
          <button
            onClick={() => setContactSortOrder("desc")}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${contactSortOrder === "desc"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            {t("common.descending")}
          </button>
        </div>
      </div>

      {/* Results count */}
      {filteredContacts.length !== contacts.length && (
        <div className="mb-2 text-sm text-gray-600">
          Hiển thị {filteredContacts.length} / {contacts.length} liên hệ
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 bg-slate-600/10 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-gray-400"
                >
                  {t("patientDetail.contacts.table.name")}
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-gray-400"
                >
                  {t("patientDetail.contacts.table.phone")}
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-gray-400"
                >
                  {t("patientDetail.contacts.table.relationship")}
                </TableCell>
                <TableCell
                  isHeader
                  className="px-3 py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-gray-400"
                >
                  {t("common.actions")}
                </TableCell>
              </TableRow>
            </TableHeader>

            {filteredContacts && filteredContacts.length > 0 ? (
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {(() => {
                  const startIndex = (contactCurrentPage - 1) * contactItemsPerPage;
                  const endIndex = startIndex + contactItemsPerPage;
                  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

                  return paginatedContacts.map((contact) => (
                    <TableRow key={contact.contactId}>
                      <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-400">
                        {contact.contactName}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 text-theme-sm dark:text-gray-400">
                        {contact.contactPhone}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 text-theme-sm dark:text-gray-400">
                        {t(`patientDetail.contacts.relationship.${contact.relationship.toLowerCase()}`, { defaultValue: t("common.notAvailable") })}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-theme-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(contact)}
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
                            onClick={() => handleEdit(contact)}
                            className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 transition-colors"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-yellow-500"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            {t("common.edit")}
                          </button>
                          <button
                            onClick={() => setDeleteContact(contact)}
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
                  ));
                })()}
              </TableBody>
            ) : (
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="pl-4 py-2 text-gray-500 text-theme-sm dark:text-gray-400 text-center"
                  >
                    {contactSearchTerm || relationshipFilter
                      ? t("patientDetail.contacts.emptyFilter")
                      : t('patientDetail.contacts.empty')}
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
        </div>
      </div>

      {/* Pagination for Emergency Contacts */}
      {filteredContacts.length > 0 && (
        <Pagination
          currentPage={contactCurrentPage}
          totalPages={Math.ceil(filteredContacts.length / contactItemsPerPage)}
          onPageChange={setContactCurrentPage}
          itemsPerPage={contactItemsPerPage}
          totalItems={filteredContacts.length}
        />
      )}

      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">{t("patientDetail.contacts.detailTitle")}</h2>
            <div className="space-y-2">
              <div>
                <span className="font-medium">{t("patientDetail.contacts.table.name")}:</span>{" "}
                {selectedContact.contactName}
              </div>
              <div>
                <span className="font-medium">{t("patientDetail.contacts.table.phone")}:</span>{" "}
                {selectedContact.contactPhone}
              </div>
              <div>
                <span className="font-medium">{t("patientDetail.contacts.table.relationship")}:</span>{" "}
                {selectedContact.relationship === "FAMILY"
                  ? t("patientDetail.contacts.relationship.family")
                  : selectedContact.relationship === "FRIEND"
                    ? t("patientDetail.contacts.relationship.friend")
                    : selectedContact.relationship === "OTHERS"
                      ? t("patientDetail.contacts.relationship.others")
                      : "Chưa xác định"}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedContact(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {editContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">{t("patientDetail.contacts.editTitle")}</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">
                  {t("patientDetail.contacts.table.name")}
                </label>
                <input
                  name="contactName"
                  value={editData.contactName || ""}
                  onChange={(e) =>
                    setEditData((d) => ({ ...d, contactName: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">{t("patientDetail.contacts.table.phone")}</label>
                <input
                  name="contactPhone"
                  value={editData.contactPhone || ""}
                  onChange={(e) =>
                    setEditData((d) => ({ ...d, contactPhone: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">{t("patientDetail.contacts.table.relationship")}</label>
                <select
                  name="relationship"
                  value={editData.relationship || ""}
                  onChange={(e) =>
                    setEditData((d) => ({
                      ...d,
                      relationship: e.target
                        .value as EmergencyContact["relationship"],
                    }))
                  }
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">{t("patientDetail.contacts.selectRelationship")}</option>
                  <option value="FAMILY">{t("patientDetail.contacts.relationship.family")}</option>
                  <option value="FRIEND">{t("patientDetail.contacts.relationship.friend")}</option>
                  <option value="OTHERS">{t("patientDetail.contacts.relationship.others")}</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setEditContact(null)}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  disabled={loading}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-base-600 text-white rounded-lg hover:bg-base-700"
                  disabled={loading}
                >
                  {loading ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={!!deleteContact}
        onClose={() => setDeleteContact(null)}
        onConfirm={handleDelete}
        title={t('patientDetail.contacts.deleteConfirm.title')}
        message={
          deleteContact
            ? t("patientDetail.contacts.deleteConfirm.message", { name: deleteContact.contactName })
            : ""
        }
      />

      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-red-600">{t('common.error')}</h2>
            <p>{errorModal}</p>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setErrorModal(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// PaymentsContent
export function PaymentsContent() {
  const { t } = useTranslation();
  interface Payment {
    id: string;
    transactionDate: string;
    status: "Thành công" | "Lỗi" | "Đang chờ";
    amount: string;
    method: "Tiền mặt" | "Chuyển khoản" | "Thẻ";
  }

  const paymentData: Payment[] = [
    {
      id: "P2025-0045",
      transactionDate: "2025-02-15 12:50",
      status: "Đang chờ",
      amount: "2.250.000 VNĐ",
      method: "Thẻ",
    },
    {
      id: "P2025-0023",
      transactionDate: "2025-01-14 12:50",
      status: "Thành công",
      amount: "150.000 VNĐ",
      method: "Chuyển khoản",
    },
    {
      id: "P2025-0018",
      transactionDate: "2025-01-13 12:50",
      status: "Lỗi",
      amount: "150.000 VNĐ",
      method: "Chuyển khoản",
    },
    {
      id: "P2025-0011",
      transactionDate: "2025-01-12 12:50",
      status: "Thành công",
      amount: "500.000 VNĐ",
      method: "Tiền mặt",
    },
    {
      id: "P2025-0023",
      transactionDate: "2025-01-11 12:50",
      status: "Thành công",
      amount: "150.000 VNĐ",
      method: "Chuyển khoản",
    },
    {
      id: "P2025-0018",
      transactionDate: "2025-01-10 12:50",
      status: "Lỗi",
      amount: "150.000 VNĐ",
      method: "Chuyển khoản",
    },
    {
      id: "P2025-0011",
      transactionDate: "2025-01-08 12:50",
      status: "Đang chờ",
      amount: "500.000 VNĐ",
      method: "Tiền mặt",
    },
  ];
  return (
    <div className="bg-white py-6 px-4 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Thanh toán</h2>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 bg-slate-600/10 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-gray-400"
                >
                  Mã giao dịch
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-gray-400"
                >
                  Thời gian thanh toán
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 ml-30px py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-gray-400"
                >
                  Tình trạng
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-gray-400"
                >
                  Số tiền
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-gray-400"
                >
                  Phương thức
                </TableCell>
                <TableCell
                  isHeader
                  className="px-3 py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-gray-400"
                >
                  Hành động
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {paymentData.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm font-bold dark:text-gray-400">
                    GD{transaction.id.toString().padStart(4, "0")}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-700 text-theme-sm dark:text-gray-400">
                    {transaction.transactionDate}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-700 text-theme-sm dark:text-gray-400">
                    <Badge
                      size="sm"
                      color={
                        transaction.status === "Thành công"
                          ? "success"
                          : transaction.status === "Đang chờ"
                            ? "warning"
                            : "error"
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-green-700 font-semibold text-theme-sm dark:text-gray-400">
                    {transaction.amount}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-700 text-theme-sm dark:text-gray-400">
                    {transaction.method}
                  </TableCell>
                  <TableCell className="px-4 py-3 flex items-center text-gray-500 text-theme-md dark:text-gray-400">
                    <button className="flex items-center gap-2 px-5 py-1 text-xs font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-blue-200 transition-colors dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50">
                      <svg
                        className="stroke-current fill-white dark:fill-gray-800"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2.29004 5.90393H17.7067"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M17.7075 14.0961H2.29085"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
                          fill="currentColor"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
                          fill="currentColor"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
