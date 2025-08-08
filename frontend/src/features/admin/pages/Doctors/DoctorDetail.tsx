import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doctorService } from "../../../../shared/services/doctorService";
import PageMeta from "../../components/common/PageMeta";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import ReturnButton from "../../components/ui/button/ReturnButton";
import type { Doctor } from "../../types/doctor";
import { ACADEMIC_DEGREE_LABELS } from "../../types/doctor";

// Extended Doctor interface for DoctorDetail page with additional fields
interface DoctorDetailData extends Doctor {
  phone: string;
  email: string;
  consultationFee?: number;
}

export default function DoctorDetail() {
  const { doctorId } = useParams();
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
          address: (response as any).address,
          academicDegree: (response as any).academic_degree,
          specialization: (response as any).specialization,
          avatar: (response as any).avatar,
          type:
            (response as any).type === "S"
              ? "SERVICE"
              : ("EXAMINATION" as "EXAMINATION" | "SERVICE"),
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
          address: data.address,
          academicDegree: data.academicDegree,
          specialization: data.specialization,
          avatar: data.avatar,
          type: data.type,
          departmentId: data.departmentId,
          departmentName: data.departmentName,
          createdAt: data.createdAt,
          phone: (response as any).user?.phone || "0123456789",
          email: (response as any).user?.email || "",
          consultationFee: (response as any).consultation_fee || 0,
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
      const form = document.querySelector("form") as HTMLFormElement;
      if (!form) {
        throw new Error("Form not found");
      }
      const inputs = form.querySelectorAll("input, select, textarea");
      const values: any = {};
      inputs.forEach((input: any) => {
        if (input.name) {
          values[input.name] = input.value;
        }
      });

      if (!values.fullName || values.fullName.trim() === "") {
        throw new Error("Họ tên không được để trống");
      }
      if (!values.identityNumber || values.identityNumber.trim() === "") {
        throw new Error("Số CMND/CCCD không được để trống");
      }
      if (!values.specialization || values.specialization.trim() === "") {
        throw new Error("Chuyên môn không được để trống");
      }
      if (!values.phone || values.phone.trim() === "") {
        throw new Error("Số điện thoại không được để trống");
      }

      const updateData = {
        phone: values.phone?.trim() || doctorData.phone || "0123456789",
        identityNumber: values.identityNumber.trim(),
        fullName: values.fullName.trim(),
        birthday: values.birthday,
        gender: values.gender,
        academicDegree: values.academicDegree,
        specialization: values.specialization.trim(),
        type: values.type || doctorData.type,
        departmentId: parseInt(values.departmentId) || doctorData.departmentId,
        email: values.email?.trim() || doctorData.email || "",
        address: values.address || "",
        avatar: doctorData.avatar || "",
        consultationFee:
          parseFloat(values.consultationFee) || doctorData.consultationFee || 0,
        doctorId: doctorData.doctorId,
        userId: doctorData.userId,
        createdAt: doctorData.createdAt,
      };

      const updatedDoctor = await doctorService.updateDoctor(
        doctorData.doctorId!,
        updateData
      );

      // Map the raw API response to Doctor type structure
      const updatedData = {
        doctorId: (updatedDoctor as any).id,
        userId: (updatedDoctor as any).user?.id,
        identityNumber: (updatedDoctor as any).identity_number,
        fullName: `${(updatedDoctor as any).first_name || ""} ${
          (updatedDoctor as any).last_name || ""
        }`.trim(),
        birthday: (updatedDoctor as any).birthday,
        gender:
          (updatedDoctor as any).gender === "M"
            ? "MALE"
            : ("FEMALE" as "MALE" | "FEMALE"),
        address: (updatedDoctor as any).address,
        academicDegree: (updatedDoctor as any).academic_degree,
        specialization: (updatedDoctor as any).specialization,
        avatar: (updatedDoctor as any).avatar,
        type:
          (updatedDoctor as any).type === "S"
            ? "SERVICE"
            : ("EXAMINATION" as "EXAMINATION" | "SERVICE"),
        departmentId: (updatedDoctor as any).department?.id,
        departmentName: (updatedDoctor as any).department?.department_name,
        createdAt: (updatedDoctor as any).created_at,
      };

      // Create updated DoctorDetailData
      const updatedDoctorDetailData: DoctorDetailData = {
        doctorId: updatedData.doctorId,
        userId: updatedData.userId,
        identityNumber: updatedData.identityNumber,
        fullName: updatedData.fullName,
        birthday: updatedData.birthday,
        gender: updatedData.gender,
        address: updatedData.address,
        academicDegree: updatedData.academicDegree,
        specialization: updatedData.specialization,
        avatar: updatedData.avatar,
        type: updatedData.type,
        departmentId: updatedData.departmentId,
        departmentName: updatedData.departmentName,
        createdAt: updatedData.createdAt,
        phone: (updatedDoctor as any).user?.phone || doctorData.phone,
        email: (updatedDoctor as any).user?.email || doctorData.email,
        consultationFee:
          (updatedDoctor as any).consultation_fee || doctorData.consultationFee,
      };

      setDoctorData(updatedDoctorDetailData);

      alert("Cập nhật thông tin bác sĩ thành công!");
      closeEditModal();
    } catch (error) {
      console.error("Error updating doctor:", error);
      alert("Có lỗi xảy ra khi cập nhật thông tin bác sĩ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-base-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Đang tải dữ liệu...</p>
      </div>
    );
  if (!doctorData)
    return (
      <div className="text-center py-10">
        <p className="text-gray-600 dark:text-gray-400">
          Không tìm thấy bác sĩ
        </p>
      </div>
    );

  return (
    <div className="min-h-screen">
      <PageMeta
        title={`${doctorData.fullName} | Hồ sơ Bác sĩ`}
        description={`Thông tin chi tiết về ${doctorData.fullName} - ${doctorData.specialization}`}
      />

      {/* Header */}
      <div className="bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ReturnButton />
            <h1 className="text-xl font-semibold text-gray-900">
              Hồ sơ bác sĩ: {doctorData.fullName}
            </h1>
          </div>
          <button
            onClick={openEditModal}
            className="px-6 py-[10px] bg-base-600 text-white rounded-lg hover:bg-base-700 font-medium transition-colors"
          >
            Chỉnh sửa
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
                    Thông tin tài khoản
                  </h2>
                  <p className="text-sm text-gray-500">
                    Thông tin đăng nhập và liên hệ
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Ảnh đại diện
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
                        Số điện thoại
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
                        Email
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
                    Thông tin cá nhân
                  </h2>
                  <p className="text-sm text-gray-500">
                    Thông tin cơ bản của bác sĩ
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã bác sĩ
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
                    Họ và tên
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
                    Số CMND/CCCD
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
                    Ngày sinh
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
                    Giới tính
                  </label>
                  <input
                    type="text"
                    value={
                      doctorData.gender === "MALE"
                        ? "Nam"
                        : doctorData.gender === "FEMALE"
                        ? "Nữ"
                        : "Khác"
                    }
                    disabled
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <textarea
                    value={doctorData.address}
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
                    Thông tin chuyên môn
                  </h2>
                  <p className="text-sm text-gray-500">
                    Trình độ, chuyên ngành và khoa làm việc của bác sĩ
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Khoa
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
                    Học hàm học vị
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
                    Chuyên môn
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
                    Loại bác sĩ
                  </label>
                  <input
                    type="text"
                    value={
                      doctorData.type === "EXAMINATION"
                        ? "Khám bệnh"
                        : "Dịch vụ"
                    }
                    disabled
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phí khám (VNĐ)
                  </label>
                  <input
                    type="text"
                    value={
                      doctorData.consultationFee?.toLocaleString("vi-VN") || "0"
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
      >
        <div className="relative w-full p-6 overflow-y-auto custom-scrollbar bg-white rounded-2xl max-h-[80vh]">
          <div className="mb-6">
            <h4 className="mb-2 text-lg font-semibold text-gray-900">
              Chỉnh sửa thông tin bác sĩ
            </h4>
            <p className="text-sm text-gray-500">
              Cập nhật thông tin chi tiết của bác sĩ.
            </p>
          </div>

          <form className="space-y-6">
            {/* Personal Information */}
            <div>
              <h5 className="text-base font-medium text-gray-900 mb-4">
                Thông tin cá nhân
              </h5>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã bác sĩ
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
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={doctorData.phone || ""}
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={doctorData.email || ""}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                    placeholder="Nhập email (không bắt buộc)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    defaultValue={doctorData.fullName}
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số CMND/CCCD *
                  </label>
                  <input
                    type="text"
                    name="identityNumber"
                    defaultValue={doctorData.identityNumber}
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày sinh
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
                    Giới tính
                  </label>
                  <select
                    name="gender"
                    defaultValue={doctorData.gender}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <textarea
                    name="address"
                    rows={3}
                    defaultValue={doctorData.address}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h5 className="text-base font-medium text-gray-900 mb-4">
                Thông tin chuyên môn
              </h5>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Khoa
                  </label>
                  <select
                    name="departmentId"
                    defaultValue={doctorData.departmentId}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                  >
                    <option value="">-- Chọn khoa --</option>
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
                    Học hàm học vị
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
                    Chuyên môn
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
                    Loại bác sĩ
                  </label>
                  <select
                    name="type"
                    defaultValue={doctorData.type}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                  >
                    <option value="EXAMINATION">Khám bệnh</option>
                    <option value="SERVICE">Dịch vụ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phí khám (VNĐ)
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
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-[10px] bg-base-600 text-white rounded-lg hover:bg-base-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
