import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientApiService } from '../services/patientApiService';
import { useAuth } from '../../../shared/context/AuthContext';

interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  specialization: string;
  profileImage?: string;
  rating: number;
  consultationFee: number;
  experience: number;
  department: {
    departmentName: string;
  };
}

interface Department {
  id: number;
  departmentName: string;
  doctorCount: number;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [featuredDoctors, setFeaturedDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [doctorsData, specialtiesData] = await Promise.all([
          patientApiService.getFeaturedDoctors(),
          patientApiService.getSpecialties(),
        ]);
        setFeaturedDoctors(doctorsData.slice(0, 6));
        setSpecialties(specialtiesData.slice(0, 8));
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/patient/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Debug function để kiểm tra navigation
  const handleLogin = () => {
    console.log('Navigating to /auth/patient-login');
    navigate('/auth/patient-login');
  };

  const handleRegister = () => {
    console.log('Navigating to /auth/register');
    navigate('/auth/register');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            {/* Hero section skeleton */}
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto mb-8"></div>
              <div className="h-12 bg-gray-200 rounded w-80 mx-auto"></div>
            </div>
            {/* Featured doctors skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Chăm sóc sức khỏe toàn diện
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto">
            Tìm kiếm bác sĩ chuyên khoa hàng đầu và đặt lịch khám dễ dàng ngay hôm nay.
          </p>
          <div className="flex justify-center gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tìm kiếm bác sĩ hoặc chuyên khoa..."
              className="w-full max-w-md p-3 rounded-l-lg border-none focus:outline-none text-gray-800"
            />
            <button
              onClick={handleSearch}
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-r-lg transition-colors"
            >
              Tìm kiếm
            </button>
          </div>
        </div>
      </section>

      {/* Featured Doctors Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">
            Bác sĩ nổi bật
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-gray-50 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 overflow-hidden">
                    {doctor.profileImage ? (
                      <img
                        src={doctor.profileImage}
                        alt={`${doctor.firstName} ${doctor.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {doctor.firstName} {doctor.lastName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {doctor.specialization}
                    </div>
                    <div className="text-yellow-500 flex items-center justify-center mt-1">
                      {'★'.repeat(Math.floor(doctor.rating))}
                      {doctor.rating % 1 !== 0 && '☆'}
                      <span className="ml-1 text-gray-600 text-xs">
                        ({doctor.rating})
                      </span>
                    </div>
                    <div className="text-cyan-500 font-medium mt-2">
                      {doctor.consultationFee?.toLocaleString()}đ
                    </div>
                    <div className="text-gray-500 text-xs">
                      {doctor.experience} năm KN
                    </div>
                  </div>
                </div>

                <button
                  className="w-full mt-4 bg-cyan-500 hover:bg-cyan-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                  onClick={() => navigate(`/patient/doctors/${doctor.id}/book`)}
                >
                  Đặt lịch khám
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/patient/doctors/list')}
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Xem tất cả bác sĩ
            </button>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-cyan-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">500+</div>
              <div className="text-cyan-200">Bác sĩ chuyên khoa</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">50,000+</div>
              <div className="text-cyan-200">Bệnh nhân tin tưởng</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">25+</div>
              <div className="text-cyan-200">Chuyên khoa</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">4.8/5</div>
              <div className="text-cyan-200">Đánh giá trung bình</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Bắt đầu chăm sóc sức khỏe ngay hôm nay
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Đăng ký tài khoản để trải nghiệm đầy đủ các tính năng và nhận được sự chăm sóc tốt nhất
          </p>
          {!isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleLogin}
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Đăng nhập
              </button>
              <button
                onClick={handleRegister}
                className="bg-white hover:bg-gray-50 text-cyan-600 border border-cyan-600 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Đăng ký ngay
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/patient/dashboard')}
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Đi tới Dashboard
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;