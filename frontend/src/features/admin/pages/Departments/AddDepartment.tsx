import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageMeta from "../../components/common/PageMeta";
import ReturnButton from "../../components/ui/button/ReturnButton";
import {
    departmentService,
    DepartmentDto,
} from "../../services/departmentService";

interface FormErrors {
    department_name?: string;
    description?: string;
    location?: string;
}

const AddDepartment: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<DepartmentDto>({
        department_name: "",
        description: "",
        location: "",
        head: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.department_name.trim()) {
            newErrors.department_name = t("addDepartment.departmentNameRequired");
        }

        if (!formData.description.trim()) {
            newErrors.description = t("addDepartment.descriptionRequired");
        }

        if (!formData.location?.trim()) {
            newErrors.location = t("addDepartment.locationRequired");
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({
                ...prev,
                [name]: undefined,
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            await departmentService.createDepartment(formData);

            // Success - navigate back to departments list
            navigate("/admin/departments", {
                replace: true,
                state: { message: t("addDepartment.successMessage") },
            });
        } catch (error) {
            console.error("Error creating department:", error);
            // Handle error - could show toast or error message
            alert(t("addDepartment.errorMessage"));
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate("/admin/departments");
    };

    return (
        <div>
            <PageMeta
                title={t("addDepartment.pageTitle")}
                description={t("addDepartment.pageDescription")}
            />

            <div className="mb-6">
                <div className="flex items-center mb-4">
                    <ReturnButton />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                        {t("addDepartment.heading")}
                    </h2>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Department Name */}
                    <div>
                        <label
                            htmlFor="departmentName"
                            className="block font-medium text-base-700 dark:text-gray-300 mb-2"
                        >
                            {t("addDepartment.departmentName")} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="departmentName"
                            name="department_name"
                            value={formData.department_name}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-base-500/20 focus:border-base-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.department_name ? "border-red-500" : "border-gray-300"
                                }`}
                            placeholder={t("addDepartment.departmentNamePlaceholder")}
                            disabled={loading}
                        />
                        {errors.department_name && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.department_name}
                            </p>
                        )}
                    </div>
                    {/* Description */}
                    <div>
                        <label
                            htmlFor="description"
                            className="block font-medium text-base-700 dark:text-gray-300 mb-2"
                        >
                            {t("addDepartment.descriptionLabel")} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-base-500/20 focus:border-base-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.description ? "border-red-500" : "border-gray-300"
                                }`}
                            placeholder={t("addDepartment.descriptionPlaceholder")}
                            disabled={loading}
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.description}
                            </p>
                        )}
                    </div>
                    {/* Location */}
                    <div>
                        <label
                            htmlFor="location"
                            className="block font-medium text-base-700 dark:text-gray-300 mb-2"
                        >
                            {t("addDepartment.locationLabel")} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location || ""}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-base-500/20 focus:border-base-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.location ? "border-red-500" : "border-gray-300"
                                }`}
                            placeholder={t("addDepartment.locationPlaceholder")}
                            disabled={loading}
                        />
                        {errors.location && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.location}
                            </p>
                        )}
                    </div>
                    {/* Head Doctor (Optional) */}
                    <div>
                        <label
                            htmlFor="head"
                            className="block font-medium text-base-700 dark:text-gray-300 mb-2"
                        >
                            {t("addDepartment.headLabel")}
                        </label>
                        <input
                            type="text"
                            id="head"
                            name="head"
                            value={formData.head || ""}
                            onChange={handleInputChange}
                            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-base-500/20 focus:border-base-500"
                            placeholder={t("addDepartment.headPlaceholder")}
                            disabled={loading}
                        />
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-4 pt-6">
                        <button
                            type="button"
                            onClick={handleCancel}
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
                                    <span>{t("addDepartment.creating")}</span>
                                </div>
                            ) : (
                                t("addDepartment.createButton")
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDepartment;
