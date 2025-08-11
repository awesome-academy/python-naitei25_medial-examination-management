"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Search, Star, Clock, MapPin, Filter, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Doctor {
  id: number
  firstName: string
  lastName: string
  specialization: string
  profileImage?: string
  rating: number
  consultationFee: number
  experience: number
  location: string
  availability: string
  department: {
    departmentName: string
  }
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    // Get search query from URL params
    const urlSearch = searchParams.get("search")
    if (urlSearch) {
      setSearchQuery(urlSearch)
    }

    // Mock data
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
        location: "Quận 1, TP.HCM",
        availability: "Có lịch hôm nay",
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
        location: "Quận 3, TP.HCM",
        availability: "Có lịch ngày mai",
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
        location: "Quận 7, TP.HCM",
        availability: "Có lịch tuần sau",
        department: { departmentName: "Khoa Thần kinh" },
      },
      {
        id: 4,
        firstName: "Phạm",
        lastName: "Thị Dung",
        specialization: "Da liễu",
        profileImage: "/placeholder.svg",
        rating: 4.6,
        consultationFee: 450000,
        experience: 10,
        location: "Quận 2, TP.HCM",
        availability: "Có lịch hôm nay",
        department: { departmentName: "Khoa Da liễu" },
      },
      {
        id: 5,
        firstName: "Hoàng",
        lastName: "Văn Em",
        specialization: "Mắt",
        profileImage: "/placeholder.svg",
        rating: 4.8,
        consultationFee: 550000,
        experience: 14,
        location: "Quận 5, TP.HCM",
        availability: "Có lịch ngày mai",
        department: { departmentName: "Khoa Mắt" },
      },
      {
        id: 6,
        firstName: "Vũ",
        lastName: "Thị Phương",
        specialization: "Tai mũi họng",
        profileImage: "/placeholder.svg",
        rating: 4.5,
        consultationFee: 400000,
        experience: 8,
        location: "Quận 10, TP.HCM",
        availability: "Có lịch tuần sau",
        department: { departmentName: "Khoa Tai mũi họng" },
      },
    ]

    setTimeout(() => {
      setDoctors(mockDoctors)
      setLoading(false)
    }, 1000)
  }, [searchParams])

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSpecialty = selectedSpecialty === "all" || doctor.specialization === selectedSpecialty
    const matchesLocation = selectedLocation === "all" || doctor.location.includes(selectedLocation)

    return matchesSearch && matchesSpecialty && matchesLocation
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-teal-600 to-emerald-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Tìm bác sĩ phù hợp</h1>
            <p className="text-lg text-teal-100 max-w-2xl mx-auto">
              Khám phá đội ngũ bác sĩ chuyên nghiệp với kinh nghiệm phong phú
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên bác sĩ hoặc chuyên khoa..."
                    className="pl-12 h-12 bg-white/95 backdrop-blur-sm border-0"
                  />
                </div>
              </div>

              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger className="h-12 bg-white/95 backdrop-blur-sm border-0">
                  <SelectValue placeholder="Chuyên khoa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả chuyên khoa</SelectItem>
                  <SelectItem value="Tim mạch">Tim mạch</SelectItem>
                  <SelectItem value="Nhi khoa">Nhi khoa</SelectItem>
                  <SelectItem value="Thần kinh">Thần kinh</SelectItem>
                  <SelectItem value="Da liễu">Da liễu</SelectItem>
                  <SelectItem value="Mắt">Mắt</SelectItem>
                  <SelectItem value="Tai mũi họng">Tai mũi họng</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="h-12 bg-white/95 backdrop-blur-sm border-0">
                  <SelectValue placeholder="Khu vực" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả khu vực</SelectItem>
                  <SelectItem value="Quận 1">Quận 1</SelectItem>
                  <SelectItem value="Quận 2">Quận 2</SelectItem>
                  <SelectItem value="Quận 3">Quận 3</SelectItem>
                  <SelectItem value="Quận 5">Quận 5</SelectItem>
                  <SelectItem value="Quận 7">Quận 7</SelectItem>
                  <SelectItem value="Quận 10">Quận 10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Tìm thấy {filteredDoctors.length} bác sĩ</h2>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-gray-600">Sắp xếp theo đánh giá</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDoctors.map((doctor) => (
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
                      <span className="text-gray-600 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Địa điểm
                      </span>
                      <span className="font-semibold">{doctor.location}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Phí khám</span>
                      <span className="font-bold text-green-600">{doctor.consultationFee?.toLocaleString()}đ</span>
                    </div>

                    <div className="pt-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {doctor.availability}
                      </Badge>
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

          {filteredDoctors.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy bác sĩ</h3>
              <p className="text-gray-600">Vui lòng thử lại với từ khóa khác hoặc điều chỉnh bộ lọc</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
