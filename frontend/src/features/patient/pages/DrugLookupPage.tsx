"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Pill, DollarSign, Shield, AlertTriangle, Clock, User } from "lucide-react"
import { medicineService, type Medicine } from "../../../shared/services/medicineService"
import { useTranslation } from "react-i18next"

const DrugLookupPage: React.FC = () => {
  const { t } = useTranslation()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMedicines = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await medicineService.getAllMedicines()
      setMedicines(data)
      if (data.length > 0) {
        setSelectedMedicine(data[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("drug.error"))
    } finally {
      setLoading(false)
    }
  }

  const searchMedicines = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      fetchMedicines()
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await medicineService.searchMedicines({ name: searchQuery })
      setMedicines(data)
      if (data.length > 0) {
        setSelectedMedicine(data[0])
      } else {
        setSelectedMedicine(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("drug.searchError"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedicines()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchMedicines(searchTerm)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Pill className="text-blue-600" />
            {t("drug.title")}
          </h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t("drug.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t("drug.searching") : t("drug.search")}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Danh sách thuốc */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t("drug.listTitle", { count: medicines.length })}
                </h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">{t("common.loading")}</div>
                ) : medicines.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">{t("drug.notFound")}</div>
                ) : (
                  medicines.map((medicine) => (
                    <div
                      key={medicine.id}
                      onClick={() => setSelectedMedicine(medicine)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedMedicine?.id === medicine.id ? "bg-blue-50 border-blue-200" : ""
                      }`}
                    >
                      <h3 className="font-medium text-gray-900 mb-1">{medicine.medicine_name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{medicine.manufactor}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {medicine.category}
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          {formatPrice(medicine.price)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Chi tiết thuốc */}
          <div className="lg:col-span-2">
            {selectedMedicine ? (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedMedicine.medicine_name}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {selectedMedicine.manufactor}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(selectedMedicine.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Thông tin cơ bản */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        {t("drug.priceInsurance")}
                      </h3>
                      <p className="text-lg font-bold text-green-600 mb-2">{formatPrice(selectedMedicine.price)}</p>
                      <div className="flex items-center gap-2">
                        <Shield
                          className={`w-4 h-4 ${
                            selectedMedicine.is_insurance_covered ? "text-green-600" : "text-gray-400"
                          }`}
                        />
                        <span className="text-sm">
                          {selectedMedicine.is_insurance_covered
                            ? t("drug.insuranceCovered", {
                                discount: selectedMedicine.insurance_discount_percent,
                              })
                            : t("drug.notCovered")}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">{t("drug.productInfo")}</h3>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">{t("drug.category")}:</span> {selectedMedicine.category}
                        </p>
                        <p>
                          <span className="font-medium">{t("drug.unit")}:</span> {selectedMedicine.unit}
                        </p>
                        <p>
                          <span className="font-medium">{t("drug.quantity")}:</span> {selectedMedicine.quantity}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mô tả */}
                  {selectedMedicine.description && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{t("drug.description")}</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedMedicine.description}</p>
                    </div>
                  )}

                  {/* Cách sử dụng */}
                  {selectedMedicine.usage && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{t("drug.usage")}</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedMedicine.usage}</p>
                    </div>
                  )}

                  {/* Tác dụng phụ */}
                  {selectedMedicine.side_effects && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        {t("drug.sideEffects")}
                      </h3>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <p className="text-gray-700 leading-relaxed">{selectedMedicine.side_effects}</p>
                      </div>
                    </div>
                  )}

                  {/* Cảnh báo */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      {t("drug.warningTitle")}
                    </h3>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>{t("drug.warning1")}</li>
                      <li>{t("drug.warning2")}</li>
                      <li>{t("drug.warning3")}</li>
                      <li>{t("drug.warning4")}</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t("drug.selectMedicine")}</h3>
                <p className="text-gray-600">{t("drug.selectInstruction")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DrugLookupPage
