"use client";
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { authService } from "../../../shared/services/authService";
import { message } from "antd";

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { email, resetToken } = location.state || {};

  useEffect(() => {
    if (!email || !resetToken) {
      message.error("Không tìm thấy thông tin email hoặc reset token. Vui lòng xác minh OTP lại.");
      navigate("/verify-otp");
    }
  }, [email, resetToken, navigate]);

  const validateForm = () => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};
    if (!newPassword.trim()) {
      newErrors.newPassword = "Mật khẩu mới không được để trống.";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Mật khẩu mới phải có ít nhất 8 ký tự.";
    } else if (!/\d/.test(newPassword)) {
      newErrors.newPassword = "Mật khẩu mới phải chứa ít nhất một chữ số.";
    } else if (!/[A-Za-z]/.test(newPassword)) {
      newErrors.newPassword = "Mật khẩu mới phải chứa ít nhất một chữ cái.";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      newErrors.newPassword = "Mật khẩu mới phải chứa ít nhất một ký tự đặc biệt.";
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
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

    setIsLoading(true);
    try {
      const payload = {
        resetToken,
        password: newPassword,
      };
      console.log('Resetting password with payload:', payload);
      await authService.resetPassword(payload);
      message.success("Mật khẩu đã được đặt lại thành công!");
      setTimeout(() => navigate("/patient-login"), 2000);
    } catch (error: any) {
      console.error('Reset password error:', error.response?.data || error.message);
      message.error(error.message || "Có lỗi xảy ra, vui lòng thử lại.");
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
            Đặt lại mật khẩu
          </h2>
          <div className="text-center text-gray-600 text-theme-sm mb-8">
            <p>Nhập mật khẩu mới cho {email}</p>
          </div>
          <div className="w-3/4 mx-auto h-px bg-gray-300 mb-8"></div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-theme-sm font-medium text-gray-700"
              >
                Mật khẩu mới <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, newPassword: "" }));
                  }}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none input-focus text-gray-800"
                  placeholder="Nhập mật khẩu mới"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-theme-sm text-gray-500 hover:text-brand-500 transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-error-500 text-theme-xs mt-1">{errors.newPassword}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-theme-sm font-medium text-gray-700"
              >
                Xác nhận mật khẩu <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none input-focus text-gray-800"
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-theme-sm text-gray-500 hover:text-brand-500 transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-error-500 text-theme-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-warning-500 text-white py-2 rounded-lg font-bold transition-all duration-300 button-hover ${
                isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-warning-600"
              }`}
            >
              {isLoading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <NavLink
              to="/patient-login"
              className="text-brand-500 font-medium hover:underline"
            >
              Quay lại đăng nhập
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;