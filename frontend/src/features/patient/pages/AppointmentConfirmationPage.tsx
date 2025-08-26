import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { message } from "antd";
import { appointmentService } from "../../../shared/services/appointmentService";
import { paymentService } from "../../../shared/services/paymentService";
import { patientApiService } from "../services/patientApiService";
import { patientService } from "../../../shared/services/patientService";
import { useAuth } from "../../../shared/context/AuthContext";
import LoadingSpinner from "../../../shared/components/common/LoadingSpinner";
import ErrorMessage from "../../../shared/components/common/ErrorMessage";
import {
  AppointmentStatus,
  type Appointment,
} from "../../../shared/types/appointment";
import type { Doctor } from "../../../shared/types/doctor";
import type { Patient } from "../../../shared/types/patient";
import { useTranslation } from "react-i18next";

const AppointmentConfirmationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const doctorId = Number(params.get("doctorId"));
  const appointmentId = Number(params.get("appointmentId"));
  const appointmentDateFromUrl = params.get("date");
  const { getCurrentUserId } = useAuth();
  const userId = getCurrentUserId();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [doctorDetails, setDoctorDetails] = useState<Doctor | null>(null);
  const [patientDetails, setPatientDetails] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!appointmentId || !doctorId || !userId) {
          throw new Error(t("appointment.confirmation.missingInfo"));
        }

        const appointmentData = await appointmentService.getAppointmentById(
          appointmentId
        );
        setAppointment(appointmentData);

        const doctorData = await patientApiService.doctors.getById(doctorId);
        setDoctorDetails(doctorData);

        const patientData = await patientService.getPatientByUserId(userId);
        setPatientDetails(patientData);
      } catch (err: any) {
        console.error(
          "Error fetching data for confirmation:",
          err.response?.data || err.message
        );
        setError(
          err.response?.data?.error ||
            err.message ||
            t("appointment.confirmation.errorLoad")
        );
        setAppointment({
          id: appointmentId,
          status: "P" as AppointmentStatus,
          symptoms: "",
          note: "",
          appointmentDate: "",
          appointmentTime: "",
          doctorId: doctorId,
          patientId: 0,
          createdAt: "",
          updatedAt: "",
          doctorInfo: {
            id: doctorId,
            fullName: t("common.loading"),
            specialty: "",
            department: "",
          },
          patientInfo: { id: 0, fullName: t("common.loading"), email: "" },
        });
        setDoctorDetails({
          id: doctorId,
          fullName: t("common.loading"),
          specialty: "",
          department: "",
          price: 0,
        });
        setPatientDetails({ id: 0, fullName: t("common.loading"), email: "" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appointmentId, doctorId, userId, t]);

  const handleConfirm = useCallback(async () => {
    setConfirming(true);
    try {
      if (
        !appointment ||
        !doctorDetails ||
        !patientDetails ||
        doctorDetails.price === undefined ||
        doctorDetails.price === null ||
        doctorDetails.price <= 0
      ) {
        throw new Error(t("appointment.confirmation.invalidData"));
      }

      await appointmentService.updateAppointment(appointment.id, {
        status: "C" as AppointmentStatus,
      });
      const bill = await paymentService.createBillFromAppointment(
        appointment.id,
        patientDetails.id,
        doctorDetails.price
      );
      const paymentUrl = await paymentService.createPaymentLink(bill.id);
      window.location.href = paymentUrl;
    } catch (error: any) {
      console.error(
        "Error during confirmation:",
        error.response?.data || error.message
      );
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        t("appointment.confirmation.errorConfirm");
      message.error(errorMsg);
      setError(errorMsg);
    } finally {
      setConfirming(false);
    }
  }, [appointment, doctorDetails, patientDetails, t]);

  const handleBackToDoctor = () => {
    let symptoms: string[] = [];
    let note = "";
    if (appointment?.symptoms) {
      const [symptomsStr, noteStr] = appointment.symptoms.split("; Note: ");
      symptoms = symptomsStr ? symptomsStr.split(", ").filter(Boolean) : [];
      note = noteStr || "";
    }

    const appointmentForm = {
      date: appointmentDateFromUrl || new Date().toISOString().split("T")[0],
      session: appointment?.schedule?.shift || "M",
      time: appointment?.slot_start
        ? appointment.slot_start.substring(0, 5)
        : "",
      symptoms: appointment?.symptoms ? appointment.symptoms.split(", ") : [],
      note: appointment?.notes || "",
    };

    navigate(`/patient/departments/doctors/${doctorId}?book=true`, {
      state: { appointmentForm, appointmentId }, // Đảm bảo truyền appointmentId
    });
  };

  if (loading) {
    return <LoadingSpinner message={t("appointment.confirmation.loading")} />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <ErrorMessage message={error} />
        <div className="flex justify-center mt-4">
          <Button
            onClick={handleBackToDoctor}
            className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-3 rounded-lg"
          >
            {t("common.back")}
          </Button>
        </div>
      </div>
    );
  }

  if (!appointment || !doctorDetails || !patientDetails) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <ErrorMessage message={t("appointment.confirmation.incompleteInfo")} />
        <div className="flex justify-center mt-4">
          <Button
            onClick={handleBackToDoctor}
            className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-3 rounded-lg"
          >
            {t("common.back")}
          </Button>
        </div>
      </div>
    );
  }

  const getPatientFullName = (patient: Patient | null) => {
    if (!patient) return "N/A";
    if (patient.first_name && patient.last_name) {
      return `${patient.first_name} ${patient.last_name}`;
    }
    if (patient.fullName) {
      return patient.fullName;
    }
    return "N/A";
  };

  const getDoctorFullName = (doctor: Doctor | null) => {
    if (!doctor) return "N/A";
    if (doctor.first_name && doctor.last_name) {
      return `${doctor.first_name} ${doctor.last_name}`;
    }
    if ((doctor as any).fullName) {
      return (doctor as any).fullName;
    }
    return "N/A";
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card className="shadow-lg border border-gray-200 rounded-lg">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-t-lg p-6">
          <CardTitle className="text-2xl font-bold text-center">
            {t("appointment.confirmation.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg shadow-inner space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">
              {t("appointment.confirmation.details")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-600">
                  {t("appointment.confirmation.id")}:
                </span>
                <p className="text-gray-900 font-medium">{appointment.id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  {t("appointment.confirmation.doctor")}:
                </span>
                <p className="text-gray-900 font-medium">
                  {getDoctorFullName(doctorDetails)}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  {t("appointment.confirmation.date")}:
                </span>
                <p className="text-gray-900 font-medium">
                  {appointmentDateFromUrl
                    ? new Date(appointmentDateFromUrl).toLocaleDateString(
                        "vi-VN"
                      )
                    : "N/A"}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  {t("appointment.confirmation.time")}:
                </span>
                <p className="text-gray-900 font-medium">
                  {appointment.slotStart
                    ? appointment.slotStart.substring(0, 5)
                    : "N/A"}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  {t("appointment.confirmation.status")}:
                </span>
                <p className="text-yellow-600 font-semibold">
                  {appointment.status === "P"
                    ? t("appointment.status.pending")
                    : appointment.status === "C"
                    ? t("appointment.status.confirmed")
                    : appointment.status}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  {t("appointment.confirmation.patient")}:
                </span>
                <p className="text-gray-900 font-medium">
                  {getPatientFullName(patientDetails)}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  {t("appointment.confirmation.session")}:
                </span>
                <p className="text-gray-900 font-medium">
                  {appointment.schedule?.shift === "M"
                    ? t("appointment.morning")
                    : appointment.schedule?.shift === "A"
                    ? t("appointment.afternoon")
                    : appointment.schedule?.shift || "N/A"}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  {t("appointment.confirmation.price")}:
                </span>
                <p className="text-gray-900 font-medium">
                  {doctorDetails.price?.toLocaleString("vi-VN") || "N/A"} VND
                </p>
              </div>
            </div>
            {appointment.symptoms && (
              <div>
                <span>{t("appointment.confirmation.symptoms")}:</span>
                <p>{appointment.symptoms}</p>
              </div>
            )}

            {appointment.note && (
              <div>
                <span>{t("appointment.confirmation.note")}:</span>
                <p>{appointment.note}</p>
              </div>
            )}
            {appointment.schedule && (
              <div className="mt-4">
                <span className="font-medium text-gray-600">
                  {t("appointment.confirmation.location")}:
                </span>
                <p className="text-gray-900 mt-2">
                  <span className="font-medium">
                    {t("appointment.confirmation.room", {
                      room: appointment.schedule.room,
                    })}
                  </span>
                  {appointment.schedule.floor &&
                    ` - ${t("appointment.confirmation.floor", {
                      floor: appointment.schedule.floor,
                    })}`}
                  {appointment.schedule.building &&
                    ` - ${t("appointment.confirmation.building", {
                      building: appointment.schedule.building,
                    })}`}
                </p>
                <p className="text-sm text-gray-500">
                  {t("appointment.confirmation.workingTime", {
                    start: appointment.schedule.start_time?.substring(0, 5),
                    end: appointment.schedule.end_time?.substring(0, 5),
                  })}
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleConfirm}
              disabled={confirming || appointment.status !== "P"}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 ease-in-out disabled:bg-green-400 disabled:cursor-not-allowed"
            >
              {confirming
                ? t("appointment.confirmation.processing")
                : t("appointment.confirmation.confirmAndPay")}
            </Button>
            <Button
              type="button"
              onClick={handleBackToDoctor}
              className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-3 rounded-lg font-semibold transition duration-200 ease-in-out"
            >
              {t("common.goBack")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentConfirmationPage;
