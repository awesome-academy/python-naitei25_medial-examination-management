"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  Star,
  Clock,
  Users,
  Award,
  TrendingUp,
  ChevronRight,
  Stethoscope,
  Heart,
  Shield,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Doctor {
  id: number
  firstName: string
  lastName: string
  specialization: string
  profileImage?: string
  rating: number
  consultationFee: number
  experience: number
  department: {
    departmentName: string
  }
}

interface Department {
  id: number
  departmentName: string
  doctorCount: number
}

const HomePage: React.FC = () => {
  const [featuredDoctors, setFeaturedDoctors] = useState<Doctor[]>([])
  const [specialties, setSpecialties] = useState<Department[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()

  // Mock data for demonstration
  useEffect(() => {
    const mockDoctors: Doctor[] = [
      {
        id: 1,
        firstName: "Nguyễn",
        lastName: "Văn An",
        specialization: "Tim mạch",
        profileImage: "/caring-doctor.png",
        rating: 4.9,
        consultationFee: 500000,
        experience: 15,
        department: { departmentName: "Khoa Tim mạch" },
      },
      {
        id: 2,
        firstName: "Trần",
        lastName: "Thị Bình",
        specialization: "Nhi khoa",
        profileImage: "/female-doctor.png",
        rating: 4.8,
        consultationFee: 400000,
        experience: 12,
        department: { departmentName: "Khoa Nhi" },
      },
      {
        id: 3,
        firstName: "Lê",
        lastName: "Minh Cường",
        specialization: "Thần kinh",
        profileImage: "/neurologist.png",
        rating: 4.7,
        consultationFee: 600000,
        experience: 18,
        department: { departmentName: "Khoa Thần kinh" },
      },
    ]

    const mockSpecialties: Department[] = [
      { id: 1, departmentName: "Tim mạch", doctorCount: 25 },
      { id: 2, departmentName: "Nhi khoa", doctorCount: 30 },
      { id: 3, departmentName: "Thần kinh", doctorCount: 20 },
      { id: 4, departmentName: "Da liễu", doctorCount: 15 },
    ]

    setTimeout(() => {
      setFeaturedDoctors(mockDoctors)
      setSpecialties(mockSpecialties)
      setLoading(false)
    }, 1000)
  }, [])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/doctors?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
              <div className="h-12 bg-gray-200 rounded-lg w-96 mx-auto mb-6"></div>
              <div className="h-6 bg-gray-200 rounded-lg w-[500px] mx-auto mb-8"></div>
              <div className="h-14 bg-gray-200 rounded-lg w-[400px] mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-emerald-600 to-green-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-20 lg:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Heart className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium">Chăm sóc sức khỏe hàng đầu</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Sức khỏe là
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {" "}
                ưu tiên{" "}
              </span>
              hàng đầu
            </h1>

            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-teal-100 leading-relaxed">
              Kết nối với hơn 500+ bác sĩ chuyên khoa hàng đầu. Đặt lịch khám nhanh chóng, an toàn và tiện lợi.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tìm bác sĩ, chuyên khoa..."
                  className="pl-12 h-14 text-lg border-0 bg-white/95 backdrop-blur-sm shadow-lg"
                />
              </div>
              <Button
                onClick={handleSearch}
                size="lg"
                className="h-14 px-8 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-lg"
              >
                Tìm kiếm
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {["Tim mạch", "Nhi khoa", "Da liễu", "Thần kinh"].map((specialty) => (
                <Badge
                  key={specialty}
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 cursor-pointer"
                  onClick={() => navigate(`/specialties?filter=${encodeURIComponent(specialty)}`)}
                >
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, number: "500+", label: "Bác sĩ chuyên khoa", color: "text-teal-600" },
              { icon: Heart, number: "50,000+", label: "Bệnh nhân tin tưởng", color: "text-emerald-500" },
              { icon: Award, number: "25+", label: "Chuyên khoa", color: "text-green-600" },
              { icon: TrendingUp, number: "4.8/5", label: "Đánh giá trung bình", color: "text-slate-600" },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 group-hover:bg-gray-100 transition-colors mb-4 ${stat.color}`}
                >
                  <stat.icon className="h-8 w-8" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Doctors Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 rounded-full px-4 py-2 mb-4">
              <Stethoscope className="h-4 w-4" />
              <span className="text-sm font-medium">Đội ngũ y tế</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Bác sĩ nổi bật</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Gặp gỡ những bác sĩ hàng đầu với kinh nghiệm phong phú và được bệnh nhân tin tưởng
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredDoctors.map((doctor) => (
              <Card
                key={doctor.id}
                className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden"
              >
                <CardHeader className="text-center pb-4">
                  <div className="relative mx-auto mb-4">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                      <AvatarImage
                        src={doctor.profileImage || "/placeholder.svg"}
                        alt={`${doctor.firstName} ${doctor.lastName}`}
                      />
                      <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                        {doctor.firstName[0]}
                        {doctor.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-1">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900">
                    BS. {doctor.firstName} {doctor.lastName}
                  </h3>
                  <p className="text-teal-600 font-medium">{doctor.specialization}</p>

                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900">{doctor.rating}</span>
                    <span className="text-gray-500 text-sm">(128 đánh giá)</span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Kinh nghiệm
                      </span>
                      <span className="font-semibold">{doctor.experience} năm</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Phí khám</span>
                      <span className="font-bold text-green-600">{doctor.consultationFee?.toLocaleString()}đ</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 group-hover:shadow-lg transition-all"
                    onClick={() => console.log(`Booking doctor ${doctor.id}`)}
                  >
                    Đặt lịch khám
                    <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white bg-transparent"
              onClick={() => navigate("/doctors")}
            >
              Xem tất cả bác sĩ
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tại sao chọn chúng tôi?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Chúng tôi cam kết mang đến dịch vụ chăm sóc sức khỏe tốt nhất với công nghệ hiện đại
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "An toàn & Bảo mật",
                description: "Thông tin cá nhân được bảo vệ tuyệt đối với công nghệ mã hóa tiên tiến",
              },
              {
                icon: Clock,
                title: "Đặt lịch 24/7",
                description: "Đặt lịch khám bất cứ lúc nào, bất cứ nơi đâu với hệ thống trực tuyến",
              },
              {
                icon: Phone,
                title: "Hỗ trợ tận tình",
                description: "Đội ngũ chăm sóc khách hàng sẵn sàng hỗ trợ bạn mọi lúc mọi nơi",
              },
            ].map((feature, index) => (
              <Card key={index} className="text-center p-8 border-0 shadow-lg hover:shadow-xl transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white mb-6">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-emerald-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Bắt đầu hành trình chăm sóc sức khỏe</h2>
            <p className="text-lg mb-10 text-teal-100">
              Đăng ký ngay hôm nay để trải nghiệm dịch vụ chăm sóc sức khỏe hiện đại và chuyên nghiệp
            </p>

            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-teal-600 hover:bg-gray-100 shadow-lg"
                  onClick={() => navigate("/auth/login")}
                >
                  Đăng nhập
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-teal-600 bg-transparent"
                  onClick={() => navigate("/auth/register")}
                >
                  Đăng ký ngay
                </Button>
              </div>
            ) : (
              <Button
                size="lg"
                className="bg-white text-teal-600 hover:bg-gray-100 shadow-lg"
                onClick={() => navigate("/patient/dashboard")}
              >
                Đi tới Dashboard
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
