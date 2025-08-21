
import React, { useState, useEffect } from "react";
import { Avatar, Table, Badge, Calendar, Typography, List, Button } from "antd";
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined, TeamOutlined, CalendarOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getServiceOrdersByRoomId } from "../../services/serviceOrderService";
import { servicesService } from "../../services/servicesService";
import { appointmentService } from "../../services/appointmentService";
import { api } from "../../../../shared/services/api";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
const { Title, Text } = Typography;

const HomeService: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [appointmentsData, setAppointmentsData] = useState<{ [key: number]: any }>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    ordered: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const today = dayjs().format("YYYY-MM-DD");
      const doctorId = localStorage.getItem("currentDoctorId");
      let selectedRoomId: number | undefined = undefined;

      // Lấy workSchedules của bác sĩ hiện tại
      if (doctorId) {
        const response = await api.get(`/schedules/?doctor_id=${doctorId}`);
        const schedules = response.data || [];
        // Tìm schedule có work_date là hôm nay
        const todaySchedule = schedules.find((schedule: any) => schedule.work_date === today);
        if (todaySchedule) {
          selectedRoomId = typeof todaySchedule.room_id === "number" ? todaySchedule.room_id : todaySchedule.room_id?.id;
        }
      }

      if (!selectedRoomId) {
        setServiceOrders([]);
        setAppointmentsData({});
        setStats({ total: 0, ordered: 0, completed: 0 });
        setLoading(false);
        return;
      }

      // Lấy service order theo room_id và ngày hôm nay
      const data = await getServiceOrdersByRoomId(selectedRoomId, undefined, today);
      const orders = Array.isArray(data) ? data : [];

      // Lấy danh sách dịch vụ để map tên
      const servicesData = await servicesService.getAllServices();
      const serviceMap = new Map();
      if (Array.isArray(servicesData)) {
        servicesData.forEach((service: any) => {
          serviceMap.set(Number(service.service_id), service.service_name);
        });
      }

      // Enrich order
      const enrichedOrders = orders.map((order: any) => ({
        orderId: order.id || order.order_id,
        appointmentId: order.appointment_id,
        roomId: order.room_id,
        serviceId: order.service_id,
        serviceName: serviceMap.get(Number(order.service_id)),
        orderStatus: order.status || order.order_status,
        result: order.result,
        number: order.number,
        orderTime: order.order_time,
      }));
      console.log("Enriched Orders:", enrichedOrders);
      // Lấy thông tin appointment cho từng order
      const appointmentPromises = enrichedOrders.map(async (order) => {
        try {
          const appointment = await appointmentService.getAppointmentById(order.appointmentId);
          return { appointmentId: order.appointmentId, data: appointment };
        } catch {
          return { appointmentId: order.appointmentId, data: null };
        }
      });
      const appointmentResults = await Promise.all(appointmentPromises);
      const appointmentsMap = appointmentResults.reduce(
        (acc, result) => {
          acc[result.appointmentId] = result.data;
          return acc;
        },
        {} as { [key: number]: any },
      );

      setServiceOrders(enrichedOrders);
      setAppointmentsData(appointmentsMap);

      setStats({
        total: enrichedOrders.length,
        ordered: enrichedOrders.filter((order) => order.orderStatus === "O").length,
        completed: enrichedOrders.filter((order) => order.orderStatus === "C").length,
      });
    } catch (error) {
      console.error("Error fetching service orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: t("labels.patient"),
      dataIndex: "appointmentId",
      key: "patient",
      render: (appointmentId: number, record: any) => {
        const appointment = appointmentsData[appointmentId];
        const patientInfo = appointment?.patientInfo;
        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            <Avatar
              src={
                patientInfo?.avatar ||
                "https://png.pngtree.com/png-clipart/20210608/ourlarge/pngtree-dark-gray-simple-avatar-png-image_3418404.jpg"
              }
              size={40}
              icon={<UserOutlined />}
            />
            <div style={{ marginLeft: 12 }}>
              <div style={{ fontWeight: 600, color: "#111827" }}>{patientInfo?.first_name} {patientInfo?.last_name}</div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>#{patientInfo?.id}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: t("table.service"),
      dataIndex: "serviceName",
      key: "serviceName",
      render: (serviceName: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600, color: "#111827" }}>{serviceName}</div>
        </div>
      ),
    },
    {
      title: t("labels.orderTime"),
      dataIndex: "orderTime",
      key: "orderTime",
      render: (orderTime: string) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <CalendarOutlined style={{ marginRight: 8, color: "#6b7280" }} />
          <span style={{ color: "#374151" }}>
            {orderTime ? dayjs(orderTime).format("HH:mm DD/MM/YYYY") : "-"}
          </span>
        </div>
      ),
    },
    {
      title: t("medicalRecord.orderStatus"),
      dataIndex: "orderStatus",
      key: "orderStatus", 
      render: (status: string) => {
        const statusConfig = {
          O: { color: "#b45309", bgColor: "#fef3c7", text: t("status.ordered") },
          C: { color: "#15803d", bgColor: "#d1fae5", text: t("status.completed") },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || {
          color: "#6b7280",
          bgColor: "#f3f4f6",
          text: t("statuses.unknown"),
        };
        return (
          <span
            style={{
              color: config.color,
              backgroundColor: config.bgColor,
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            {config.text}
          </span>
        );
      },
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("dashboard.welcome")}
          </h1>
          <p className="text-gray-600 text-base">{t("dashboard.overviewToday")}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm opacity-90 mb-2">{t("dashboard.totalServiceOrders")}</div>
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-xs opacity-80 mt-1">{t("dashboard.total")}</div>
              </div>
              <UserOutlined className="text-5xl opacity-30" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm opacity-90 mb-2">{t("dashboard.ordered")}</div>
                <div className="text-3xl font-bold">{stats.ordered}</div>
                <div className="text-xs opacity-80 mt-1 flex items-center">
                  <ClockCircleOutlined className="mr-1" /> {t("dashboard.ordered")}
                </div>
              </div>
              <ClockCircleOutlined className="text-5xl opacity-30" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-sky-400 to-cyan-500 rounded-2xl p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm opacity-90 mb-2">{t("dashboard.completed")}</div>
                <div className="text-3xl font-bold">{stats.completed}</div>
                <div className="text-xs opacity-80 mt-1 flex items-center">
                  <CheckCircleOutlined className="mr-1" /> {t("dashboard.done")}
                </div>
              </div>
              <CheckCircleOutlined className="text-5xl opacity-30" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Orders Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TeamOutlined className="mr-2 text-teal-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{t("dashboard.todayServiceOrders")}</h3>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <Table
                  dataSource={serviceOrders}
                  columns={columns}
                  pagination={false}
                  rowKey="orderId"
                  loading={loading}
                  className="rounded-lg"
                />
              </div>
            </div>

            {/* Calendar (plain, no events) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CalendarOutlined className="mr-2 text-teal-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{t("dashboard.eventCalendar")}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/doctor/service/schedule")}
                    className="text-teal-600 font-medium hover:text-teal-700 transition-colors bg-transparent border-0 p-0 cursor-pointer"
                  >
                    {t("dashboard.viewDetails")} →
                  </button>
                </div>
              </div>
              <div className="p-6">
                <Calendar fullscreen={false} />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Upcoming Appointments (layout only, no logic) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ClockCircleOutlined className="mr-2 text-teal-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{t("dashboard.upcomingAppointments")}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/doctor/service/patients")}
                    className="text-teal-600 font-medium hover:text-teal-700 transition-colors bg-transparent border-0 p-0 cursor-pointer"
                  >
                    {t("dashboard.viewAll")} →
                  </button>
                </div>
              </div>
              <div className="p-6">
                {/* Upcoming appointments UI placeholder */}
                <div className="h-40 bg-slate-100 rounded-xl flex items-center justify-center text-gray-400">
                  ({t("dashboard.systemInfoPlaceholder")})
                </div>
              </div>
            </div>

            {/* System Info (layout only, no logic) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">{t("dashboard.systemInfo")}</h3>
              </div>
              <div className="p-6">
                <div className="h-40 bg-slate-100 rounded-xl flex items-center justify-center text-gray-400">
                  ({t("dashboard.systemInfoPlaceholder")})
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeService
