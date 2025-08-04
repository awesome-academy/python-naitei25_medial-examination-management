"use client";
import React, { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useRegister } from "../context/RegisterContext";
import authService from "../../../shared/services/authService";
import { message } from "antd";

const RegisterDetail: React.FC = () => {
  const { registerData, setRegisterData, clearRegisterData } = useRegister();
  const navigate = useNavigate();

  // Kiểm tra xem có dữ liệu đăng ký không
  useEffect(() => {
    if (!registerData.email && !registerData.phone) {
      message.error("Không tìm thấy thông tin đăng ký. Vui lòng đăng ký lại.");
      navigate("/register");
    }
  }, [registerData, navigate]);

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "O">("M");
  const [cccd, setCccd] = useState("");
  const [healthInsurance, setHealthInsurance] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<{
    fullName?: string;
    dateOfBirth?: string;
    gender?: string;
    cccd?: string;
    healthInsurance?: string;
    address?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: {
      fullName?: string;
      dateOfBirth?: string;
      gender?: string;
      cccd?: string;
      healthInsurance?: string;
      address?: string;
    } = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Họ tên không được để trống.";
    }

    if (!dateOfBirth) {
      newErrors.dateOfBirth = "Ngày sinh không được để trống.";
    } else {
      const today = new Date();
      const dob = new Date(dateOfBirth);
      if (dob >= today) {
        newErrors.dateOfBirth = "Ngày sinh không hợp lệ.";
      }
    }

    if (!gender) {
      newErrors.gender = "Vui lòng chọn giới tính.";
    }

    if (!cccd.trim()) {
      newErrors.cccd = "CCCD không được để trống.";
    } else if (!/^\d{12}$/.test(cccd.trim())) {
      newErrors.cccd = "CCCD phải là 12 chữ số.";
    }

    if (healthInsurance.trim() && !/^[A-Za-z]{2}\d{8}$/.test(healthInsurance.trim())) {
      newErrors.healthInsurance = "Bảo hiểm y tế phải có 10 ký tự, bắt đầu bằng 2 chữ cái và theo sau là 8 chữ số.";
    }

    if (!address.trim()) {
      newErrors.address = "Địa chỉ không được để trống.";
    } else if (address.trim().length > 255) {
      newErrors.address = "Địa chỉ không được vượt quá 255 ký tự.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    // Kiểm tra lại registerData trước khi gửi
    if (!registerData.email && !registerData.phone) {
      message.error("Thiếu thông tin email hoặc số điện thoại. Vui lòng đăng ký lại.");
      navigate("/register");
      return;
    }

    if (!registerData.password) {
      message.error("Thiếu thông tin mật khẩu. Vui lòng đăng ký lại.");
      navigate("/register");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        email: registerData.email || undefined,
        phone: registerData.phone || undefined,
        password: registerData.password,
        fullName: fullName.trim(),
        dateOfBirth,
        gender,
        cccd: cccd.trim(),
        healthInsurance: healthInsurance.trim() || undefined,
        address: address.trim(),
        role: "P" as const,
      };

      console.log("Payload gửi đi:", payload);

      const response = await authService.register(payload);
      message.success(response.message || "Đăng ký thành công! Đã gửi OTP. Vui lòng kiểm tra email hoặc số điện thoại.");

      // Lưu thông tin vào registerData để sử dụng ở bước xác minh
      setRegisterData({
        ...registerData,
        email: response.email,
        phone: response.phone,
      });

      navigate("/verify-otp", {
        state: {
          email: response.email,
          phone: response.phone,
        },
      });
    } catch (error: any) {
      console.error("Lỗi đăng ký:", error);
      if (error.message?.includes("email")) {
        message.error("Email đã được sử dụng. Vui lòng sử dụng email khác.");
      } else if (error.message?.includes("phone")) {
        message.error("Số điện thoại đã được sử dụng. Vui lòng sử dụng số điện thoại khác.");
      } else if (error.message?.includes("CCCD")) {
        message.error("CCCD đã được sử dụng. Vui lòng kiểm tra lại.");
      } else {
        message.error(error.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-10 relative font-outfit bg-gray-50">
      <div
        className="absolute inset-0 bg-gradient-to-r animate-gradient opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-brand-200), var(--color-base-300), var(--color-brand-200))",
        }}
      ></div>
      <style>
        {`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 20s ease infinite;
          }
          .input-focus {
            transition: all 0.3s ease;
          }
          .input-focus:focus {
            transform: scale(1.02);
            box-shadow: var(--shadow-focus-ring);
            border-color: var(--color-brand-400);
          }
          .button-hover {
            transition: all 0.3s ease;
          }
          .button-hover:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: var(--shadow-theme-sm);
            background-color: var(--color-warning-600);
          }
          .fade-in {
            animation: fadeIn 0.5s ease-in;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      <div className="w-full max-w-6xl flex rounded-lg shadow-theme-lg overflow-hidden relative z-[var(--z-index-9)]">
        <div
          className="w-1/2 hidden md:block bg-cover bg-center"
          style={{
            backgroundImage: "url('/public/images/auth/register.png')",
          }}
        ></div>
        <div className="w-full md:w-1/2 bg-gray-50 p-8 fade-in">
          <div className="flex justify-center mb-6">
            <img
              className="w-30 pb-10 pt-10"
              src="/public/images/logo/logo.png"
              alt="logo"
            />
          </div>
          <h2 className="text-title-md font-bold text-center text-gray-900 mb-6">
            Hoàn tất thông tin
          </h2>
          <div className="text-center text-gray-600 text-theme-sm mb-8">
            <p>Vui lòng nhập thông tin cá nhân để hoàn tất đăng ký.</p>
          </div>
          <div className="w-3/4 mx-auto h-px bg-gray-300 mb-8"></div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="fullName"
                className="block text-theme-sm font-medium text-gray-700"
              >
                Họ tên <span className="text-error-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setErrors((prev) => ({ ...prev, fullName: "" }));
                }}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none input-focus text-gray-800"
                placeholder="Nhập họ tên của bạn"
              />
              {errors.fullName && (
                <p className="text-error-500 text-theme-xs mt-1">{errors.fullName}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="dateOfBirth"
                className="block text-theme-sm font-medium text-gray-700"
              >
                Ngày sinh <span className="text-error-500">*</span>
              </label>
              <input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => {
                  setDateOfBirth(e.target.value);
                  setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
                }}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none input-focus text-gray-800"
              />
              {errors.dateOfBirth && (
                <p className="text-error-500 text-theme-xs mt-1">{errors.dateOfBirth}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="gender"
                className="block text-theme-sm font-medium text-gray-700"
              >
                Giới tính <span className="text-error-500">*</span>
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value as "M" | "F" | "O");
                  setErrors((prev) => ({ ...prev, gender: "" }));
                }}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none input-focus text-gray-800"
              >
                <option value="M">Nam</option>
                <option value="F">Nữ</option>
                <option value="O">Khác</option>
              </select>
              {errors.gender && (
                <p className="text-error-500 text-theme-xs mt-1">{errors.gender}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="cccd"
                className="block text-theme-sm font-medium text-gray-700"
              >
                CCCD <span className="text-error-500">*</span>
              </label>
              <input
                id="cccd"
                type="text"
                value={cccd}
                onChange={(e) => {
                  setCccd(e.target.value);
                  setErrors((prev) => ({ ...prev, cccd: "" }));
                }}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none input-focus text-gray-800"
                placeholder="Nhập số CCCD (12 chữ số)"
              />
              {errors.cccd && (
                <p className="text-error-500 text-theme-xs mt-1">{errors.cccd}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="healthInsurance"
                className="block text-theme-sm font-medium text-gray-700"
              >
                Bảo hiểm y tế
              </label>
              <input
                id="healthInsurance"
                type="text"
                value={healthInsurance}
                onChange={(e) => {
                  setHealthInsurance(e.target.value);
                  setErrors((prev) => ({ ...prev, healthInsurance: "" }));
                }}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none input-focus text-gray-800"
                placeholder="Nhập mã bảo hiểm y tế (10 ký tự, ví dụ: AA12345678)"
              />
              {errors.healthInsurance && (
                <p className="text-error-500 text-theme-xs mt-1">{errors.healthInsurance}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="address"
                className="block text-theme-sm font-medium text-gray-700"
              >
                Địa chỉ <span className="text-error-500">*</span>
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setErrors((prev) => ({ ...prev, address: "" }));
                }}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none input-focus text-gray-800"
                placeholder="Nhập địa chỉ của bạn"
              />
              {errors.address && (
                <p className="text-error-500 text-theme-xs mt-1">{errors.address}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-warning-500 text-white py-2 rounded-lg font-bold transition-all duration-300 button-hover ${
                isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-warning-600"
              }`}
            >
              {isLoading ? "Đang xử lý..." : "Đăng ký và gửi OTP"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <NavLink
              to="/register"
              className="text-brand-500 font-medium hover:underline"
            >
              Quay lại
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterDetail;