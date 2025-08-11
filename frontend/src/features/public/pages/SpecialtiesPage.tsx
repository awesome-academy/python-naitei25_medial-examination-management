"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Search, Users, ChevronRight, Heart, Brain, Eye, Baby, Stethoscope, Ear } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Specialty {
  id: number
  name: string
  description: string
  doctorCount: number
  icon: any
  color: string
  bgColor: string
  features: string[]
}

export default function SpecialtiesPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Get filter from URL params
    const urlFilter = searchParams.get("filter")
    if (urlFilter) {
      setSearchQuery(urlFilter)
    }

    const mockSpecialties: Specialty[] = [
      {
        id: 1,
        name: "Tim mạch",
        description: "Chuyên khoa điều trị các bệnh lý về tim và mạch máu",
        doctorCount: 25,
        icon: Heart,
        color: "text-red-600",
        bgColor: "bg-red-50",
        features: ["Siêu âm tim", "Điện tâm đồ", "Thông tim", "Phẫu thuật tim"],
      },
      {
        id: 2,
        name: "Thần kinh",
        description: "Chẩn đoán và điều trị các bệnh lý về hệ thần kinh",
        doctorCount: 20,
        icon: Brain,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        features: ["MRI não", "Điện não đồ", "Điều trị đột quỵ", "Parkinson"],
      },
      {
        id: 3,
        name: "Mắt",
        description: "Chăm sóc và điều trị các vấn đề về mắt và thị lực",
        doctorCount: 18,
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        features: ["Phẫu thuật mắt", "Điều trị cận thị", "Glaucoma", "Đục thủy tinh thể"],
      },
      {
        id: 4,
        name: "Nhi khoa",
        description: "Chăm sóc sức khỏe toàn diện cho trẻ em từ sơ sinh đến 18 tuổi",
        doctorCount: 30,
        icon: Baby,
        color: "text-pink-600",
        bgColor: "bg-pink-50",
        features: ["Tiêm chủng", "Khám định kỳ", "Dinh dưỡng", "Phát triển"],
      },
      {
        id: 5,
        name: "Da liễu",
        description: "Điều trị các bệnh lý về da, tóc và móng",
        doctorCount: 15,
        icon: Stethoscope,
        color: "text-green-600",
        bgColor: "bg-green-50",
        features: ["Điều trị mụn", "Laser", "Botox", "Phẫu thuật thẩm mỹ"],
      },
      {
        id: 6,
        name: "Tai mũi họng",
        description: "Chẩn đoán và điều trị các bệnh lý về tai, mũi, họng",
        doctorCount: 12,
        icon: Ear,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        features: ["Nội soi", "Phẫu thuật", "Điều trị viêm", "Khám thính lực"],
      },
    ]

    setTimeout(() => {
      setSpecialties(mockSpecialties)
      setLoading(false)
    }, 1000)
  }, [searchParams])

  const filteredSpecialties = specialties.filter(
    (specialty) =>
      specialty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specialty.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="p-6">
                  <div className="h-16 w-16 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Chuyên khoa y tế</h1>
            <p className="text-lg text-teal-100 max-w-2xl mx-auto">
              Khám phá các chuyên khoa với đội ngũ bác sĩ chuyên nghiệp và trang thiết bị hiện đại
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm chuyên khoa..."
                className="pl-12 h-12 bg-white/95 backdrop-blur-sm border-0"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSpecialties.map((specialty) => {
              const IconComponent = specialty.icon
              return (
                <Card
                  key={specialty.id}
                  className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden cursor-pointer"
                  onClick={() => console.log(`Navigate to specialty ${specialty.id}`)}
                >
                  <CardHeader className="pb-4">
                    <div className={`w-16 h-16 ${specialty.bgColor} rounded-2xl flex items-center justify-center mb-4`}>
                      <IconComponent className={`h-8 w-8 ${specialty.color}`} />
                    </div>

                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">{specialty.name}</h3>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                        <Users className="h-3 w-3 mr-1" />
                        {specialty.doctorCount} BS
                      </Badge>
                    </div>

                    <p className="text-gray-600 leading-relaxed">{specialty.description}</p>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-6">
                      <h4 className="font-semibold text-gray-900">Dịch vụ nổi bật:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {specialty.features.map((feature, index) => (
                          <div key={index} className="text-sm text-gray-600 flex items-center">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-2"></div>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 group-hover:shadow-lg transition-all"
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log(`View doctors in ${specialty.name}`)
                      }}
                    >
                      Xem bác sĩ
                      <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredSpecialties.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy chuyên khoa</h3>
              <p className="text-gray-600">Vui lòng thử lại với từ khóa khác</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Cần tư vấn chuyên khoa?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Đội ngũ bác sĩ chuyên khoa của chúng tôi sẵn sàng tư vấn và hỗ trợ bạn
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
          >
            Đặt lịch tư vấn ngay
          </Button>
        </div>
      </section>
    </div>
  )
}
