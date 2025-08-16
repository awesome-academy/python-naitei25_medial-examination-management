import React, { useState, useEffect } from "react";
import { Avatar, Table, Badge, Calendar, Typography, List } from "antd";
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined, TeamOutlined, CalendarOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import {
  appointmentService,
  formatAppointmentDate,
  getAppointmentStatusColor,
} from "../../services/appointmentService";
import type { Appointment } from "../../types/appointment";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;




const Home: React.FC = () => {
  const { t } = useTranslation();
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    completed: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      // Fetch recent appointments (e.g. last 8)
      const recentRes = await appointmentService.getAppointments({ page: 1, size: 8 });
      setRecentAppointments(recentRes.content || []);

      // Fetch upcoming appointments (e.g. next 5, status PENDING)
      const upcomingRes = await appointmentService.getAppointments({ page: 1, size: 5, appointmentStatus: "PENDING" });
      setUpcomingAppointments(upcomingRes.content || []);

      // Fetch all appointments for stats
      const allRes = await appointmentService.getAppointments({ page: 1, size: 100 });
      const all = allRes.content || [];
      const todayStr = new Date().toISOString().split("T")[0];
      setStats({
        total: all.length,
        today: all.filter(a => a.schedule?.workDate === todayStr).length,
        completed: all.filter(a => a.appointment_status === "C").length,
        pending: all.filter(a => a.appointment_status === "P").length,
      });
    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Remove all logic for event calendar and upcoming appointments, keep only layout
  
  // Map status code to Vietnamese label
  const STATUS_LABELS: Record<string, string> = {
    C: "CONFIRMED",
    P: "PENDING",
    O: "ORDERED",
    X: "CANCELLED",
    D: "COMPLETED"
  };

  const activityColumns = [
    {
      title: t("table.patient"),
      dataIndex: "patientInfo",
      key: "patientInfo",
      render: (patientInfo: any, record: Appointment) => (
        <div className="flex items-center">
          <Avatar src={patientInfo?.avatar} size={40} icon={<UserOutlined />} />
          <div>
            <div className="font-semibold text-gray-900">{patientInfo?.first_name} {patientInfo?.last_name}</div>
            <div className="text-xs text-gray-500">#{record.id}</div>
          </div>
        </div>
      ),
    },
    {
      title: t("table.appointmentDate"),
      dataIndex: "schedule",
      key: "schedule",
      render: (schedule: any, record: Appointment) => (
        <div className="flex items-center">
          <CalendarOutlined className="mr-2 text-gray-500" />
          <span>{formatAppointmentDate(schedule?.workDate)}</span>
        </div>
      ),
    },
    {
      title: t("table.status"),
      dataIndex: "appointmentStatus",
      key: "appointmentStatus",
      render: (_: any, record: Appointment) => {
        const statusText = STATUS_LABELS[record.status] || record.status;
        const { color, bgColor } = getAppointmentStatusColor(statusText);
        const text = STATUS_LABELS[statusText] || statusText;
        return (
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ color, backgroundColor: bgColor }}
          >
            {t(`status.${text.toLowerCase()}`) || text}
          </span>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex-1 h-screen w-full bg-slate-50">
        <div className="flex items-center justify-center h-full">
          <Text>{t("loading")}</Text>
        </div>
      </div>
    );
  }

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm opacity-90 mb-2">{t("dashboard.totalAppointments")}</div>
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-xs opacity-80 mt-1">{t("dashboard.total")}</div>
              </div>
              <UserOutlined className="text-5xl opacity-30" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-400 to-red-500 rounded-2xl p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm opacity-90 mb-2">{t("dashboard.todayAppointments")}</div>
                <div className="text-3xl font-bold">{stats.today}</div>
                <div className="text-xs opacity-80 mt-1 flex items-center">
                  <ClockCircleOutlined className="mr-1" /> {t("dashboard.today")}
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

          <div className="bg-gradient-to-br from-pink-500 to-yellow-400 rounded-2xl p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm opacity-90 mb-2">{t("dashboard.pending")}</div>
                <div className="text-3xl font-bold">{stats.pending}</div>
                <div className="text-xs opacity-80 mt-1 flex items-center">
                  <ClockCircleOutlined className="mr-1" /> {t("dashboard.pending")}
                </div>
              </div>
              <ClockCircleOutlined className="text-5xl opacity-30" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Appointments */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TeamOutlined className="mr-2 text-teal-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{t("dashboard.recentAppointments")}</h3>
                  </div>
                  <a
                    href="/activities"
                    className="text-teal-600 font-medium hover:text-teal-700 transition-colors"
                  >
                    {t("dashboard.viewAll")} →
                  </a>
                </div>
              </div>
              <div className="p-6">
                <Table
                  dataSource={recentAppointments}
                  columns={activityColumns}
                  pagination={false}
                  rowKey="appointmentId"
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
                  <a
                    href="/schedule"
                    className="text-teal-600 font-medium hover:text-teal-700 transition-colors"
                  >
                    {t("dashboard.viewDetails")} →
                  </a>
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
                  <a
                    href="/tasks"
                    className="text-teal-600 font-medium hover:text-teal-700 transition-colors"
                  >
                    {t("dashboard.viewAll")} →
                  </a>
                </div>
              </div>
              <div className="p-6">
                {/* Upcoming appointments UI placeholder */}
                <div className="h-40 bg-slate-100 rounded-xl flex items-center justify-center text-gray-400">
                  (Lịch hẹn sắp tới sẽ hiển thị ở đây)
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
                  (Thông tin hệ thống sẽ hiển thị ở đây)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home
