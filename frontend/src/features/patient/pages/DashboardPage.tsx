import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/context/AuthContext';
import { patientApiService } from '../services/patientApiService';
import { Calendar, Clock, FileText, User, Activity, Bell } from 'lucide-react';

interface DashboardStats {
  upcomingAppointments: number;
  totalAppointments: number;
  pendingBills: number;
  completedVisits: number;
}

interface RecentAppointment {
  id: number;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({
    upcomingAppointments: 0,
    totalAppointments: 0,
    pendingBills: 0,
    completedVisits: 0
  });
  
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Mock data for now - replace with actual API calls
        setStats({
          upcomingAppointments: 2,
          totalAppointments: 15,
          pendingBills: 1,
          completedVisits: 13
        });

        setRecentAppointments([
          {
            id: 1,
            doctorName: 'BS. Nguyễn Văn A',
            specialization: 'Tim mạch',
            date: '2024-08-10',
            time: '14:30',
            status: 'upcoming'
          },
          {
            id: 2,
            doctorName: 'BS. Trần Thị B',
            specialization: 'Da liễu',
            date: '2024-08-05',
            time: '09:00',
            status: 'completed'
          }
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Sắp tới';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Xin chào, {user?.name || user?.email || 'Bệnh nhân'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Chào mừng bạn quay trở lại. Đây là tổng quan về tình trạng sức khỏe của bạn.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Lịch hẹn sắp tới</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng lượt khám</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hóa đơn chưa thanh toán</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingBills}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Lượt khám hoàn thành</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedVisits}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Appointments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Lịch hẹn gần đây</h3>
                <button
                  onClick={() => navigate('/patient/appointments')}
                  className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                >
                  Xem tất cả
                </button>
              </div>
            </div>
            <div className="p-6">
              {recentAppointments.length > 0 ? (
                <div className="space-y-4">
                  {recentAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{appointment.doctorName}</h4>
                        <p className="text-sm text-gray-600">{appointment.specialization}</p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <Calendar size={16} className="mr-2" />
                          <span>{new Date(appointment.date).toLocaleDateString('vi-VN')}</span>
                          <Clock size={16} className="ml-4 mr-2" />
                          <span>{appointment.time}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {getStatusText(appointment.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">Chưa có lịch hẹn nào</p>
                  <button
                    onClick={() => navigate('/patient/find-doctors')}
                    className="mt-2 text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    Đặt lịch khám ngay
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Thao tác nhanh</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => navigate('/patient/find-doctors')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-cyan-50 hover:border-cyan-200 transition-colors group"
                >
                  <div className="p-2 bg-cyan-100 rounded-lg group-hover:bg-cyan-200">
                    <User className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div className="ml-4 text-left">
                    <p className="font-semibold text-gray-900">Tìm bác sĩ</p>
                    <p className="text-sm text-gray-600">Tìm kiếm bác sĩ phù hợp</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/patient/appointments')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors group"
                >
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-4 text-left">
                    <p className="font-semibold text-gray-900">Lịch khám của tôi</p>
                    <p className="text-sm text-gray-600">Xem và quản lý lịch hẹn</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/patient/bills')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-200 transition-colors group"
                >
                  <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200">
                    <FileText className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="ml-4 text-left">
                    <p className="font-semibold text-gray-900">Hóa đơn</p>
                    <p className="text-sm text-gray-600">Xem lịch sử thanh toán</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/patient/profile')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors group"
                >
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200">
                    <User className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-4 text-left">
                    <p className="font-semibold text-gray-900">Hồ sơ cá nhân</p>
                    <p className="text-sm text-gray-600">Cập nhật thông tin</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;