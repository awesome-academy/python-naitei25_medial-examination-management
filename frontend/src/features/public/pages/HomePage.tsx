"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Clock,
  Shield,
  Phone,
  ChevronRight,
  Heart,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { doctorService } from "../../../shared/services/doctorService";
import { departmentService } from "../../../shared/services/departmentService";
import { storage } from "../../../shared/utils/storage";
import { LocalStorageKeys } from "../../../shared/constants/storageKeys";
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

interface Department {
  id: number;
  department_name: string;
  doctorCount: number;
}

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const [featuredDoctors, setFeaturedDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!storage.getRaw(LocalStorageKeys.AUTH_TOKEN)
  );
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const departments = await departmentService.getDepartments();
        const departmentsWithCount = await Promise.all(
          departments.map(async (dept) => {
            const doctors = await departmentService.getDoctorsByDepartmentId(
              dept.id
            );
            return {
              id: dept.id,
              department_name: dept.department_name,
              doctorCount: doctors.length,
            };
          })
        );
        setSpecialties(departmentsWithCount);

        const allDoctors = await doctorService.getAllDoctors();
        setFeaturedDoctors(
          allDoctors.slice(0, 3).map((doctor) => ({
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
        console.error("Error fetching data:", error);
        setFeaturedDoctors([]);
        setSpecialties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/doctors?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

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
          </div>
        </div>
      </div>
    );
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
              <span className="text-sm font-medium">
                {t("home.hero.tagline")}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              {t("home.hero.title")}{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {t("home.hero.highlight")}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-teal-100 mb-10">
              {t("home.hero.subtitle")}
            </p>
            <div className="flex justify-center gap-4 max-w-xl mx-auto">
              <Input
                placeholder={t("home.search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-white/10 border-white/20 text-white placeholder:text-teal-200"
              />
              <Button
                onClick={handleSearch}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
              >
                <Search className="h-4 w-4 mr-2" />
                {t("home.search.button")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Doctors */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("home.featured.title")}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t("home.featured.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredDoctors.length > 0 ? (
              featuredDoctors.map((doctor) => (
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
                      {t("home.doctorPrefix")} {doctor.first_name}{" "}
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
                          {t("home.labels.fee")}
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
                          navigate(`/booking/${doctor.id}`);
                        }
                      }}
                    >
                      {t("home.actions.book")}
                      <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-600 col-span-3">
                {t("home.emptyDoctors")}
              </p>
            )}
          </div>
          <div className="text-center mt-12">
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white bg-transparent"
              onClick={() => navigate("/doctors")}
            >
              {t("home.actions.viewAllDoctors")}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("home.specialties.title")}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t("home.specialties.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {specialties.length > 0 ? (
              specialties.slice(0, 4).map((specialty) => (
                <Card
                  key={specialty.id}
                  className="p-6 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() =>
                    navigate(`/doctors?department=${specialty.id}`)
                  }
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {specialty.department_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {specialty.doctorCount}{" "}
                        {t("home.specialties.doctorCount")}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-600 col-span-4">
                {t("home.emptySpecialties")}
              </p>
            )}
          </div>

          {/* 👉 Nút Xem thêm */}
          {specialties.length > 4 && (
            <div className="text-center mt-12">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white bg-transparent"
                onClick={() => navigate("/specialties")}
              >
                {t("home.actions.viewAllSpecialties")}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("home.features.title")}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t("home.features.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {["safe", "booking", "support"].map((key) => (
              <Card
                key={key}
                className="text-center p-8 border-0 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white mb-6">
                  {key === "safe" && <Shield className="h-8 w-8" />}
                  {key === "booking" && <Clock className="h-8 w-8" />}
                  {key === "support" && <Phone className="h-8 w-8" />}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {t(`home.features.items.${key}.title`)}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t(`home.features.items.${key}.description`)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
