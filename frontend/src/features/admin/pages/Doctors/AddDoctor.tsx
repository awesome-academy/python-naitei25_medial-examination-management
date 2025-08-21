import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, Upload, X } from "lucide-react";
import { doctorService } from "../../services/doctorService";
import { departmentService } from "../../../../shared/services/departmentService";
import {
  ACADEMIC_DEGREE_LABELS,
  ACADEMIC_DEGREE_TO_BACKEND,
  CreateDoctorRequest,
} from "../../types/doctor";
import ReturnButton from "../../components/ui/button/ReturnButton";

interface Department {
  departmentId: number;
  departmentName: string;
  description: string;
}

const AddDoctor: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>("");

  // Validation states
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [validating, setValidating] = useState<{ [key: string]: boolean }>({});

  const [formData, setFormData] = useState<CreateDoctorRequest>({
    phone: "",
    password: "",
    email: "",
    fullName: "",
    identityNumber: "",
    birthday: "",
    gender: "MALE",
    address: "",
    academicDegree: "BS",
    specialization: "",
    type: "EXAMINATION",
    departmentId: 0,
    consultationFee: 200000,
  });

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentData = await departmentService.getDepartments();
        // Map DepartmentDetail to Department interface
        const mappedDepartments = departmentData.map((dept) => ({
          departmentId: dept.id,
          departmentName: dept.department_name,
          description: dept.description || "",
        }));
        setDepartments(mappedDepartments);
        if (mappedDepartments.length > 0) {
          setFormData((prev) => ({
            ...prev,
            departmentId: mappedDepartments[0].departmentId,
          }));
        }
      } catch (err) {
        console.error("Error fetching departments:", err);
        setError(t("doctors.add.messages.loadDepartmentError"));
      }
    };

    fetchDepartments();
  }, []);
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "departmentId" || name === "consultationFee"
          ? parseInt(value)
          : value,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // STEP 1: Validate ALL fields before any server request
      console.log("🔍 Starting comprehensive validation...");
      const validationErrors = await validateAllFields();

      // STEP 2: If there are ANY validation errors, show modal and STOP
      if (Object.keys(validationErrors).length > 0) {
        const fieldNames: { [key: string]: string } = {
          phone: t("doctors.add.fieldNames.phone"),
          email: t("doctors.add.fieldNames.email"),
          password: t("doctors.add.fieldNames.password"),
          fullName: t("doctors.add.fieldNames.fullName"),
          identityNumber: t("doctors.add.fieldNames.identityNumber"),
          birthday: t("doctors.add.fieldNames.birthday"),
          specialization: t("doctors.add.fieldNames.specialization"),
          department: t("doctors.add.fieldNames.department"),
        };

        const errorList = Object.entries(validationErrors)
          .map(([field, error]) => `• ${fieldNames[field] || field}: ${error}`)
          .join("\n");

        console.log("❌ Validation failed:", validationErrors);
        setError(t("doctors.add.messages.validationError"));
        setErrorDetails(errorList);
        setShowErrorModal(true);
        return; // STOP HERE - DO NOT send any request to server
      }

      // STEP 3: ALL validation passed - now send request to server
      console.log("✅ All validation passed. Creating doctor...");

      // Split fullName into first_name and last_name
      const nameParts = formData.fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Transform data to match API structure
      const doctorData = {
        password: formData.password,
        identity_number: formData.identityNumber,
        first_name: firstName,
        last_name: lastName,
        birthday: formData.birthday,
        gender: formData.gender === "MALE" ? "M" : "F",
        academic_degree:
          ACADEMIC_DEGREE_TO_BACKEND[formData.academicDegree] ||
          formData.academicDegree,
        specialization: formData.specialization,
        type: formData.type === "EXAMINATION" ? "E" : "S",
        department_id: formData.departmentId,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        price: formData.consultationFee,
        ...(avatarPreview && { avatar: avatarPreview }),
      };

      console.log("📤 Sending doctor data to server:", doctorData);
      await doctorService.createDoctor(doctorData);

      console.log("🎉 Doctor created successfully!");
      setSuccess(t("doctors.add.messages.createSuccess"));

      // Auto navigate after 2 seconds
      setTimeout(() => {
        navigate("/admin/doctors");
      }, 2000);
    } catch (err: unknown) {
      console.error("Error creating doctor:", err);

      let errorMessage = t("doctors.add.messages.createError");
      let details = "";

      // Enhanced error logging and message extraction
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { status?: number; data?: any; headers?: any };
        };
        console.error("Response status:", axiosError.response?.status);
        console.error("Response data:", axiosError.response?.data);

        // Extract meaningful error message from server response
        if (axiosError.response?.data) {
          const responseData = axiosError.response.data;

          // Check if the response contains the actual error message
          if (
            responseData.message &&
            responseData.message.includes("Số điện thoại đã được sử dụng")
          ) {
            errorMessage = t("doctors.add.messages.phoneExists");
            details = t("doctors.add.messages.phoneExistsDetail");
          } else if (
            responseData.message &&
            responseData.message.includes(
              "value too long for type character varying(255)"
            )
          ) {
            errorMessage = t("doctors.add.messages.dataTooLong");
            details = t("doctors.add.messages.dataTooLongDetail");
          } else if (responseData.error) {
            errorMessage = t("doctors.add.messages.serverError");
            details = responseData.error;
          } else if (responseData.message) {
            errorMessage = t("doctors.add.messages.serverError");
            details = responseData.message;
          }
        }
      } else if (err instanceof Error) {
        console.error("Error message:", err.message);
        errorMessage = t("doctors.add.messages.systemError");
        details = err.message;
      }

      setError(errorMessage);
      setErrorDetails(details);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Validation functions
  const validateEmail = async (email: string): Promise<string | null> => {
    if (!email) return null;

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return t("doctors.add.validation.emailInvalid");
    }

    return null;
  };

  const validatePhone = async (phone: string): Promise<string | null> => {
    if (!phone) return null;

    // Vietnamese phone number validation
    const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
    if (!phoneRegex.test(phone)) {
      return t("doctors.add.validation.phoneInvalid");
    }

    return null;
  };

  const validateIdentityNumber = (identityNumber: string): string | null => {
    if (!identityNumber) return null;

    // CMND (9 digits) or CCCD (12 digits)
    const idRegex = /^(\d{9}|\d{12})$/;
    if (!idRegex.test(identityNumber)) {
      return t("doctors.add.validation.identityInvalid");
    }

    return null;
  };

  // Enhanced handleInputChange with validation
  const handleInputChangeWithValidation = async (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Update form data
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "departmentId" || name === "consultationFee"
          ? parseInt(value)
          : value,
    }));

    // Clear previous error for this field
    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    // Validate specific fields
    if (value.trim()) {
      let error: string | null = null;

      if (name === "email") {
        setValidating((prev) => ({ ...prev, email: true }));
        error = await validateEmail(value);
        setValidating((prev) => ({ ...prev, email: false }));
      } else if (name === "phone") {
        setValidating((prev) => ({ ...prev, phone: true }));
        error = await validatePhone(value);
        setValidating((prev) => ({ ...prev, phone: false }));
      } else if (name === "identityNumber") {
        error = validateIdentityNumber(value);
      }

      if (error) {
        setFieldErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }
    }
  };

  // Comprehensive validation function
  const validateAllFields = async (): Promise<{ [key: string]: string }> => {
    const errors: { [key: string]: string } = {};

    // Required fields validation
    if (!formData.phone.trim()) {
      errors.phone = t("doctors.add.validation.phoneRequired");
    } else {
      const phoneError = await validatePhone(formData.phone);
      if (phoneError) errors.phone = phoneError;
    }

    if (!formData.password.trim()) {
      errors.password = t("doctors.add.validation.passwordRequired");
    } else if (formData.password.length < 6) {
      errors.password = t("doctors.add.validation.passwordMinLength");
    }

    if (!formData.fullName.trim()) {
      errors.fullName = t("doctors.add.validation.fullNameRequired");
    }

    if (!formData.identityNumber.trim()) {
      errors.identityNumber = t("doctors.add.validation.identityRequired");
    } else {
      const idError = validateIdentityNumber(formData.identityNumber);
      if (idError) errors.identityNumber = idError;
    }

    if (!formData.birthday) {
      errors.birthday = t("doctors.add.validation.birthdayRequired");
    }

    if (!formData.specialization.trim()) {
      errors.specialization = t(
        "doctors.add.validation.specializationRequired"
      );
    }

    if (formData.departmentId === 0) {
      errors.department = t("doctors.add.validation.departmentRequired");
    }

    // Optional email validation
    if (formData.email && formData.email.trim()) {
      const emailError = await validateEmail(formData.email);
      if (emailError) errors.email = emailError;
    }

    // Check existing field errors
    Object.entries(fieldErrors).forEach(([field, error]) => {
      if (error) errors[field] = error;
    });

    return errors;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white">
        <div className="flex items-center">
          <div className="flex items-center space-x-4">
            <ReturnButton />
            <h1 className="text-xl font-semibold text-gray-900">
              {t("doctors.add.pageTitle")}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto pt-6">
        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Information Section */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div>
                  <h2 className="text-lg font-semibold text-base-900">
                    {t("doctors.add.accountInfo.title")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t("doctors.add.accountInfo.description")}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 space-x-10">
                {/* Avatar Section */}
                <div className="flex flex-col items-center">
                  <label className="block font-medium text-base-700 mb-3">
                    {t("doctors.add.accountInfo.avatar")}
                  </label>
                  <div className="flex flex-col items-center space-y-1">
                    {/* Avatar Preview with Upload Overlay */}
                    <div className="relative group">
                      <div className="size-30 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center transition-colors group-hover:border-base-400 group-hover:bg-base-50">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-gray-400 group-hover:text-base-500 transition-colors">
                            <Upload className="h-6 w-6 mb-1" />
                            <span className="text-xs font-medium text-center">
                              {t("doctors.add.accountInfo.addPhoto")}
                            </span>
                          </div>
                        )}
                      </div>{" "}
                      {/* Upload Overlay - Only show when there's an image */}
                      {avatarPreview && (
                        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <label className="cursor-pointer flex flex-col items-center text-white">
                            <Upload className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">
                              {t("doctors.add.accountInfo.changePhoto")}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                      {/* Upload input for empty state */}
                      {!avatarPreview && (
                        <label className="absolute inset-0 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                          />
                        </label>
                      )}
                      {/* Remove Button - Show only when image exists */}
                      {avatarFile && (
                        <button
                          type="button"
                          onClick={removeAvatar}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                          title={t("doctors.add.accountInfo.removePhoto")}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {/* Upload Status */}
                    {avatarFile && (
                      <div className="text-xs text-green-600 text-center">
                        ✓ {avatarFile.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="lg:col-span-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-base-700 mb-2">
                        {t("doctors.add.accountInfo.phone")}{" "}
                        <span className="text-red-500">*</span>
                      </label>{" "}
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChangeWithValidation}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                        placeholder={t(
                          "doctors.add.accountInfo.phonePlaceholder"
                        )}
                        required
                      />
                      {fieldErrors.phone && (
                        <p className="mt-1 text-sm text-red-600">
                          {fieldErrors.phone}
                        </p>
                      )}
                      {validating.phone && (
                        <p className="mt-1 text-sm text-blue-600">
                          {t("doctors.add.validation.checking")}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block font-medium text-base-700 mb-2">
                        {t("doctors.add.accountInfo.email")}
                      </label>{" "}
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChangeWithValidation}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                        placeholder={t(
                          "doctors.add.accountInfo.emailPlaceholder"
                        )}
                      />
                      {fieldErrors.email && (
                        <p className="mt-1 text-sm text-red-600">
                          {fieldErrors.email}
                        </p>
                      )}
                      {validating.email && (
                        <p className="mt-1 text-sm text-blue-600">
                          {t("doctors.add.validation.checking")}
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-medium text-base-700 mb-2">
                        {t("doctors.add.accountInfo.password")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                        placeholder={t(
                          "doctors.add.accountInfo.passwordPlaceholder"
                        )}
                        required
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
                  <h2 className="text-lg font-semibold text-base-900">
                    {t("doctors.add.personalInfo.title")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t("doctors.add.personalInfo.description")}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-medium text-base-700 mb-2">
                    {t("doctors.add.personalInfo.fullName")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                    placeholder={t(
                      "doctors.add.personalInfo.fullNamePlaceholder"
                    )}
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-base-700 mb-2">
                    {t("doctors.add.personalInfo.identityNumber")}{" "}
                    <span className="text-red-500">*</span>
                  </label>{" "}
                  <input
                    type="text"
                    name="identityNumber"
                    value={formData.identityNumber}
                    onChange={handleInputChangeWithValidation}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                    placeholder={t(
                      "doctors.add.personalInfo.identityNumberPlaceholder"
                    )}
                    required
                  />
                  {fieldErrors.identityNumber && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.identityNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-base-700 mb-2">
                    {t("doctors.add.personalInfo.birthday")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-base-700 mb-2">
                    {t("doctors.add.personalInfo.gender")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 appearance-none transition-colors outline-0"
                      required
                    >
                      <option value="MALE">
                        {t("doctors.add.personalInfo.male")}
                      </option>
                      <option value="FEMALE">
                        {t("doctors.add.personalInfo.female")}
                      </option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-medium text-base-700 mb-2">
                    {t("doctors.add.personalInfo.address")}
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                    placeholder={t(
                      "doctors.add.personalInfo.addressPlaceholder"
                    )}
                  />
                </div>
              </div>{" "}
            </div>
          </div>
          {/* Department Information Section */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div>
                  <h2 className="text-lg font-semibold text-base-900">
                    {t("doctors.add.professionalInfo.title")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t("doctors.add.professionalInfo.description")}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div>
                <label className="block font-medium text-base-700 mb-2">
                  {t("doctors.add.professionalInfo.department")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 appearance-none transition-colors outline-0"
                    required
                  >
                    <option value={0}>
                      {t("doctors.add.professionalInfo.selectDepartment")}
                    </option>
                    {departments.map((dept) => (
                      <option key={dept.departmentId} value={dept.departmentId}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
          {/* Professional Information Section */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div>
                  <h2 className="text-lg font-semibold text-base-900">
                    {t("doctors.add.professionalInfo.title")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t("doctors.add.professionalInfo.description")}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-medium text-base-700 mb-2">
                    {t("doctors.add.professionalInfo.academicDegree")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="academicDegree"
                      value={formData.academicDegree}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 appearance-none transition-colors outline-0"
                      required
                    >
                      {" "}
                      {Object.entries(ACADEMIC_DEGREE_LABELS).map(
                        ([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        )
                      )}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-base-700 mb-2">
                    {t("doctors.add.professionalInfo.specialization")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                    placeholder={t(
                      "doctors.add.professionalInfo.specializationPlaceholder"
                    )}
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-base-700 mb-2">
                    {t("doctors.add.professionalInfo.type")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 appearance-none transition-colors outline-0"
                      required
                    >
                      <option value="EXAMINATION">
                        {t("doctors.add.professionalInfo.examination")}
                      </option>
                      <option value="SERVICE">
                        {t("doctors.add.professionalInfo.service")}
                      </option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-base-700 mb-2">
                    {t("doctors.add.professionalInfo.consultationFee")}
                  </label>
                  <input
                    type="number"
                    name="consultationFee"
                    value={formData.consultationFee}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 transition-colors outline-0"
                    placeholder="200000"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Submit Button */}
          <div className="px-6">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate("/admin/doctors")}
                className="px-6 py-[10px] border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                disabled={loading}
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-[10px] bg-base-600 text-white rounded-lg hover:bg-base-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t("common.processing")}</span>
                  </div>
                ) : (
                  t("doctors.add.title")
                )}
              </button>
            </div>
          </div>{" "}
        </form>
      </div>

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {error || t("common.error")}
                </h3>
              </div>
            </div>

            {errorDetails && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">{errorDetails}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowErrorModal(false);
                  setError(null);
                  setErrorDetails("");
                }}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t("authorization.close")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowErrorModal(false);
                  setError(null);
                  setErrorDetails("");
                  // Reset form if needed
                }}
                className="px-4 py-2 bg-base-600 text-white rounded-lg hover:bg-base-700 transition-colors"
              >
                {t("authorization.retry")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddDoctor;
