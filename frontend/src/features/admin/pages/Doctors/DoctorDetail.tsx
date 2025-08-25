import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { doctorService } from "../../../../shared/services/doctorService";
import { userService } from "../../../../shared/services/userService";
import PageMeta from "../../components/common/PageMeta";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import ReturnButton from "../../components/ui/button/ReturnButton";
import type { Doctor } from "../../types/doctor";
import {
  ACADEMIC_DEGREE_LABELS,
  ACADEMIC_DEGREE_TO_BACKEND,
  ACADEMIC_DEGREE_FROM_BACKEND,
} from "../../types/doctor";

// Extended Doctor interface for DoctorDetail page with additional fields
interface DoctorDetailData extends Doctor {
  phone: string;
  email: string;
  consultationFee?: number;
}

export default function DoctorDetail() {
  const { doctorId } = useParams();
  const { t } = useTranslation();
  const {
    isOpen: isEditOpen,
    openModal: openEditModal,
    closeModal: closeEditModal,
  } = useModal();

  const [doctorData, setDoctorData] = useState<DoctorDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});

  useEffect(() => {
    if (!doctorId || isNaN(Number(doctorId))) {
      setLoading(false);
      setDoctorData(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch doctor data - API này đã trả về đầy đủ thông tin bao gồm department
        const response = await doctorService.getDoctorById(Number(doctorId));
        console.log("response", response);
        // Map the raw API response to Doctor type structure
        const data = {
          doctorId: (response as any).id,
          userId: (response as any).user?.id,
          identityNumber: (response as any).identity_number,
          fullName: `${(response as any).first_name || ""} ${
            (response as any).last_name || ""
          }`.trim(),
          birthday: (response as any).birthday,
          gender:
            (response as any).gender === "M"
              ? "MALE"
              : ("FEMALE" as "MALE" | "FEMALE"),
          ress: (response as any).address,
          academicDegree:
            ACADEMIC_DEGREE_FROM_BACKEND[(response as any).academic_degree] ||
            (response as any).academic_degree,
          specialization: (response as any).specialization,
          avatar: (response as any).avatar,
          type:
            (response as any).type === "S"
              ? "SERVICE"
              : ("EXAMINATION" as "EXAMINATION" | "SERVICE"),
          department: {
            id: (response as any).department?.id,
            department_name: (response as any).department?.department_name,
            description: (response as any).department?.description,
            created_at: (response as any).department?.created_at,
          },
          departmentId: (response as any).department?.id,
          departmentName: (response as any).department?.department_name,
          createdAt: (response as any).created_at,
        };

        // Create DoctorDetailData with proper mapping from API response
        const doctorDetailData: DoctorDetailData = {
          doctorId: data.doctorId,
          userId: data.userId,
          identityNumber: data.identityNumber,
          fullName: data.fullName,
          birthday: data.birthday,
          gender: data.gender,
          ress: data.ress,
          academicDegree: data.academicDegree,
          specialization: data.specialization,
          avatar: data.avatar,
          type: data.type,
          department: data.department,
          departmentId: data.departmentId,
          departmentName: data.departmentName,
          createdAt: data.createdAt,
          phone: (response as any).user?.phone || "0123456789",
          email: (response as any).user?.email || "",
          consultationFee: (response as any).price || 0,
        };

        setDoctorData(doctorDetailData);
      } catch (err) {
        console.error("❌ Error fetching doctor data:", err);
        console.error("❌ Error details:", {
          message: (err as any).message,
          status: (err as any).response?.status,
          data: (err as any).response?.data,
          config: (err as any).config,
        });
        setDoctorData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [doctorId]);

  const handleSave = async () => {
    if (!doctorData) return;

    setSaving(true);
    try {
      // Tìm form trong modal edit
      let form = document.querySelector(
        '[data-modal="edit-doctor"] form'
      ) as HTMLFormElement;
      if (!form) {
        const alternativeForm = document.querySelector(
          ".modal form"
        ) as HTMLFormElement;
        if (!alternativeForm) {
          const lastResortForm = document.querySelector(
            "form"
          ) as HTMLFormElement;
          if (!lastResortForm) {
            throw new Error("No form found anywhere on the page");
          }
          form = lastResortForm;
        } else {
          form = alternativeForm;
        }
      }

      // Lấy form values
      let values: any = {};
      try {
        const formData = new FormData(form);
        values = Object.fromEntries(formData.entries());
      } catch (error) {
        const inputs = form.querySelectorAll("input, select, textarea");
        inputs.forEach((input: any) => {
          if (input.name) {
            values[input.name] = input.value;
          }
        });
      }

      console.log("Form values:", values);

      // Chuẩn bị data để gửi lên API
      const updateData: any = {};

      // Map các fields từ form sang API fields
      if (values.fullName && values.fullName.trim() !== doctorData.fullName) {
        const nameParts = values.fullName.trim().split(" ");
        updateData.first_name = nameParts[0] || "";
        updateData.last_name = nameParts.slice(1).join(" ") || "";
      }

      if (
        values.identityNumber &&
        values.identityNumber.trim() !== doctorData.identityNumber
      ) {
        updateData.identity_number = values.identityNumber.trim();
      }

      if (values.birthday && values.birthday !== doctorData.birthday) {
        updateData.birthday = values.birthday;
      }

      if (values.gender && values.gender !== doctorData.gender) {
        updateData.gender = values.gender === "MALE" ? "M" : "F";
      }

      if (
        values.academicDegree &&
        values.academicDegree !== doctorData.academicDegree
      ) {
        updateData.academic_degree =
          ACADEMIC_DEGREE_TO_BACKEND[values.academicDegree];
      }

      if (
        values.specialization &&
        values.specialization.trim() !== doctorData.specialization
      ) {
        updateData.specialization = values.specialization.trim();
      }

      if (values.type && values.type !== doctorData.type) {
        updateData.type = values.type === "EXAMINATION" ? "E" : "S";
      }

      if (
        values.departmentId &&
        parseInt(values.departmentId) !== doctorData.departmentId
      ) {
        updateData.department_id = parseInt(values.departmentId);
      }

      if (values.ress && values.ress.trim() !== doctorData.ress) {
        updateData.address = values.ress.trim();
      }

      if (
        values.consultationFee &&
        parseFloat(values.consultationFee) !== doctorData.consultationFee
      ) {
        updateData.price = parseFloat(values.consultationFee);
      }

      // User fields
      if (values.phone && values.phone.trim() !== doctorData.phone) {
        updateData.phone = values.phone.trim();
      }

      if (values.email && values.email.trim() !== doctorData.email) {
        updateData.email = values.email.trim();
      }

      console.log("Update data:", updateData);

      // Kiểm tra xem có thay đổi gì không
      if (Object.keys(updateData).length === 0) {
        alert(t("doctors.detail.saveSuccess"));
        closeEditModal();
        return;
      }

      // Gọi API cập nhật doctor (sẽ cập nhật cả doctor và user)
      const updatedDoctor = await doctorService.updateDoctor(
        doctorData.doctorId!,
        updateData
      );

      console.log("Doctor updated successfully:", updatedDoctor);

      // Hiển thị thông báo thành công
      alert(t("doctors.detail.saveSuccess"));
      closeEditModal();

      // Refresh data từ server
      window.location.reload();
    } catch (error) {
      console.error("Error updating doctor:", error);

      if ((error as any).response) {
        console.error("Response data:", (error as any).response.data);
        console.error("Response status:", (error as any).response.status);
      }

      alert(t("doctors.detail.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-base-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          {t("common.loading")}
        </p>
      </div>
    );
  if (!doctorData)
    return (
      <div className="text-center py-10">
        <p className="text-gray-600 dark:text-gray-400">
          {t("common.noDataFound")}
        </p>
      </div>
    );

  return (
    <div className="min-h-screen">
      <PageMeta
        title={t("doctors.detail.pageTitle")}
        description={t("doctors.detail.pageDescription")}
      />

      {/* Header */}
      <div className="bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ReturnButton />
            <h1 className="text-xl font-semibold text-gray-900">
              {t("doctors.detail.title")}
            </h1>
          </div>
          <button
            onClick={openEditModal}
            className="px-6 py-[10px] bg-base-600 text-white rounded-lg hover:bg-base-700 font-medium transition-colors"
          >
            {t("doctors.detail.edit")}
          </button>
        </div>
      </div>

      <div className="mx-auto pt-6">
        <div className="space-y-6">
          {/* Account Information Section */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t("doctors.detail.accountInfo")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t("doctors.detail.accountInfo")}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t("common.avatar")}
                  </label>
                  <div className="size-30 rounded-xl border-2 border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img
                      src={doctorData.avatar || "/placeholder.svg"}
                      alt="Doctor Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Form Fields */}
                <div className="lg:col-span-4">
                  <div className="grid grid-row gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("authorization.phoneNumber")}
                      </label>
                      <input
                        type="tel"
                        value={doctorData.phone || ""}
                        disabled
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("common.email")}
                      </label>
                      <input
                        type="email"
                        value={doctorData.email || ""}
                        disabled
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t("doctors.detail.personalInfo.title")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t("doctors.detail.personalInfo.description")}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("common.doctorId")}
                  </label>
                  <input
                    type="text"
                    value={doctorData.doctorId?.toString() || ""}
                    disabled
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.personalInfo.fullName")}
                  </label>
                  <input
                    type="text"
                    value={doctorData.fullName}
                    disabled
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.personalInfo.identityNumber")}
                  </label>
                  <input
                    type="text"
                    value={doctorData.identityNumber || ""}
                    disabled
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.personalInfo.birthday")}
                  </label>
                  <input
                    type="date"
                    value={doctorData.birthday}
                    disabled
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.personalInfo.gender")}
                  </label>
                  <input
                    type="text"
                    value={
                      doctorData.gender === "MALE"
                        ? t("doctors.detail.personalInfo.genderMale")
                        : doctorData.gender === "FEMALE"
                        ? t("doctors.detail.personalInfo.genderFemale")
                        : t("doctors.detail.personalInfo.genderOther")
                    }
                    disabled
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.personalInfo.address")}
                  </label>
                  <textarea
                    value={doctorData.ress}
                    disabled
                    rows={3}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information Section */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t("doctors.detail.professionalInfo.title")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t("doctors.detail.professionalInfo.description")}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.professionalInfo.department")}
                  </label>
                  <input
                    type="text"
                    value={doctorData.departmentName || ""}
                    disabled
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.professionalInfo.academicDegree")}
                  </label>
                  <input
                    type="text"
                    value={
                      ACADEMIC_DEGREE_LABELS[
                        doctorData.academicDegree as keyof typeof ACADEMIC_DEGREE_LABELS
                      ] || doctorData.academicDegree
                    }
                    disabled
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.professionalInfo.specialization")}
                  </label>
                  <input
                    type="text"
                    value={doctorData.specialization}
                    disabled
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.professionalInfo.type")}
                  </label>
                  <input
                    type="text"
                    value={
                      doctorData.type === "EXAMINATION"
                        ? t("doctors.detail.professionalInfo.typeExamination")
                        : t("doctors.detail.professionalInfo.typeService")
                    }
                    disabled
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.professionalInfo.consultationFee")}
                  </label>
                  <input
                    type="text"
                    value={
                      doctorData.consultationFee
                        ? doctorData.consultationFee.toLocaleString("vi-VN")
                        : "0"
                    }
                    disabled
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Doctor Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={closeEditModal}
        className="max-w-[800px] m-4"
        data-modal="edit-doctor"
      >
        <div className="relative w-full p-6 overflow-y-auto custom-scrollbar bg-white rounded-2xl max-h-[80vh]">
          <div className="mb-6">
            <h4 className="mb-2 text-lg font-semibold text-gray-900">
              {t("doctors.detail.editModal.title")}
            </h4>
            <p className="text-sm text-gray-500">
              {t("doctors.detail.editModal.description")}
            </p>
          </div>

          <form className="space-y-6">
            {/* Personal Information */}
            <div>
              <h5 className="text-base font-medium text-gray-900 mb-4">
                {t("doctors.detail.editModal.personalInfoTitle")}
              </h5>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("common.doctorId")}
                  </label>
                  <input
                    type="text"
                    value={doctorData.doctorId?.toString() || ""}
                    disabled
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("authorization.phoneNumber")}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={doctorData.phone || ""}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                    placeholder={t("doctors.detail.editModal.phonePlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("common.email")}
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={doctorData.email || ""}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                    placeholder={t("doctors.detail.editModal.emailPlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.personalInfo.fullName")}
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    defaultValue={doctorData.fullName}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.personalInfo.identityNumber")}
                  </label>
                  <input
                    type="text"
                    name="identityNumber"
                    defaultValue={doctorData.identityNumber}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.personalInfo.birthday")}
                  </label>
                  <input
                    type="date"
                    name="birthday"
                    defaultValue={doctorData.birthday}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.personalInfo.gender")}
                  </label>
                  <select
                    name="gender"
                    defaultValue={doctorData.gender}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                  >
                    <option value="MALE">
                      {t("doctors.detail.personalInfo.genderMale")}
                    </option>
                    <option value="FEMALE">
                      {t("doctors.detail.personalInfo.genderFemale")}
                    </option>
                    <option value="OTHER">
                      {t("doctors.detail.personalInfo.genderOther")}
                    </option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.personalInfo.address")}
                  </label>
                  <textarea
                    name="ress"
                    rows={3}
                    defaultValue={doctorData.ress}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h5 className="text-base font-medium text-gray-900 mb-4">
                {t("doctors.detail.editModal.professionalInfoTitle")}
              </h5>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.professionalInfo.department")}
                  </label>
                  <select
                    name="departmentId"
                    defaultValue={doctorData.departmentId}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                  >
                    <option value="">
                      {t(
                        "doctors.detail.editModal.departmentSelectPlaceholder"
                      )}
                    </option>
                    {/* The departments state was removed, so this loop will not work as intended.
                        This part of the code will need to be refactored if department selection is required. */}
                    {/* For now, we'll just show a placeholder or remove if not needed */}
                    <option value="1">Khoa Nội</option>
                    <option value="2">Khoa Ngoại</option>
                    <option value="3">Khoa Tai Mũi Họng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.professionalInfo.academicDegree")}
                  </label>
                  <select
                    name="academicDegree"
                    defaultValue={doctorData.academicDegree}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                  >
                    {Object.entries(ACADEMIC_DEGREE_LABELS).map(
                      ([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.professionalInfo.specialization")}
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    defaultValue={doctorData.specialization}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.professionalInfo.type")}
                  </label>
                  <select
                    name="type"
                    defaultValue={doctorData.type}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                  >
                    <option value="EXAMINATION">
                      {t("doctors.detail.professionalInfo.typeExamination")}
                    </option>
                    <option value="SERVICE">
                      {t("doctors.detail.professionalInfo.typeService")}
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("doctors.detail.professionalInfo.consultationFee")}
                  </label>
                  <input
                    type="number"
                    name="consultationFee"
                    defaultValue={doctorData.consultationFee}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-6 py-[10px] border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                {t("doctors.detail.editModal.cancelButton")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-[10px] bg-base-600 text-white rounded-lg hover:bg-base-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? t("doctors.detail.editModal.savingButton")
                  : t("doctors.detail.editModal.saveButton")}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
