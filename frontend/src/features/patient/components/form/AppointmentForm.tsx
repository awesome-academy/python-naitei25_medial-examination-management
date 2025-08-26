import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { doctorService } from "../../../../shared/services/doctorService";
import { patientService } from "../../../../shared/services/patientService";
import { appointmentService } from "../../../../shared/services/appointmentService";
import { useAuth } from "../../../../shared/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { message } from "antd";
import LoadingSpinner from "../../../../shared/components/common/LoadingSpinner";
import ErrorMessage from "../../../../shared/components/common/ErrorMessage";
import { Button } from "@/components/ui/button";
import type { BackendCreateAppointmentPayload } from "../../../../shared/types/appointment";
import { useTranslation } from "react-i18next";

interface AppointmentFormProps {
  doctorId: number;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ doctorId }) => {
  const { t } = useTranslation();
  const { getCurrentUserId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = getCurrentUserId();
  const [patientId, setPatientId] = useState<number | null>(null);
  const [appointmentId, setAppointmentId] = useState<number | null>(null);
  const [appointmentForm, setAppointmentForm] = useState({
    date: new Date().toISOString().split("T")[0],
    session: "M",
    time: "",
    symptoms: [] as string[],
    note: "",
  });
  const [schedules, setSchedules] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const symptomsList = [
    { value: "fever", label: t("appointment.symptomFever") },
    { value: "cough", label: t("appointment.symptomCough") },
    { value: "headache", label: t("appointment.symptomHeadache") },
    { value: "other", label: t("appointment.symptomOther") },
  ];

  const sessions = [
    { value: "M", label: t("appointment.morning") },
    { value: "A", label: t("appointment.afternoon") },
  ];

  useEffect(() => {
    if (location.state?.appointmentForm) {
      setAppointmentForm(location.state.appointmentForm);
    }
    if (location.state?.appointmentId) {
      setAppointmentId(location.state.appointmentId);
    }
  }, [location.state]);

  useEffect(() => {
    if (userId) {
      setLoadingSchedules(true);
      patientService
        .getPatientByUserId(userId)
        .then((data) => {
          setPatientId(data.id);
          setLoadingSchedules(false);
        })
        .catch(() => {
          setError(t("appointment.noPatientInfo"));
          message.error(t("appointment.noPatientInfo"));
          setLoadingSchedules(false);
        });
    }
  }, [userId, t]);

  useEffect(() => {
    if (appointmentForm.date) {
      setLoadingSchedules(true);
      setError(null);
      doctorService
        .getDoctorSchedule(doctorId, appointmentForm.date)
        .then((data) => {
          setSchedules(data);
          setLoadingSchedules(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoadingSchedules(false);
          message.error(err.message);
        });
    }
  }, [appointmentForm.date, doctorId]);

  useEffect(() => {
    if (appointmentForm.date && schedules.length > 0) {
      setLoadingSlots(true);
      setError(null);

      const schedule = schedules.find(
        (s) =>
          s.shift === appointmentForm.session &&
          s.work_date === appointmentForm.date
      );

      if (schedule) {
        doctorService
          .getAvailableTimeSlots(schedule.id, appointmentForm.date)
          .then((data) => {
            let filteredSlots = (data?.timeSlots || []).filter(
              (slot) => slot.available
            );

            // 🔑 Nếu slot đã chọn không còn available thì vẫn giữ lại để hiển thị
            if (
              appointmentForm.time &&
              !filteredSlots.some((s) => s.time === appointmentForm.time)
            ) {
              filteredSlots = [
                ...filteredSlots,
                { time: appointmentForm.time, available: false },
              ];
            }

            setAvailableSlots(filteredSlots);

            // giữ nguyên time cũ nếu vẫn còn
            if (
              appointmentForm.time &&
              filteredSlots.some((slot) => slot.time === appointmentForm.time)
            ) {
              // do nothing
            } else if (filteredSlots.length > 0) {
              handleInputChange("time", filteredSlots[0].time);
            } else {
              handleInputChange("time", "");
            }

            setLoadingSlots(false);
          })
          .catch((err) => {
            setError(err.message);
            setLoadingSlots(false);
            message.error(err.message);
          });
      } else {
        setAvailableSlots([]);
        handleInputChange("time", "");
        setLoadingSlots(false);
      }
    }
  }, [appointmentForm.date, appointmentForm.session, doctorId, schedules]);

  const handleInputChange = (field: string, value: any) => {
    setAppointmentForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateSlotEnd = (startTime: string) => {
    if (!startTime) return "";
    const [hours, minutes, seconds = "00"] = startTime.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes + 30, seconds);
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      message.error(t("auth.pleaseLogin"));
      navigate("/login");
      return;
    }

    if (!patientId) {
      message.error(t("appointment.noPatientInfo"));
      return;
    }

    if (!appointmentForm.time) {
      message.error(t("appointment.selectTime"));
      return;
    }

    const selectedSlot = availableSlots.find(
      (slot) => slot.time === appointmentForm.time
    );
    if (!selectedSlot) {
      message.error(t("appointment.selectTime"));
      return;
    }

    const now = new Date();
    const slotDateTime = new Date(
      appointmentForm.date + "T" + selectedSlot.time
    );
    if (slotDateTime <= now) {
      message.error(t("appointment.pastNotAllowed"));
      return;
    }

    setLoadingSlots(true);

    try {
      const schedule = schedules.find(
        (s) =>
          s.shift === appointmentForm.session &&
          s.work_date === appointmentForm.date
      );

      if (!schedule) {
        message.error(t("appointment.noScheduleFound"));
        setLoadingSlots(false);
        return;
      }

      const payload: BackendCreateAppointmentPayload = {
        doctor: doctorId,
        patient: patientId,
        schedule: schedule.id,
        slot_start: appointmentForm.time,
        slot_end: calculateSlotEnd(appointmentForm.time),
        symptoms:
          appointmentForm.symptoms.length > 0
            ? appointmentForm.symptoms.join(", ")
            : "",
        note: appointmentForm.note,
        status: "P",
      };

      console.log("Payload gửi lên:", payload);

      const appointment = await appointmentService.createAppointment(payload);

      message.success(t("appointment.success"));

      setTimeout(() => {
        navigate(
          `/patient/departments/appointments/confirm?doctorId=${doctorId}&date=${appointmentForm.date}&appointmentId=${appointment.id}`,
          { state: { appointmentForm, appointmentId: appointment.id } }
        );
      }, 500);
    } catch (error: any) {
      console.error("Error submitting appointment:", error);

      let errorMessage = t("appointment.errorGeneric");

      if (error?.response?.data) {
        const apiError = error.response.data;
        if (typeof apiError === "string") {
          errorMessage = apiError;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        } else if (apiError.error) {
          errorMessage = apiError.error;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);

      if (error?.response?.status === 201 || error?.response?.status === 200) {
        message.warning(t("appointment.checkStatus"));
      }
    } finally {
      setLoadingSlots(false);
    }
  };

  return (
    <Card className="shadow-lg border border-gray-200 rounded-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">
          {t("appointment.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loadingSchedules || loadingSlots ? <LoadingSpinner /> : null}
        {error && <ErrorMessage message={error} />}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Date */}
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-cyan-600" />
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700">
                {t("appointment.date")}
              </label>
              <DatePicker
                selected={new Date(appointmentForm.date)}
                onChange={(date) =>
                  handleInputChange(
                    "date",
                    date?.toISOString().split("T")[0] || ""
                  )
                }
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-cyan-600 focus:border-cyan-600"
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
              />
            </div>
          </div>

          {/* Session */}
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-cyan-600" />
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700">
                {t("appointment.session")}
              </label>
              <div className="flex space-x-2 mt-1">
                {sessions.map((session) => (
                  <button
                    key={session.value}
                    type="button"
                    onClick={() => handleInputChange("session", session.value)}
                    className={`px-4 py-2 rounded-lg border ${
                      appointmentForm.session === session.value
                        ? "bg-cyan-600 text-white"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {session.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-cyan-600" />
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700">
                {t("appointment.time")}
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {availableSlots.length === 0 ? (
                  <span className="text-gray-500">
                    {t("appointment.noAvailableSlots")}
                  </span>
                ) : (
                  availableSlots.map((slot) => {
                    const isToday =
                      appointmentForm.date ===
                      new Date().toISOString().split("T")[0];
                    const now = new Date();
                    const slotDateTime = new Date(
                      appointmentForm.date + "T" + slot.time
                    );
                    const isPastSlot = isToday && slotDateTime <= now;

                    const isSelected = appointmentForm.time === slot.time;

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={isPastSlot && !isSelected}
                        onClick={() => handleInputChange("time", slot.time)}
                        className={`px-4 py-2 rounded-lg border transition ${
                          isPastSlot && !isSelected
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : isSelected
                            ? "bg-cyan-600 text-white"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              {t("appointment.symptoms")}
            </label>
            <Select
              isMulti
              className="basic-multi-select"
              classNamePrefix="select"
              options={symptomsList}
              value={symptomsList.filter((opt) =>
                appointmentForm.symptoms.includes(opt.value)
              )}
              onChange={(selected) =>
                handleInputChange(
                  "symptoms",
                  (selected as { value: string; label: string }[]).map(
                    (s) => s.value
                  )
                )
              }
              placeholder={t("appointment.selectSymptoms")}
            />
          </div>

          {/* Note */}
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700">
                {t("appointment.note")}
              </label>
              <textarea
                value={appointmentForm.note}
                onChange={(e) => handleInputChange("note", e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-cyan-600 focus:border-cyan-600"
                rows={4}
                placeholder={t("appointment.notePlaceholder")}
              />
            </div>
          </div>

          {/* Buttons */}
          <Button
            type="submit"
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 rounded-lg w-full"
          >
            {t("appointment.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AppointmentForm;
