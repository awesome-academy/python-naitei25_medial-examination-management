"use client";

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { doctorService } from "../../../shared/services/doctorService";
import { departmentService } from "../../../shared/services/departmentService";
import { useAuth } from "../../../shared/context/AuthContext";
import { useTranslation } from "react-i18next";

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  specialization: string;
  avatar?: string;
  price?: number;
  department: {
    department_name: string;
  };
}

const PAGE_SIZE = 6;

const DoctorsPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // pagination, sort, filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"name" | "price">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterSpecialization, setFilterSpecialization] = useState("");

  const departmentId = searchParams.get("department");
  const searchQuery = searchParams.get("search");

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        let fetchedDoctors: Doctor[] = [];

        if (departmentId) {
          const deptDoctors = await departmentService.getDoctorsByDepartmentId(
            Number(departmentId)
          );
          fetchedDoctors = deptDoctors;
        } else if (searchQuery) {
          const allDoctors = await doctorService.getAllDoctors();
          fetchedDoctors = allDoctors.filter(
            (doc) =>
              doc.first_name
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              doc.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              doc.specialization
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              doc.department.department_name
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
          );
        } else {
          fetchedDoctors = await doctorService.getAllDoctors();
        }

        setDoctors(
          fetchedDoctors.map((doctor) => ({
            id: doctor.id,
            first_name: doctor.first_name,
            last_name: doctor.last_name,
            specialization: doctor.specialization,
            avatar: doctor.avatar,
            price: doctor.price,
            department: {
              department_name: doctor.department.department_name,
            },
          }))
        );
      } catch (error) {
        console.error("Error fetching doctors:", error);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [departmentId, searchQuery]);

  // Filter
  const filteredDoctors = doctors.filter((doc) =>
    filterSpecialization
      ? doc.specialization
          .toLowerCase()
          .includes(filterSpecialization.toLowerCase())
      : true
  );

  // Sort
  const sortedDoctors = [...filteredDoctors].sort((a, b) => {
    if (sortBy === "name") {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
      return sortOrder === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    } else {
      const priceA = a.price || 0;
      const priceB = b.price || 0;
      return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedDoctors.length / PAGE_SIZE);
  const paginatedDoctors = sortedDoctors.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Header Section giữ nguyên */}
      <section className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-emerald-600 to-green-700 text-white mb-12">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t("doctors.header.title")}
          </h1>
          <p className="text-lg text-teal-100 mb-6">
            {t("doctors.header.subtitle")}
          </p>
          <div className="flex justify-center gap-4 max-w-xl mx-auto">
            <Input
              placeholder={t("doctors.search.placeholder")}
              defaultValue={searchQuery || ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate(
                    `/doctors?search=${encodeURIComponent(
                      (e.target as HTMLInputElement).value
                    )}`
                  );
                }
              }}
              className="bg-white/10 border-white/20 text-white placeholder:text-teal-200"
            />
            <Button
              onClick={() =>
                navigate(
                  `/doctors?search=${encodeURIComponent(
                    (document.querySelector("input") as HTMLInputElement)
                      ?.value || ""
                  )}`
                )
              }
              className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
            >
              <Search className="h-4 w-4 mr-2" />
              {t("doctors.search.button")}
            </Button>
          </div>
        </div>
      </section>

      {/* Sort + Filter Controls */}
      <div className="container mx-auto px-4 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-teal-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Sort Controls */}
          <div className="flex gap-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "name" | "price")}
                className="appearance-none pl-10 pr-4 py-2 rounded-lg bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 text-gray-800 focus:ring-2 focus:outline-none transition-all"
              >
                <option value="name">{t("doctors.sort.name")}</option>
                <option value="price">{t("doctors.sort.price")}</option>
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
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
            </div>
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className="appearance-none pl-10 pr-4 py-2 rounded-lg bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
              >
                <option value="asc">{t("doctors.sort.asc")}</option>
                <option value="desc">{t("doctors.sort.desc")}</option>
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
          </div>
          {/* Filter Input */}
          <div className="relative max-w-xs w-full">
            <Input
              placeholder={t("doctors.filter.specialization")}
              value={filterSpecialization}
              onChange={(e) => setFilterSpecialization(e.target.value)}
              className="pl-10 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 text-gray-800 placeholder:text-teal-400 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all hover:bg-teal-100"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600" />
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="container mx-auto px-4 pb-20">
        {paginatedDoctors.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedDoctors.map((doctor) => (
                <Card
                  key={doctor.id}
                  className="group hover:shadow-xl transition-all border-0 overflow-hidden"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={doctor.avatar || "/placeholder-doctor.jpg"}
                      alt={`${doctor.first_name} ${doctor.last_name}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <Badge className="absolute top-4 right-4 bg-gradient-to-r from-teal-500 to-emerald-500">
                      {doctor.department.department_name}
                    </Badge>
                  </div>
                  <CardHeader className="p-6 text-center">
                    <h3 className="text-xl font-bold text-gray-900">
                      {t("doctors.prefix")} {doctor.first_name}{" "}
                      {doctor.last_name}
                    </h3>
                    <p className="text-teal-600 font-medium">
                      {doctor.specialization}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {t("doctors.labels.fee")}
                        </span>
                        <span className="font-bold text-green-600">
                          {doctor.price?.toLocaleString()}đ
                        </span>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 group-hover:shadow-lg transition-all"
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate("/auth/patient-login");
                        } else {
                          navigate(`/patient/booking?doctorId=${doctor.id}`);
                        }
                      }}
                    >
                      {t("doctors.actions.book")}
                      <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
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

  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
    <Button
      key={page}
      variant={page === currentPage ? "default" : "outline"}
      onClick={() => setCurrentPage(page)}
    >
      {page}
    </Button>
  ))}

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
          <p className="text-center text-gray-600">{t("doctors.empty")}</p>
        )}
      </div>
    </div>
  );
};

export default DoctorsPage;
