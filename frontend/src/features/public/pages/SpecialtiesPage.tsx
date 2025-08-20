"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, ChevronRight, Search } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { departmentService } from "../../../shared/services/departmentService";
import { useTranslation } from "react-i18next";

interface Department {
  id: number;
  department_name: string;
  description?: string;
}

const ITEMS_PER_PAGE = 6; // số chuyên khoa mỗi trang

const SpecialtiesPage = () => {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterName, setFilterName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      try {
        const data = await departmentService.getDepartments();
        setDepartments(data);
      } catch (error) {
        console.error("Error fetching departments:", error);
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Apply filter + sort
  const filteredDepartments = departments
    .filter((dept) =>
      dept.department_name.toLowerCase().includes(filterName.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.department_name.localeCompare(b.department_name);
      }
      return b.department_name.localeCompare(a.department_name);
    });

  // Pagination
  const totalPages = Math.ceil(filteredDepartments.length / ITEMS_PER_PAGE);
  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="h-24 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 text-white mb-12">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t("specialties.header.title")}
          </h1>
          <p className="text-lg text-teal-100 mb-6">
            {t("specialties.header.subtitle")}
          </p>
        </div>
      </section>

      {/* Controls */}
      <div className="container mx-auto px-4 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-teal-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Sort */}
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="appearance-none pl-10 pr-4 py-2 rounded-lg bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all hover:bg-teal-100"
            >
              <option value="asc">{t("specialties.sort.asc")}</option>
              <option value="desc">{t("specialties.sort.desc")}</option>
            </select>
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </div>

          {/* Filter */}
          <div className="relative max-w-xs w-full">
            <Input
              placeholder={t("specialties.filter.name")}
              value={filterName}
              onChange={(e) => {
                setFilterName(e.target.value);
                setCurrentPage(1); // reset về trang 1 khi filter
              }}
              className="pl-10 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 text-gray-800 placeholder:text-teal-400 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all hover:bg-teal-100"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600" />
          </div>
        </div>
      </div>

      {/* Specialties Grid */}
      <div className="container mx-auto px-4 pb-20">
        {paginatedDepartments.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedDepartments.map((dept) => (
                <Card
                  key={dept.id}
                  className="group hover:shadow-xl transition-all border-0 overflow-hidden h-full flex flex-col"
                >
                  <CardHeader className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {dept.department_name}
                      </h3>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 flex flex-col flex-grow">
                    <p className="text-gray-600 text-sm mb-6 line-clamp-3 min-h-[60px]">
                      {dept.description || t("specialties.noDescription")}
                    </p>
                    <div className="mt-auto">
                      <Button
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 group-hover:shadow-lg transition-all"
                        onClick={() =>
                          navigate(`/doctors?department=${dept.id}`)
                        }
                      >
                        {t("specialties.actions.viewDoctors")}
                        <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-10 gap-2 flex-wrap">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                {t("common.prev")}
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                {t("common.next")}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-600">{t("specialties.empty")}</p>
        )}
      </div>
    </div>
  );
};

export default SpecialtiesPage;
