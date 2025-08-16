import type { FormEvent } from "react";
import { useState } from "react";
import { Calendar, ChevronDown, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { patientService } from "../../services/patientService";
import { parse, format } from "date-fns";
import ReturnButton from "../../components/ui/button/ReturnButton";
import type { EmergencyContactDto } from "../../types/patient";

export default function PatientAddForm() {
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    identity_number: "",
    insurance_number: "",
    first_name: "",
    last_name: "",
    birthday: "",
    avatar: "",
    gender: "M",
    address: "",
    allergies: "",
    height: undefined,
    weight: undefined,
    blood_type: "O",
  });
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactDto[]>([]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number" ? (value === "" ? undefined : Number(value)) : value,
    }));
  };

  const addEmergencyContact = () => {
    setEmergencyContacts([
      ...emergencyContacts,
      {
        contactName: "",
        contactPhone: "",
        relationship: "FAMILY",
      },
    ]);
  };

  const removeEmergencyContact = (index: number) => {
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  };

  const updateEmergencyContact = (index: number, field: keyof EmergencyContactDto, value: string) => {
    const updated = [...emergencyContacts];
    updated[index] = { ...updated[index], [field]: value };
    setEmergencyContacts(updated);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const birthday =
        formData.birthday && formData.birthday.includes("/")
          ? format(
              parse(formData.birthday, "dd/MM/yyyy", new Date()),
              "yyyy-MM-dd"
            )
          : formData.birthday;
      const dataToSend = { 
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        identity_number: formData.identity_number,
        insurance_number: formData.insurance_number,
        first_name: formData.first_name,
        last_name: formData.last_name,
        birthday,
        avatar: formData.avatar,
        gender: formData.gender as "MALE" | "FEMALE" | "OTHER",
        address: formData.address,
        allergies: formData.allergies,
        height: formData.height,
        weight: formData.weight,
        bloodType: formData.blood_type,
        emergencyContactDtos: emergencyContacts.filter(contact => 
          contact.contactName.trim() && contact.contactPhone.trim()
        )
      };
      console.log("📤 Data being sent to API:", dataToSend);
      await patientService.createPatient(dataToSend);
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        navigate("/admin/patients");
      }, 1500);
    } catch (error: any) {
      alert(
        "Có lỗi khi thêm bệnh nhân!\n" + JSON.stringify(error.response?.data)
      );
      console.error(error);
    }
  };

  return (
    <div className="relative">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

          {/* Modal Content */}
          <div className="relative bg-white rounded-lg p-6 w-[320px] shadow-lg animate-fadeIn">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 p-2 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Thêm bệnh nhân thành công!
              </h3>
              <p className="text-sm text-gray-500">
                Đang chuyển hướng về trang danh sách bệnh nhân...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center mb-6">
        <Link
          to="/admin/patients"
          className="text-base-600 hover:text-base-700 flex items-center"
        >
          <ReturnButton />
          <span className="text-xl font-semibold text-base-600">
            Thêm bệnh nhân
          </span>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-base-600 font-medium">
                  Họ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="VD: Nguyễn"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-500/20 focus:border-base-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-base-600 font-medium">
                  Tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="VD: Văn A"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-500/20 focus:border-base-500"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-base-600 font-medium">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="VD: email@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-500/20 focus:border-base-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-base-600 font-medium">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-500/20 focus:border-base-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-base-600 font-medium">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="VD: 0917165628"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-500/20 focus:border-base-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-base-600 font-medium">
                CCCD/CMND <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="identity_number"
                value={formData.identity_number}
                onChange={handleChange}
                placeholder="VD: 0123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-500/20 focus:border-base-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-base-600 font-medium">BHYT</label>
              <input
                type="text"
                name="insurance_number"
                value={formData.insurance_number}
                onChange={handleChange}
                placeholder="VD: ytaucsonns"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-500/20 focus:border-base-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-base-600 font-medium">
                Ngày sinh <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChange}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-500/20 focus:border-base-500"
                  required
                />
                <Calendar
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-base-600 font-medium">
                Giới tính
              </label>
              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-500 appearance-none"
                >
                  <option value="OTHER">Khác</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="block text-base-600 font-medium">Địa chỉ</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Nhập địa chỉ"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-500/20 focus:border-base-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-base-600 font-medium">Dị ứng</label>
              <input
                type="text"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                placeholder="Nhập dị ứng (nếu có)"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-500/20 focus:border-base-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-base-600 font-medium">
                Chiều cao (cm)
              </label>
              <input
                type="number"
                name="height"
                value={formData.height ?? ""}
                onChange={handleChange}
                min={0}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-500/20 focus:border-base-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-base-600 font-medium">
                Cân nặng (kg)
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight ?? ""}
                onChange={handleChange}
                min={0}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-500/20 focus:border-base-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-base-600 font-medium">
                Nhóm máu
              </label>
              <select
                name="blood_type"
                value={formData.blood_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-500"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          {/* Emergency Contacts Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-base-600">
                Thông tin liên lạc khẩn cấp
              </h3>
              <button
                type="button"
                onClick={addEmergencyContact}
                className="flex items-center gap-2 px-4 py-2 bg-base-600 text-white rounded-md hover:bg-base-700 focus:outline-none focus:ring-2 focus:ring-base-500"
              >
                <Plus size={16} />
                Thêm liên hệ
              </button>
            </div>
            
            {emergencyContacts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Chưa có thông tin liên lạc khẩn cấp. Nhấn "Thêm liên hệ" để thêm.
              </p>
            ) : (
              <div className="space-y-4">
                {emergencyContacts.map((contact, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-700">
                        Liên hệ khẩn cấp #{index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeEmergencyContact(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Tên người liên hệ <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={contact.contactName}
                          onChange={(e) => updateEmergencyContact(index, 'contactName', e.target.value)}
                          placeholder="VD: Nguyễn Văn A"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-500/20 focus:border-base-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={contact.contactPhone}
                          onChange={(e) => updateEmergencyContact(index, 'contactPhone', e.target.value)}
                          placeholder="VD: 0987654321"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-500/20 focus:border-base-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Mối quan hệ
                        </label>
                        <select
                          value={contact.relationship}
                          onChange={(e) => updateEmergencyContact(index, 'relationship', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-base-500"
                        >
                          <option value="FAMILY">Gia đình</option>
                          <option value="FRIEND">Bạn bè</option>
                          <option value="OTHERS">Khác</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8 justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-base-600 text-white font-medium rounded-md hover:bg-base-700 focus:outline-none focus:ring-2 focus:ring-base-500 focus:ring-offset-2"
            >
              Lưu thông tin
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              onClick={() => navigate("/admin/patients")}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
