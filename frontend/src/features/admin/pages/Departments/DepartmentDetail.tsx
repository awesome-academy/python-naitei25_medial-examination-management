import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import ReturnButton from "../../components/ui/button/ReturnButton";
import { departmentService } from "../../services/departmentService";

interface Doctor {
    doctorId: number;
    fullName: string;
    academicDegree: string;
    specialty?: string;
    avatar?: string;
    isAvailable?: boolean;
    departmentId?: number;
}

interface Service {
    id: string;
    name: string;
    duration: string;
    price: string;
    insurance_covered: boolean;
}

interface DepartmentStats {
    totalPatients: number;
    todayPatients: number;
    occupancyRate: number;
    averageStay: number;
}

interface Department {
    departmentId: number;
    departmentName: string;
    description?: string;
    location?: string;
    headDoctorName?: string;
    headDoctorImage?: string;
    staffCount: number;
    foundedYear?: number;
    phoneNumber?: string;
    email?: string;
    staffImages?: string[];
    examinationRoomDtos?: DepartmentRoom[];
}

const DepartmentDetail: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); const [activeTab, setActiveTab] = useState('overview');
    const [department, setDepartment] = useState<Department | null>(null);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [stats, setStats] = useState<DepartmentStats>({
        totalPatients: 0,
        todayPatients: 0,
        occupancyRate: 0,
        averageStay: 0
    });

    // Helper function to extract numeric ID from formatted ID
    const extractDepartmentId = (formattedId: string): number => {
        // Extract numeric part from "KH2025-003" format
        const match = formattedId.match(/\d+$/);
        return match ? parseInt(match[0]) : parseInt(formattedId);
    };

    useEffect(() => {
        const fetchDepartmentData = async () => {
            try {
                setLoading(true);
                setError(null);

                if (!id) {
                    setError(t("common.departmentNotFound"));
                    return;
                }

                const numericId = extractDepartmentId(id);

                // Fetch department details
                const departmentData = await departmentService.getDepartmentById(numericId);
                setDepartment(departmentData);

                // Fetch doctors for this department
                try {
                    const doctorsData = await departmentService.getDoctorsByDepartmentId(numericId);
                    setDoctors(doctorsData as Doctor[]);
                    // Set staffCount to number of doctors
                    // Set headDoctorName to first doctor's name if available
                    setDepartment(prev => {
                        if (!prev) return prev;
                        let headDoctorName = prev.headDoctorName;
                        if ((doctorsData as Doctor[]).length > 0) {
                            const firstDoctor = (doctorsData as any[])[0];
                            // Try both fullName and first_name + last_name for compatibility
                            headDoctorName = firstDoctor.fullName || ((firstDoctor.first_name && firstDoctor.last_name) ? `${firstDoctor.first_name} ${firstDoctor.last_name}` : prev.headDoctorName);
                        }
                        return { ...prev, staffCount: (doctorsData as Doctor[]).length, headDoctorName };
                    });
                } catch (docError) {
                    console.error("Error fetching doctors:", docError);
                    setDoctors([]);
                    setDepartment(prev => prev ? { ...prev, staffCount: 0 } : prev);
                }
                // This can be replaced with actual API calls when available
                setServices([
                    {
                        id: "DV-001",
                        name: "Khám tổng quát",
                        duration: "30 phút",
                        price: "200.000 đ",
                        insurance_covered: true
                    },
                    {
                        id: "DV-002",
                        name: "Tư vấn chuyên môn",
                        duration: "45 phút",
                        price: "300.000 đ",
                        insurance_covered: true
                    },
                ]);

                setStats({
                    totalPatients: 1250,
                    todayPatients: 24,
                    occupancyRate: 75,
                    averageStay: 2.5
                });

            } catch (err) {
                console.error("Error fetching department data:", err);
                setError(t("common.error"));
            } finally {
                setLoading(false);
            }
        };

        fetchDepartmentData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-base-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-red-400 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                </svg>
                <h3 className="text-lg font-medium text-red-700 mb-2">
                    {t("common.error")}
                </h3>
                <p className="text-red-500 mb-6">
                    {error}
                </p>
                <button
                    onClick={() => navigate("/admin/departments")}
                    className="inline-flex items-center px-4 py-2 bg-base-600 text-white font-medium rounded-lg hover:bg-base-700"
                >
                    {t("common.goBack")}
                </button>
            </div>
        );
    }

    if (!department) {
        return (
            <div className="text-center py-10">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 14h.01M5.8 21H18.2a2 2 0 002-2V5a2 2 0 00-2-2H5.8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                </svg>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                    {t("common.departmentNotFound")}
                </h3>
                <p className="text-gray-500 mb-6">
                    {t("common.noDepartmentsAvailable")}
                </p>
                <button
                    onClick={() => navigate("/admin/departments")}
                    className="inline-flex items-center px-4 py-2 bg-base-600 text-white font-medium rounded-lg hover:bg-base-700"
                >
                    {t("common.goBack")}
                </button>
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview': return (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Thông tin cơ bản */}
                        <div className="bg-white p-5 rounded-lg shadow-sm">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">{t("common.overview")}</h3>
                            <div className="space-y-3">
                                <div className="flex">
                                    <span className="font-medium w-32 text-gray-600">{t("common.headDoctor")}</span>
                                    <span>{department.headDoctorName || t("common.notAvailable")}</span>
                                </div>
                                <div className="flex">
                                    <span className="font-medium w-32 text-gray-600">{t("common.staffCount")}</span>
                                    <span>{department.staffCount} {t("common.people")}</span>
                                </div>
                                <div className="flex">
                                    <span className="font-medium w-32 text-gray-600">{t("common.founded")}</span>
                                    <span>
                                        {department.created_at
                                            ? `${t("common.year")} ${new Date(department.created_at).getFullYear()}`
                                            : (department.foundedYear ? `${t("common.year")} ${department.foundedYear}` : t("common.notAvailable"))}
                                    </span>
                                </div>
                                <div className="flex">
                                    <span className="font-medium w-32 text-gray-600">{t("common.phone")}</span>
                                    <span>{department.phoneNumber || t("common.notAvailable")}</span>
                                </div>
                                <div className="flex">
                                    <span className="font-medium w-32 text-gray-600">{t("common.email")}</span>
                                    <span>{department.email || t("common.notAvailable")}</span>
                                </div>
                            </div>
                        </div>

                        {/* Thống kê */}
                        <div className="bg-white p-5 rounded-lg shadow-sm">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">{t("common.activityStats")}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">{t("common.totalPatients")}</p>
                                    <p className="text-2xl font-bold text-blue-700">{stats.totalPatients}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">{t("common.todayPatients")}</p>
                                    <p className="text-2xl font-bold text-green-700">{stats.todayPatients}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">{t("common.occupancyRate")}</p>
                                    <p className="text-2xl font-bold text-purple-700">{stats.occupancyRate}%</p>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">{t("common.serviceCount")}</p>
                                    <p className="text-2xl font-bold text-amber-700">{services.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>            {/* Mô tả khoa */}
                    <div className="bg-white p-5 rounded-lg shadow-sm mb-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">{t("common.description")}</h3>
                        <p className="text-gray-600">{department.description || t("common.noDescription")}</p>
                    </div>

                    {/* Nhân sự nổi bật */}
                    <div className="bg-white p-5 rounded-lg shadow-sm">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">{t("common.featuredStaff")}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {doctors.slice(0, 4).map(doctor => (
                                <div key={doctor.id} className="bg-gray-50 p-4 rounded-lg flex flex-col items-center">                    <img
                                    src={doctor.avatar || "/images/user/owner.jpg"}
                                    alt={doctor.fullName}
                                    className="w-20 h-20 rounded-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = "/images/user/owner.jpg";
                                    }}
                                />
                                    <h4 className="font-medium text-gray-800 mt-2">{doctor.first_name} {doctor.last_name}</h4>
                                    <p className="text-sm text-gray-500">{doctor.academic_degree}</p>
                                    <p className="text-xs text-gray-500 mt-1">{doctor.specialization || "Chưa cập nhật"}</p>
                                </div>
                            ))}
                            {doctors.length === 0 && (
                                <div className="col-span-4 text-center text-gray-500 py-8">
                                    {t("common.noStaffInfo")}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
            case 'doctors':
                return (
                    <div className="bg-white p-5 rounded-lg shadow-sm">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">{t("common.staffList")} ({doctors.length})</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("common.doctor")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("common.specialization")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("common.position")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("common.status")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("common.actions")}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {doctors.map((doctor) => (
                                        <tr key={doctor.doctorId}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10"><img
                                                        className="h-10 w-10 rounded-full object-cover"
                                                        src={doctor.avatar || "/images/user/owner.jpg"}
                                                        alt={doctor.first_name + " " + doctor.last_name}
                                                        onError={(e) => {
                                                            e.currentTarget.src = "/images/user/owner.jpg";
                                                        }}
                                                    />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{doctor.first_name} {doctor.last_name}</div>
                                                        <div className="text-sm text-gray-500">ID: {doctor.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{doctor.specialization || t("common.notAvailable")}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{doctor.academic_degree}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${doctor.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {doctor.isAvailable ? t("common.available") : t("common.unavailable")}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex gap-2">
                                                    <button
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        onClick={() => navigate(`/admin/doctors/schedule/${doctor.id}`)}
                                                    >
                                                        {t("common.viewSchedule")}
                                                    </button>
                                                    <button
                                                        className="text-blue-600 hover:text-blue-900"
                                                        onClick={() => navigate(`/admin/doctors/detail/${doctor.id}`)}
                                                    >
                                                        {t("common.details")}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {doctors.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                {t("common.noDoctorsInDepartment")}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>);
            case 'services':
                return (
                    <div className="bg-white p-5 rounded-lg shadow-sm">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">{t("common.medicalServices")} ({services.length})</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("common.serviceId")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("common.serviceName")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("common.duration")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("common.price")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("common.insurance")}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {services.map((service) => (
                                        <tr key={service.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {service.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{service.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {service.duration}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {service.price}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {service.insurance_covered ? (
                                                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">{t("common.insuranceCovered")}</span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">{t("common.noInsurance")}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>      <PageMeta
            title={`${department.departmentName} | Bệnh viện Đa khoa Trung tâm`}
            description={`Thông tin chi tiết về ${department.departmentName}`}
        />

            <div className="mb-6">
                <div className="flex items-center mb-4">
                    <ReturnButton />
                    <h2 className="text-xl font-semibold">Chi tiết khoa: {department.departmentName}</h2>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <ul className="flex flex-wrap -mb-px border-b border-gray-200">
                        <li className="mr-2">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`inline-block py-3 px-4 text-sm font-medium ${activeTab === 'overview'
                                    ? 'border-b-2 border-base-600 text-base-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Tổng quan
                            </button>
                        </li>            <li className="mr-2">
                            <button
                                onClick={() => setActiveTab('doctors')}
                                className={`inline-block py-3 px-4 text-sm font-medium ${activeTab === 'doctors'
                                    ? 'border-b-2 border-base-600 text-base-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Bác sĩ & Nhân viên
                            </button>
                        </li>
                        <li className="mr-2">
                            <button
                                onClick={() => setActiveTab('services')}
                                className={`inline-block py-3 px-4 text-sm font-medium ${activeTab === 'services'
                                    ? 'border-b-2 border-base-600 text-base-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Dịch vụ
                            </button>
                        </li>
                    </ul>
                </div>

                {renderTabContent()}
            </div>
        </>
    );
};

export default DepartmentDetail;
