import type React from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import FullCalendar from "@fullcalendar/react";
import viLocale from "@fullcalendar/core/locales/vi";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import DatePicker from "../../components/sections/appointments/DatePicker";
import type { Hook } from "flatpickr/dist/types/options";

// Import types
import type {
  Schedule,
  AppointmentRequest,
  AppointmentResponse,
} from "../../types/appointment";
import { AppointmentStatus } from "../../types/appointment";
import type { DepartmentFromAPI } from "../../types/department";
import type { Doctor } from "../../types/doctor";
import type { Patient, RawPatientFromAPI } from "../../types/patient";

// Import services
import { appointmentService } from "../../services/appointmentService";
import { patientService } from "../../services/patientService";
import { departmentService } from "../../services/departmentService";
import { doctorService } from "../../services/doctorService";
import { userService } from "../../../../shared/services/userService";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    calendar: "success" | "waiting" | "cancel" | "upcoming" | "no-show";
    patientName: string;
    patientId: number;
    insuranceId: string;
    phoneNumber: string;
    patientAge?: number;
    symptoms?: string;
    eventTime?: string;
    doctorName?: string;
    department?: string;
    departmentId?: string;
    doctorId?: string;
    appointmentStatus?: AppointmentStatus;
    appointmentId?: number;
  };
}

// Giao diện dữ liệu form cuộc hẹn
interface AppointmentFormData {
  slotStart: string;
  slotEnd: string;
  scheduleId: number;
  symptoms: string;
  doctorId: number;
  patientId: number;
}

// Hàm hỗ trợ
const calculateAge = (birthday: string): number => {
  if (!birthday) return 0;
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

const formatTimeToVietnamese = (time: string): string => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  return `${hours}:${minutes}`;
};

// Hàm format ngày để đảm bảo định dạng nhất quán
const formatDateForCalendar = (dateStr: string): string => {
  if (!dateStr) return "";
  // Đảm bảo định dạng YYYY-MM-DD
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const MedicalCalendar: React.FC = () => {
  const { t } = useTranslation();

  // Trạng thái form (đã đơn giản hóa)
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trạng thái modal
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [dayEvents, setDayEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );

  // Trạng thái dữ liệu
  const [departmentList, setDepartmentList] = useState<DepartmentFromAPI[]>([]);
  const [doctorsByDepartment, setDoctorsByDepartment] = useState<Doctor[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [availableSlots, setAvailableSlots] = useState<
    { slot_start: string; slot_end: string; available: boolean }[]
  >([]); // NEW: Trạng thái cho các slot có sẵn
  const [selectedSlot, setSelectedSlot] = useState<string>(""); // NEW: Trạng thái cho slot được chọn

  // Trạng thái cho khoa và bác sĩ đã chọn
  const [selectedDepartment, setSelectedDepartment] =
    useState<DepartmentFromAPI | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Các trường form
  const [symptoms, setSymptoms] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [doctorId, setDoctorId] = useState("");

  // Trạng thái tải
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Trạng thái lịch
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const calendarRef = useRef<FullCalendar>(null);

  // Modal
  const { isOpen, openModal, closeModal } = useModal();
  const {
    isOpen: isDayModalOpen,
    openModal: openDayModal,
    closeModal: closeDayModal,
  } = useModal();

  // Trạng thái Toast
  const [toastInfo, setToastInfo] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    type: "info",
  });

  // Tải dữ liệu ban đầu với patient data enrichment
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoadingDepartments(true);
        const departments = await departmentService.getAllDepartments();
        setDepartmentList(departments);
        setIsLoadingDepartments(false);

        if (departments.length > 0) {
          const firstDept = departments[0];
          if (typeof firstDept.id === "number" && !isNaN(firstDept.id)) {
            setDepartmentId(String(firstDept.id));
            setSelectedDepartment(firstDept);
          } else {
            console.warn(
              "Department ID của khoa đầu tiên không hợp lệ:",
              firstDept.id
            );
            setDepartmentId("");
            setSelectedDepartment(null);
          }
        }

        // 2. Tải doctors song song với patients
        const doctorPromise = (async () => {
          setIsLoadingDoctors(true);
          try {
            const doctors = await doctorService.getAllDoctors();
            const transformedDoctors: Doctor[] = doctors.map((doctor: any) => ({
              doctorId: doctor.id ?? "",
              department: doctor.department,
              departmentId: doctor.department?.id ?? "",
              departmentName: doctor.department?.department_name ?? "", // Ensure this is correctly mapped
              fullName:
                doctor.fullName ??
                `${doctor.first_name || ""} ${doctor.last_name || ""}`.trim(),
              userId: doctor.user?.id ?? 0,
              identityNumber: doctor.identity_number ?? "",
              birthday: doctor.birthday ?? "",
              gender:
                doctor.gender?.toUpperCase() === "M"
                  ? "MALE"
                  : doctor.gender?.toUpperCase() === "F"
                  ? "FEMALE"
                  : "OTHER",
              address: doctor.address ?? "",
              academicDegree: doctor.academic_degree ?? "BS",
              specialization: doctor.specialization ?? "",
              avatar: doctor.avatar,
              type: doctor.type ?? "EXAMINATION",
              createdAt: doctor.created_at ?? "",
            }));
            setAllDoctors(transformedDoctors);
          } catch (error) {
            console.error(t("errors.loadDoctors"), error);
            setAllDoctors([]);
            setToastInfo({
              open: true,
              message: `Lỗi khi tải tất cả bác sĩ: ${
                error instanceof Error ? error.message : "Lỗi không xác định"
              }`,
              type: "error",
            });
          } finally {
            setIsLoadingDoctors(false);
          }
        })();

        // 3. Tải patients
        const patientPromise = (async () => {
          setIsLoadingPatients(true);
          try {
            const patientsData = await patientService.getAllPatients();
            setPatients(patientsData);
          } catch (error) {
            console.error(t("errors.loadPatients"), error);
            setPatients([]);
            setToastInfo({
              open: true,
              message: `Lỗi khi tải bệnh nhân: ${
                error instanceof Error ? error.message : "Lỗi không xác định"
              }`,
              type: "error",
            });
          } finally {
            setIsLoadingPatients(false);
          }
        })();

        await Promise.all([doctorPromise, patientPromise]);

        setInitialDataLoaded(true);
      } catch (error) {
        console.error(t("errors.loadInitialData"), error);
        setToastInfo({
          open: true,
          message: `Lỗi khi tải dữ liệu ban đầu: ${
            error instanceof Error ? error.message : "Lỗi không xác định"
          }`,
          type: "error",
        });
        // Đảm bảo các loading state được reset
        setIsLoadingDepartments(false);
        setIsLoadingDoctors(false);
        setIsLoadingPatients(false);
      }
    };

    loadInitialData();
  }, []);

  // Tải bác sĩ khi khoa thay đổi với xử lý lỗi tốt hơn
  useEffect(() => {
    const fetchDoctorsByDepartment = async () => {
      const departmentIdNumber = parseInt(departmentId, 10);

      if (isNaN(departmentIdNumber) || departmentIdNumber === 0) {
        setDoctorsByDepartment([]);
        return;
      }

      setIsLoadingDoctors(true);
      try {
        const doctors = await departmentService.getDoctorsByDepartmentId(
          departmentIdNumber
        );

        const transformedDoctors: Doctor[] = Array.isArray(doctors)
          ? doctors.map((doctor: any) => ({
              doctorId: doctor.id ?? "",
              department: doctor.department,
              departmentId: doctor.department?.id ?? departmentIdNumber,
              fullName:
                doctor.fullName ??
                `${doctor.first_name || ""} ${doctor.last_name || ""}`.trim(),
              userId: doctor.user?.id ?? 0,
              identityNumber: doctor.identity_number ?? "",
              birthday: doctor.birthday ?? "",
              gender:
                doctor.gender?.toUpperCase() === "M"
                  ? "MALE"
                  : doctor.gender?.toUpperCase() === "F"
                  ? "FEMALE"
                  : "OTHER",
              address: doctor.address ?? "",
              academicDegree: doctor.academic_degree ?? "BS", // Changed from academicDegree to academic_degree
              specialization: doctor.specialization ?? "",
              avatar: doctor.avatar,
              type: doctor.type ?? "EXAMINATION",
              createdAt: doctor.created_at ?? "",
            }))
          : [];

        setDoctorsByDepartment(transformedDoctors);
      } catch (error) {
        console.error(t("errors.loadDoctorsByDepartment"), error);
        setDoctorsByDepartment([]);
        setToastInfo({
          open: true,
          message: `Lỗi khi tải danh sách bác sĩ: ${
            error instanceof Error ? error.message : "Lỗi không xác định"
          }`,
          type: "error",
        });
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    if (departmentId) {
      fetchDoctorsByDepartment();
    } else {
      setDoctorsByDepartment([]);
    }
  }, [departmentId]);

  // Lấy các cuộc hẹn với xử lý patient info được cải thiện
  const fetchAppointments = useCallback(async () => {
    if (!initialDataLoaded) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await appointmentService.getAllAppointments(0, 200);

      if (!response || !response.content || !Array.isArray(response.content)) {
        console.error(t("errors.invalidApiResponse"), response);
        setEvents([]);
        setToastInfo({
          open: true,
          message: "Lỗi khi tải danh sách cuộc hẹn",
          type: "error",
        });
        return;
      }

      const appointments = response.content;

      // Sắp xếp appointments theo ID để đảm bảo thứ tự nhất quán
      const sortedAppointments = appointments.sort((a, b) => {
        const idA = a.appointmentId || 0;
        const idB = b.appointmentId || 0;
        return idA - idB;
      });

      // Lọc các cuộc hẹn có trạng thái CANCELLED, NO_SHOW hoặc COMPLETED
      const filteredAppointments = sortedAppointments.filter((item) => {
        console.log(
          `Appointment ID: ${item.appointmentId}, Raw Status from API (for filter): '${item.appointmentStatus}'`
        );
        const status = item.appointmentStatus;
        return (
          status !== "X" && // CANCELLED
          status !== "N" && // NO_SHOW
          status !== "D"
        ); // COMPLETED
      });

      const apiEvents: CalendarEvent[] = filteredAppointments
        .map(
          (item: AppointmentResponse, index: number): CalendarEvent | null => {
            // Add this log to inspect the 'item' object
            console.log(`Mapping item:`, item);

            // Kiểm tra và validate dữ liệu cơ bản
            if (!item.appointmentId) {
              console.warn("Appointment thiếu ID, bỏ qua:", item);
              return null;
            }

            // Xử lý ngày với validation nghiêm ngặt hơn
            let eventDate = "";
            if (item.schedule?.workDate) {
              eventDate = formatDateForCalendar(item.schedule.workDate);
            } else {
              console.warn(
                `Appointment ${item.appointmentId} thiếu workDate, bỏ qua`
              );
              return null;
            }

            if (!eventDate) {
              console.warn(
                `Appointment ${item.appointmentId} có workDate không hợp lệ:`,
                item.schedule?.workDate
              );
              return null;
            }

            // Xử lý thời gian với validation
            const validateTimeFormat = (time: string | undefined): string => {
              if (!time) return "00:00:00";
              // Đảm bảo định dạng HH:mm:ss
              const parts = time.split(":");
              if (parts.length === 2) return `${time}:00`;
              if (parts.length === 3) return time;
              return "00:00:00";
            };

            const slotStart = validateTimeFormat(item.slotStart);
            const slotEnd = validateTimeFormat(item.slotEnd);

            // Tạo datetime string với timezone cục bộ
            const startDateTime = `${eventDate}T${slotStart}`;
            const endDateTime = `${eventDate}T${slotEnd}`;

            // Map trạng thái với giá trị mặc định - SỬ DỤNG CHUỖI TRỰC TIẾP
            const statusMap: Record<
              string,
              "success" | "waiting" | "cancel" | "upcoming" | "no-show"
            > = {
              P: "waiting", // PENDING
              C: "upcoming", // CONFIRMED
              I: "waiting", // IN_PROGRESS
              D: "success", // COMPLETED
              X: "cancel", // CANCELLED
              N: "no-show", // NO_SHOW
            };

            const appointmentStatusFromAPI = item.appointmentStatus;
            const calendarStatus =
              statusMap[appointmentStatusFromAPI] || "waiting";

            // Log giá trị sau khi ánh xạ để gỡ lỗi
            console.log(
              `Processing Appointment ID: ${item.appointmentId}, Raw Status: '${appointmentStatusFromAPI}', Mapped Calendar Status: '${calendarStatus}'`
            );

            // Xử lý thông tin bệnh nhân
            let patientFullName: string;
            let patientPhoneNumber: string = "";
            let patientInsuranceId: string = "";
            let patientAge: number | undefined;

            if (item.patientInfo?.fullName) {
              patientFullName = item.patientInfo.fullName;
            } else if (item.appointmentId) {
              patientFullName = `Bệnh nhân #${item.appointmentId}`;
            } else {
              patientFullName = "Bệnh nhân không xác định";
            }

            // Nếu không có đầy đủ thông tin từ API, tìm trong danh sách đã tải
            if (item.patientId) {
              const foundPatient = patients.find(
                (p) => p.patientId === item.patientId
              );
              if (foundPatient) {
                patientFullName = foundPatient.fullName || patientFullName;
                patientPhoneNumber = foundPatient.phone || patientPhoneNumber;
                patientInsuranceId =
                  foundPatient.insuranceNumber || patientInsuranceId;
                patientAge = foundPatient.age || patientAge;
              }
            }

            // Add this log to inspect patient info variables
            console.log(`Patient Info for ID ${item.appointmentId}:`, {
              patientFullName,
              patientPhoneNumber,
              patientInsuranceId,
              patientAge,
            });

            console.log("Current allDoctors:", allDoctors);
            console.log("Current departmentList:", departmentList);

            // Xử lý thông tin bác sĩ
            let doctorName: string =
              item.doctorInfo?.fullName || "Không xác định";
            if (doctorName === "Không xác định" && item.doctorId) {
              const foundDoctor = allDoctors.find(
                (doc) => String(doc.doctorId) === String(item.doctorId)
              );
              if (foundDoctor) {
                doctorName = foundDoctor.fullName;
              }
            }
            console.log(`Doctor Info for ID ${item.appointmentId}:`, {
              doctorName,
            });

            // Xử lý thông tin khoa - Ưu tiên lấy từ item.schedule.departmentName
            let departmentName: string = "Không xác định";
            if (item.schedule?.departmentName) {
              departmentName = item.schedule.departmentName;
              console.log(
                `Department Info for ID ${item.appointmentId} (from schedule.departmentName):`,
                { departmentName }
              );
            } else if (item.doctorInfo?.department?.department_name) {
              departmentName = item.doctorInfo.department.department_name;
              console.log(
                `Department Info for ID ${item.appointmentId} (from doctorInfo):`,
                { departmentName }
              );
            } else if (item.doctorId) {
              const foundDoctor = allDoctors.find(
                (doc) => String(doc.doctorId) === String(item.doctorId)
              );
              if (foundDoctor && foundDoctor.departmentName) {
                departmentName = foundDoctor.departmentName;
                console.log(
                  `Department Info for ID ${item.appointmentId} (from allDoctors):`,
                  { departmentName }
                );
              } else if (item.schedule?.departmentId) {
                const foundDepartmentInList = departmentList.find(
                  (dept) => dept.id === item.schedule?.departmentId
                );
                if (foundDepartmentInList) {
                  departmentName = foundDepartmentInList.department_name;
                  console.log(
                    `Department Info for ID ${item.appointmentId} (from departmentList):`,
                    { departmentName }
                  );
                }
              }
            }
            console.log(`Final Department Info for ID ${item.appointmentId}:`, {
              departmentName,
            });

            const patientId = item.patientId;

            const calendarEvent: CalendarEvent = {
              id: String(item.appointmentId),
              title: patientFullName,
              start: startDateTime,
              end: endDateTime,
              extendedProps: {
                calendar: calendarStatus,
                patientName: patientFullName,
                patientId: patientId,
                insuranceId: patientInsuranceId,
                phoneNumber: patientPhoneNumber,
                patientAge: patientAge,
                symptoms: item.symptoms || "",
                eventTime: slotStart,
                doctorName: doctorName,
                department: departmentName,
                departmentId: String(item.schedule?.departmentId || ""),
                doctorId: String(item.doctorId || ""),
                appointmentStatus: appointmentStatusFromAPI,
                appointmentId: item.appointmentId,
              },
            };

            return calendarEvent;
          }
        )
        .filter((event): event is CalendarEvent => event !== null);

      setEvents(apiEvents);
    } catch (error) {
      console.error(t("errors.loadAppointments"), error);
      setEvents([]);
      setToastInfo({
        open: true,
        message: `Lỗi khi tải danh sách cuộc hẹn: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
        }`,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [initialDataLoaded, departmentList, allDoctors, patients]);

  // Tải các cuộc hẹn chỉ sau khi dữ liệu ban đầu đã tải xong
  useEffect(() => {
    if (initialDataLoaded) {
      fetchAppointments();
    }
  }, [initialDataLoaded, fetchAppointments]);

  // Tải lịch làm việc cho bác sĩ và ngày đã chọn
  const loadSchedulesByDoctorAndDate = async (
    doctorId: string,
    date: string
  ) => {
    if (!doctorId || !date) {
      setSchedules([]);
      return;
    }

    setIsLoadingSchedules(true);
    try {
      const doctorIdNumber = parseInt(doctorId, 10);
      console.log("MedicalCalendar - Loading schedules for:", { doctorId, date });
      const response = await appointmentService.getSchedulesByDoctorAndDate(
        doctorIdNumber,
        date
      );

      // Check if response.data exists and is an array
      const rawSchedules = Array.isArray(response)
        ? response
        : response.data || [];

      const transformedSchedules: Schedule[] = rawSchedules.map(
        (schedule: any) => {
          const safeStartTime =
            typeof schedule.start_time === "string" ? schedule.start_time : "";
          const safeEndTime =
            typeof schedule.end_time === "string" ? schedule.end_time : "";

          return {
            id: schedule.scheduleId || schedule.id,
            doctorId: schedule.doctorId,
            workDate: schedule.workDate, // Đảm bảo sử dụng workDate
            startTime: safeStartTime.substring(0, 5),
            endTime: safeEndTime.substring(0, 5),
            maxPatients: schedule.maxPatients || 10,
            currentPatients: schedule.currentPatients || 0,
            status: schedule.status || "AVAILABLE",
            doctorName: schedule.doctorName || "",
            departmentId: schedule.departmentId || 0,
            departmentName: schedule.departmentName || "",
            defaultAppointmentDurationMinutes:
              schedule.defaultAppointmentDurationMinutes || 30,
          };
        }
      );

      setSchedules(transformedSchedules);
    } catch (error) {
      console.error("Lỗi khi tải lịch làm việc theo bác sĩ và ngày:", error);
      setSchedules([]);
      setToastInfo({
        open: true,
        message: `Lỗi khi tải lịch làm việc: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
        }`,
        type: "error",
      });
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  // Lấy các slot thời gian có sẵn
  const fetchAvailableSlots = useCallback(async (scheduleId: number) => {
    if (scheduleId) {
      try {
        const slots = await appointmentService.getAvailableTimeSlots(
          scheduleId
        );
        setAvailableSlots(slots);
        setSelectedSlot("");
      } catch (error) {
        console.error("Error fetching available slots:", error);
        setAvailableSlots([]);
        setToastInfo({
          open: true,
          message: `Lỗi khi tải các slot có sẵn: ${
            error instanceof Error ? error.message : "Lỗi không xác định"
          }`,
          type: "error",
        });
      }
    } else {
      setAvailableSlots([]);
      setSelectedSlot("");
    }
  }, []);

  // Xử lý sự kiện click với logging tốt hơn
  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const calendarEvent: CalendarEvent = {
      id: event.id,
      title: event.title,
      start: event.start?.toISOString() || "",
      end: event.end?.toISOString() || "",
      extendedProps: {
        calendar: event.extendedProps.calendar || "waiting",
        patientName: event.extendedProps.patientName || event.title || "",
        patientId:
          typeof event.extendedProps.patientId === "number"
            ? event.extendedProps.patientId
            : parseInt(event.extendedProps.patientId, 10) || 0,
        insuranceId: event.extendedProps.insuranceId || "",
        phoneNumber: event.extendedProps.phoneNumber || "",
        patientAge: event.extendedProps.patientAge,
        symptoms: event.extendedProps.symptoms || "",
        eventTime: event.extendedProps.eventTime || "",
        doctorName: event.extendedProps.doctorName || "",
        department: event.extendedProps.department || "",
        departmentId: String(event.extendedProps.departmentId || ""),
        doctorId: String(event.extendedProps.doctorId || ""),
        appointmentStatus:
          event.extendedProps.appointmentStatus || AppointmentStatus.PENDING,
        appointmentId: event.extendedProps.appointmentId,
      },
    };

    setSelectedEvent(calendarEvent);
    openModal();
  };

  // Xử lý sự kiện click ngày với logging
  const handleDateClick = (dateStr: string) => {
    const dateEvents = events.filter((event) => {
      const eventDate = formatDateForCalendar(event.start);
      const clickedDate = formatDateForCalendar(dateStr);
      const match = eventDate === clickedDate;
      return match;
    });

    setSelectedDate(dateStr);
    setDayEvents(dateEvents);
    openDayModal();
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    const selectedDateStr = formatDateForCalendar(selectInfo.startStr);
    setSelectedDate(selectedDateStr);
    openModal();
  };

  // Xử lý thay đổi khoa
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDeptId = String(e.target.value);
    setDepartmentId(selectedDeptId);

    const foundDepartment = departmentList.find(
      (dept) => String(dept.id) === selectedDeptId
    );
    setSelectedDepartment(foundDepartment || null);

    setDoctorId("");
    setSelectedDoctor(null);
    setSchedules([]);
    setSelectedSchedule(null);
    setAvailableSlots([]);
    setSelectedSlot("");

    if (errors.departmentId) {
      setErrors((prev) => ({ ...prev, departmentId: "" }));
    }
  };

  // Xử lý thay đổi bác sĩ
  const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDocId = String(e.target.value);
    setDoctorId(selectedDocId);

    const foundDoctor = doctorsByDepartment.find(
      (doc) => String(doc.doctorId) === selectedDocId
    );
    setSelectedDoctor(foundDoctor || null);

    setSchedules([]);
    setSelectedSchedule(null);
    setAvailableSlots([]);
    setSelectedSlot("");

    if (selectedDate && selectedDocId) {
      loadSchedulesByDoctorAndDate(selectedDocId, selectedDate);
    }

    if (errors.doctorId) {
      setErrors((prev) => ({ ...prev, doctorId: "" }));
    }
  };

  const handleDateChange: Hook = (dates) => {
    if (!dates.length) return;
    const dateStr = formatDateForCalendar(dates[0].toISOString());
    setSelectedDate(dateStr);

    setSchedules([]);
    setSelectedSchedule(null);
    setAvailableSlots([]);
    setSelectedSlot("");

    if (doctorId) {
      loadSchedulesByDoctorAndDate(doctorId, dateStr);
    }
  };

  const handleScheduleSelect = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setErrors((prev) => ({ ...prev, scheduleId: "" }));
    fetchAvailableSlots(schedule.id);
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const patientId = parseInt(e.target.value, 10);
    if (isNaN(patientId)) {
      setSelectedPatient(null);
      return;
    }
    const patient = patients.find((p) => p.patientId === patientId);
    setSelectedPatient(patient || null);
    setErrors((prev) => ({ ...prev, patientId: "" }));
  };

  const resetModalFields = () => {
    setSelectedDate("");
    setSchedules([]);
    setSelectedSchedule(null);
    setSelectedPatient(null);
    setSymptoms("");
    setDepartmentId("");
    setSelectedDepartment(null);
    setDoctorId("");
    setSelectedDoctor(null);
    setErrors({});
    setSelectedEvent(null);
    setAvailableSlots([]);
    setSelectedSlot("");
  };

  const handleCloseModal = () => {
    closeModal();
    resetModalFields();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!departmentId) {
      newErrors.departmentId = "Vui lòng chọn khoa";
    }

    if (!doctorId) {
      newErrors.doctorId = "Vui lòng chọn bác sĩ";
    }

    if (!selectedDate) {
      newErrors.date = "Vui lòng chọn ngày";
    }

    if (!selectedSchedule) {
      newErrors.scheduleId = "Vui lòng chọn ca làm việc";
    }

    if (!selectedPatient) {
      newErrors.patientId = "Vui lòng chọn bệnh nhân";
    }

    if (!selectedSlot) {
      newErrors.slot = "Vui lòng chọn giờ khám";
    }

    if (!symptoms.trim()) {
      newErrors.symptoms = "Vui lòng nhập triệu chứng";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAppointment = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (!selectedSchedule || !selectedPatient || !selectedSlot) {
        setToastInfo({
          open: true,
          message: "Vui lòng chọn đầy đủ thông tin lịch hẹn và bệnh nhân.",
          type: "error",
        });
        return;
      }

      const slotParts = selectedSlot.split("-");
      if (slotParts.length !== 2) {
        setToastInfo({
          open: true,
          message: "Format thời gian không hợp lệ. Vui lòng chọn lại slot.",
          type: "error",
        });
        return;
      }

      const [slotStart, slotEnd] = slotParts;

      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/;
      if (!timeRegex.test(slotStart) || !timeRegex.test(slotEnd)) {
        setToastInfo({
          open: true,
          message: "Format thời gian không đúng. Vui lòng chọn lại slot.",
          type: "error",
        });
        return;
      }

      const normalizeTime = (time: string) => {
        return time.split(":").length === 2 ? `${time}:00` : time;
      };

      const normalizedSlotStart = normalizeTime(slotStart);
      const normalizedSlotEnd = normalizeTime(slotEnd);

      const appointmentData: AppointmentRequest = {
        schedule: selectedSchedule.id,
        patient: selectedPatient.patientId,
        doctor: parseInt(doctorId, 10),
        symptoms: symptoms.trim(),
        slot_start: normalizedSlotStart,
        slot_end: normalizedSlotEnd,
        appointment_status: AppointmentStatus.PENDING,
      };

      // Validate all fields one more time
      const validationChecks = [
        {
          field: "scheduleId",
          value: appointmentData.schedule,
          check: (v: any) => typeof v === "number" && v > 0,
        },
        {
          field: "patientId",
          value: appointmentData.patient,
          check: (v: any) => typeof v === "number" && v > 0,
        },
        {
          field: "doctorId",
          value: appointmentData.doctor,
          check: (v: any) => typeof v === "number" && v > 0,
        },
        {
          field: "symptoms",
          value: appointmentData.symptoms,
          check: (v: any) => typeof v === "string" && v.length > 0,
        },
        {
          field: "slotStart",
          value: appointmentData.slot_start,
          check: (v: any) => typeof v === "string" && timeRegex.test(v),
        },
        {
          field: "slotEnd",
          value: appointmentData.slot_end,
          check: (v: any) => typeof v === "string" && timeRegex.test(v),
        },
      ];

      const failedValidations = validationChecks.filter(
        (check) => !check.check(check.value)
      );
      if (failedValidations.length > 0) {
        setToastInfo({
          open: true,
          message: `Dữ liệu không hợp lệ cho các trường: ${failedValidations
            .map((f) => f.field)
            .join(", ")}`,
          type: "error",
        });
        return;
      }

      // Call API with enhanced error handling
      await appointmentService.createAppointment(appointmentData);

      // Success handling
      closeModal();
      resetModalFields();
      setToastInfo({
        open: true,
        message: "Tạo cuộc hẹn thành công!",
        type: "success",
      });

      // Refresh appointments list
      await fetchAppointments();
    } catch (error: any) {
      console.error("Lỗi khi tạo cuộc hẹn:", error);

      // Enhanced error message handling
      let errorMessage = "Lỗi không xác định";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status) {
        switch (error.response.status) {
          case 400:
            errorMessage =
              "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.";
            break;
          case 401:
            errorMessage = "Bạn không có quyền thực hiện thao tác này.";
            break;
          case 409:
            errorMessage =
              "Slot thời gian này đã được đặt. Vui lòng chọn slot khác.";
            break;
          case 500:
            errorMessage = "Lỗi server. Vui lòng thử lại sau.";
            break;
          default:
            errorMessage = `Lỗi HTTP ${error.response.status}`;
        }
      }

      setToastInfo({
        open: true,
        message: `Lỗi khi tạo cuộc hẹn: ${errorMessage}`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppointmentStatusChange = async (
    appointmentId: number,
    newStatus: string
  ) => {
    try {
      setIsLoading(true);

      const updateData = {
        appointmentStatus: newStatus as AppointmentStatus,
      };

      await appointmentService.updateAppointment(appointmentId, updateData);

      // Log thông tin cập nhật trạng thái để gỡ lỗi
      console.log(
        `Updating appointment ${appointmentId} to status: ${newStatus}`
      );

      setEvents((prev) =>
        prev.map((event) => {
          if (event.id === appointmentId.toString()) {
            const statusMap: Record<
              string,
              "success" | "waiting" | "cancel" | "upcoming" | "no-show"
            > = {
              P: "waiting", // PENDING
              C: "upcoming", // CONFIRMED
              I: "waiting", // IN_PROGRESS
              D: "success", // COMPLETED
              X: "cancel", // CANCELLED
              N: "no-show", // NO_SHOW
            };

            const newCalendarStatus = statusMap[newStatus] || "waiting";
            // Log trạng thái mới sau khi ánh xạ để gỡ lỗi
            console.log(
              `Event ID: ${event.id}, Old Status: ${event.extendedProps.appointmentStatus}, New Status: ${newStatus}, Mapped Calendar Status: ${newCalendarStatus}`
            );

            return {
              ...event,
              extendedProps: {
                ...event.extendedProps,
                calendar: newCalendarStatus,
                appointmentStatus: newStatus as AppointmentStatus,
              },
            };
          }
          return event;
        })
      );

      if (selectedEvent && selectedEvent.id === appointmentId.toString()) {
        setSelectedEvent((prev) => {
          if (!prev) return null;

          return {
            ...prev,
            extendedProps: {
              ...prev.extendedProps,
              appointmentStatus: newStatus as AppointmentStatus,
            },
          };
        });
      }

      setToastInfo({
        open: true,
        message: "Cập nhật trạng thái thành công!",
        type: "success",
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái cuộc hẹn:", error);
      setToastInfo({
        open: true,
        message: `Lỗi khi cập nhật trạng thái: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
        }`,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    try {
      setIsLoading(true);
      await appointmentService.cancelAppointment(appointmentId);
      setToastInfo({
        open: true,
        message: "Cuộc hẹn đã được hủy thành công!",
        type: "success",
      });
      handleCloseModal();
      await fetchAppointments();
    } catch (error) {
      console.error("Lỗi khi hủy cuộc hẹn:", error);
      setToastInfo({
        open: true,
        message: `Lỗi khi hủy cuộc hẹn: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
        }`,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getGenderText = (gender: string): string => {
    switch (gender) {
      case "MALE":
        return "Nam";
      case "FEMALE":
        return "Nữ";
      case "OTHER":
        return "Khác";
      default:
        return "Không xác định";
    }
  };

  const renderEventContent = (eventInfo: {
    event: {
      title: string;
      start: Date | null;
      extendedProps: { calendar: string; eventTime?: string };
    };
    timeText: string;
  }) => {
    const { event } = eventInfo;
    const time = event.extendedProps.eventTime || eventInfo.timeText;

    let bgColor = "bg-gray-50";
    let textColor = "text-gray-800";
    let borderColor = "border-gray-500";
    let pillColor = "bg-gray-500 text-white";

    switch (event.extendedProps.calendar) {
      case "success":
        bgColor = "bg-green-50";
        textColor = "text-green-800";
        borderColor = "border-green-500";
        pillColor = "bg-green-500 text-white";
        break;
      case "cancel":
        bgColor = "bg-red-50";
        textColor = "text-red-800";
        borderColor = "border-red-500";
        pillColor = "bg-red-500 text-white";
        break;
      case "upcoming":
        bgColor = "bg-yellow-50";
        textColor = "text-yellow-800";
        borderColor = "border-yellow-500";
        pillColor = "bg-yellow-500 text-white";
        break;
      case "waiting":
        bgColor = "bg-blue-50";
        textColor = "text-blue-800";
        borderColor = "border-blue-500";
        pillColor = "bg-blue-500 text-white";
        break;
      case "no-show": 
        bgColor = "bg-red-50";
        textColor = "text-red-800";
        borderColor = "border-red-500";
        pillColor = "bg-red-500 text-white";
        break;
    }

    return (
      <div
        className={`flex flex-col p-1 rounded-md border-l-4 shadow-sm ${borderColor} ${bgColor}`}
      >
        <div className="flex items-center gap-1 justify-between">
          <span className={`text-sm font-medium truncate ${textColor}`}>
            {event.title}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${pillColor}`}>
            {event.extendedProps.calendar === "success"
              ? "Đã hoàn thành"
              : event.extendedProps.calendar === "cancel"
              ? "Hủy"
              : event.extendedProps.calendar === "upcoming"
              ? "Đã xác nhận"
              : event.extendedProps.calendar === "no-show"
              ? "Không đến"
              : event.extendedProps.calendar === "waiting"
              ? "Chờ xử lý"
              : "Chờ xử lý"}
          </span>
        </div>
        {time && (
          <div className="text-xs flex items-center gap-1 mt-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span className="text-gray-600">
              {formatTimeToVietnamese(time)}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Thành phần Toast
  const Toast = () => {
    useEffect(() => {
      if (toastInfo.open) {
        const timer = setTimeout(() => {
          setToastInfo((prev) => ({ ...prev, open: false }));
        }, 5000);

        return () => clearTimeout(timer);
      }
    }, [toastInfo.open]);

    if (!toastInfo.open) return null;

    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div
          className={`px-4 py-3 rounded-lg shadow-lg flex items-center ${
            toastInfo.type === "error"
              ? "bg-red-50 text-red-800 border-l-4 border-red-500"
              : toastInfo.type === "success"
              ? "bg-green-50 text-green-800 border-l-4 border-green-500"
              : toastInfo.type === "warning"
              ? "bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500"
              : "bg-blue-50 text-blue-800 border-l-4 border-blue-500"
          }`}
        >
          <div className="mr-3">
            {toastInfo.type === "error" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {toastInfo.type === "success" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div>
            <p className="font-medium">{toastInfo.message}</p>
          </div>
          <button
            onClick={() => setToastInfo((prev) => ({ ...prev, open: false }))}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Thanh công cụ lịch */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {t("dashboard.appointmentCalendar")}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={fetchAppointments}
              disabled={isLoading}
              className="flex items-center px-3 py-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("common.loading")}
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {t("buttons.refresh")}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="custom-calendar" style={{ position: "relative" }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={viLocale}
            fixedWeekCount={true}
            height="auto"
            contentHeight="auto"
            aspectRatio={1.8}
            dayMaxEventRows={0}
            stickyHeaderDates={true}
            headerToolbar={{
              left: "prev,next addEventButton",
              center: "title",
              right: "dayGridMonth",
            }}
            events={events}
            selectable={true}
            select={(selectInfo) => {
              const dateStr = formatDateForCalendar(selectInfo.startStr);
              const dateEvents = events.filter((event) => {
                const eventDate = formatDateForCalendar(event.start);
                return eventDate === dateStr;
              });

              if (dateEvents.length === 0) {
                handleDateSelect(selectInfo);
              }
            }}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            slotLabelFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            displayEventTime={true}
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5, 6],
              startTime: "06:30",
              endTime: "17:00",
            }}
            slotMinTime="06:00"
            slotMaxTime="18:00"
            dayMaxEvents={false}
            moreLinkClick={(info) => {
              handleDateClick(formatDateForCalendar(info.date.toISOString()));
            }}
            eventMaxStack={3}
            slotDuration="00:15:00"
            slotLabelInterval="01:00:00"
            timeZone="local"
            dayCellContent={(info) => {
              const cellDate = formatDateForCalendar(info.date.toISOString());
              const dayEvents = events.filter((event) => {
                const eventDate = formatDateForCalendar(event.start);
                return eventDate === cellDate;
              });

              const appointmentCount = dayEvents.length;

              return (
                <div
                  className={`h-full w-full relative cursor-pointer transition-colors duration-200 ${
                    appointmentCount === 0
                      ? "hover:bg-gray-50"
                      : appointmentCount <= 10
                      ? "bg-green-50 hover:bg-green-100"
                      : appointmentCount <= 50
                      ? "bg-yellow-50 hover:bg-yellow-100"
                      : appointmentCount <= 100
                      ? "bg-orange-50 hover:bg-orange-100"
                      : "bg-red-50 hover:bg-red-100"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();

                    if (appointmentCount > 0) {
                      handleDateClick(cellDate);
                    }
                  }}
                >
                  <div className="p-2">
                    <div className="font-medium text-gray-900">
                      {info.dayNumberText}
                    </div>
                    {appointmentCount > 0 && (
                      <div
                        className={`mt-1 text-xs font-semibold px-2 py-1 rounded-full text-center ${
                          appointmentCount <= 10
                            ? "bg-green-100 text-green-800"
                            : appointmentCount <= 50
                            ? "bg-yellow-100 text-yellow-800"
                            : appointmentCount <= 100
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {appointmentCount} {t("ui.appointments")}
                      </div>
                    )}
                  </div>
                </div>
              );
            }}
            customButtons={{
              addEventButton: {
                text: t("ui.addAppointment"),
                click: openModal,
              },
            }}
          />
        </div>

        {/* Modal cuộc hẹn chính */}
        <Modal
          isOpen={isOpen}
          onClose={handleCloseModal}
          className="max-w-[800px] lg:p-8 mt-[5vh] mb-8 overflow-y-auto custom-scrollbar max-h-[calc(95vh-4rem)]"
        >
          <div className="flex flex-col px-4">
            <div className="flex justify-between items-center mb-6">
              <h5 className="font-semibold text-gray-800 text-xl lg:text-2xl">
                {selectedEvent ? "Chi tiết cuộc hẹn" : "Tạo cuộc hẹn mới"}
              </h5>

              {selectedEvent?.extendedProps?.appointmentId && (
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">
                    {t("pastAppointments.status")}
                  </span>
                  <select
                    value={
                      selectedEvent.extendedProps.appointmentStatus ||
                      AppointmentStatus.PENDING
                    }
                    onChange={(e) => {
                      const newStatus = e.target.value as AppointmentStatus;
                      handleAppointmentStatusChange(
                        selectedEvent.extendedProps.appointmentId as number,
                        newStatus
                      );
                    }}
                    className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    aria-label={t("ui.statusLabel")}
                  >
                    <option value={AppointmentStatus.PENDING}>{t("stats.pending")}</option>
                    <option value={AppointmentStatus.CONFIRMED}>
                      {t("stats.confirmed")}
                    </option>
                    <option value={AppointmentStatus.IN_PROGRESS}>
                      {t("upcomingAppointments.inProgress")}
                    </option>
                    <option value={AppointmentStatus.COMPLETED}>
                      {t("dashboard.status.completed")}
                    </option>
                    <option value={AppointmentStatus.CANCELLED}>{t("stats.cancelled")}</option>
                    <option value={AppointmentStatus.NO_SHOW}>{t("upcomingAppointments.statusNoShow")}</option>
                  </select>
                </div>
              )}
            </div>

            {/* Hiển thị thông tin bệnh nhân với enriched data */}
            {selectedEvent && selectedEvent.extendedProps.patientName && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h6 className="font-semibold text-blue-800 mb-2">
                  {t("ui.patientInfo")}
                </h6>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">{t("ui.fullName")}</p>
                    <p className="font-medium">
                      {selectedEvent.extendedProps.patientName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t("ui.patientId")}</p>
                    <p className="font-medium">
                      {selectedEvent.extendedProps.patientId || "N/A"}
                    </p>
                  </div>
                  {selectedEvent.extendedProps.patientAge !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600">{t("ui.age")}</p>
                      <p className="font-medium">
                        {selectedEvent.extendedProps.patientAge}
                      </p>
                    </div>
                  )}
                  {/* REMOVED: Số điện thoại bệnh nhân */}
                  {selectedEvent.extendedProps.insuranceId && (
                    <div>
                      <p className="text-sm text-gray-600">{t("ui.healthInsurance")}</p>
                      <p className="font-medium">
                        {selectedEvent.extendedProps.insuranceId}
                      </p>
                    </div>
                  )}
                  {selectedEvent.extendedProps.symptoms && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">{t("ui.symptoms")}</p>
                      <p className="font-medium">
                        {selectedEvent.extendedProps.symptoms}
                      </p>
                    </div>
                  )}
                  {selectedEvent.extendedProps.doctorName && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">{t("ui.doctorLabel")}</p>
                      <p className="font-medium">
                        {selectedEvent.extendedProps.doctorName}
                      </p>
                    </div>
                  )}
                  {selectedEvent.extendedProps.department && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">{t("ui.department")}:</p>
                      <p className="font-medium">
                        {selectedEvent.extendedProps.department}
                      </p>
                    </div>
                  )}
                  {selectedEvent.extendedProps.eventTime && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">{t("ui.timeLabel")}</p>
                      <p className="font-medium">
                        {formatTimeToVietnamese(
                          selectedEvent.extendedProps.eventTime
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nút Hủy cuộc hẹn và Đóng cho chế độ xem chi tiết */}
            {selectedEvent && (
              <div className="flex justify-end gap-3 pt-2">
                {selectedEvent.extendedProps.appointmentStatus !==
                  AppointmentStatus.CANCELLED &&
                  selectedEvent.extendedProps.appointmentStatus !==
                    AppointmentStatus.COMPLETED &&
                  selectedEvent.extendedProps.appointmentStatus !==
                    AppointmentStatus.NO_SHOW && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCancelAppointment(
                          selectedEvent.extendedProps.appointmentId as number
                        )
                      }
                      className="px-6 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      {t("ui.cancelApm")}
                    </button>
                  )}
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  {t("ui.close")}
                </button>
              </div>
            )}

            {/* Form tạo cuộc hẹn mới với debugging và loading states */}
            {!selectedEvent && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateAppointment();
                }}
                className="space-y-6"
              >
                {/* Chọn lịch */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <h6 className="font-medium text-gray-700 mb-3">
                    {t("ui.selectSchedule")}
                  </h6>

                  <div className="grid grid-cols-3 gap-4">
                    {/* Chọn khoa */}
                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-700">
                        {t("ui.department")} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={departmentId}
                        onChange={handleDepartmentChange}
                        className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm"
                        disabled={isLoadingDepartments}
                      >
                        <option value="">
                          {isLoadingDepartments
                            ? t("ui.loadingDepartments") 
                            : t("ui.selectDepartment")}
                        </option>
                        {departmentList.map((dept) => (
                          <option key={dept.id} value={String(dept.id)}>
                            {dept.department_name}
                          </option>
                        ))}
                      </select>
                      {errors.departmentId && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.departmentId}
                        </p>
                      )}
                      {selectedDepartment && (
                        <p className="text-sm text-gray-600 mt-2">
                          {t("common.selected")}{" "}
                          <span className="font-medium text-gray-800">
                            {selectedDepartment.department_name}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Chọn bác sĩ - Sử dụng doctorsByDepartment với trạng thái loading */}
                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-700">
                        {t("ui.selectDoctor")} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={doctorId}
                        onChange={handleDoctorChange}
                        className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm"
                        disabled={!departmentId || isLoadingDoctors}
                      >
                        <option value="">
                          {isLoadingDoctors
                            ? t("ui.loadingDoctors")
                            : !departmentId
                            ? t("ui.chooseDepartmentFirst")
                            : doctorsByDepartment.length === 0
                            ? t("ui.noDoctors")
                            : t("ui.selectDoctor")}
                        </option>
                        {doctorsByDepartment.map((doctor) => (
                          <option
                            key={doctor.doctorId}
                            value={String(doctor.doctorId)}
                          >
                            {doctor.fullName}
                          </option>
                        ))}
                      </select>
                      {errors.doctorId && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.doctorId}
                        </p>
                      )}
                      {selectedDoctor && (
                        <p className="text-sm text-gray-600 mt-2">
                          {t("common.selected")}{" "}
                          <span className="font-medium text-gray-800">
                            {selectedDoctor.fullName}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Chọn ngày */}
                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-700">
                        {t("ui.appointmentDate")} <span className="text-red-500">*</span>
                      </label>
                      <DatePicker
                        id="appointment-date"
                        onChange={handleDateChange}
                        value={selectedDate || ""}
                        error={errors.date}
                        disabled={!doctorId} // Enabled only if a doctor is selected
                      />
                      {errors.date && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.date}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Chọn ca làm việc */}
                  {(isLoadingSchedules || schedules.length > 0) && (
                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-700">
                        {t("appointment.session")} <span className="text-red-500">*</span>
                      </label>

                      {isLoadingSchedules ? (
                        <div className="flex items-center justify-center py-8">
                          <svg
                            className="animate-spin h-6 w-6 text-blue-500"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span className="ml-2 text-gray-600">
                            {t("ui.loadingworkSchedule")}
                          </span>
                        </div>
                      ) : schedules.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>{t("ui.noWorkShifts")}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {schedules.map((schedule) => {
                            const isFull =
                              schedule.currentPatients >= schedule.maxPatients;
                            const cardClasses = `p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedSchedule?.id === schedule.id
                                ? "border-blue-500 bg-blue-50"
                                : isFull
                                ? "border-red-200 bg-red-50 cursor-not-allowed"
                                : "border-gray-200 hover:border-blue-300"
                            }`;
                            const pillClasses = `px-2 py-1 text-xs rounded ${
                              isFull
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`;
                            const pillText = isFull ? t("ui.full") : t("ui.bookable");

                            return (
                              <div
                                key={schedule.id}
                                onClick={() => handleScheduleSelect(schedule)}
                                className={cardClasses}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {schedule.startTime} - {schedule.endTime}
                                  </span>
                                  <span className={pillClasses}>
                                    {pillText}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {errors.scheduleId && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.scheduleId}
                        </p>
                      )}
                    </div>
                  )}

                  {/* NEW: Chọn giờ khám từ các slot có sẵn */}
                  {selectedSchedule &&
                    (isLoadingSchedules || availableSlots.length > 0) && (
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-700">
                          {t("ui.selectSlot")} <span className="text-red-500">*</span>
                        </label>
                        {isLoadingSchedules ? (
                          <div className="flex items-center justify-center py-4">
                            <svg
                              className="animate-spin h-5 w-5 text-blue-500"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            <span className="ml-2 text-gray-600">
                              {t("ui.loadingSlots")}
                            </span>
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            <p>{t("ui.noAvailableSlotsForShift")}</p>
                          </div>
                        ) : (
                          <select
                            value={selectedSlot}
                            onChange={(e) => setSelectedSlot(e.target.value)}
                            className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm"
                            disabled={
                              !selectedSchedule ||
                              availableSlots.filter((s) => s.available)
                                .length === 0
                            }
                          >
                            <option value="">{t("ui.selectSlot")}</option>
                            {availableSlots.map((slot, index) => (
                              <option
                                key={index}
                                value={`${slot.slot_start}-${slot.slot_end}`}
                                disabled={!slot.available}
                              >
                                {formatTimeToVietnamese(slot.slot_start)} -{" "}
                                {formatTimeToVietnamese(slot.slot_end)}{" "}
                                {slot.available ? "" : "(Đã đặt)"}
                              </option>
                            ))}
                          </select>
                        )}
                        {errors.slot && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.slot}
                          </p>
                        )}
                      </div>
                    )}
                </div>

                {/* Chọn bệnh nhân */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <h6 className="font-medium text-gray-700 mb-3">
                    {t("ui.patientInfo")}
                  </h6>

                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      {t("ui.selectPatient")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedPatient?.patientId || ""}
                      onChange={handlePatientChange}
                      className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm"
                      disabled={isLoadingPatients}
                      required
                    >
                      <option value="">
                        {isLoadingPatients
                          ? t("ui.loadingPatients")
                          : patients.length === 0
                          ? t("ui.noPatients")
                          : t("ui.selectPatient")}
                      </option>
                      {patients.map((patient) => (
                        <option
                          key={patient.patientId}
                          value={patient.patientId}
                        >
                          {patient.fullName} - {getGenderText(patient.gender)}
                        </option>
                      ))}
                    </select>
                    {errors.patientId && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.patientId}
                      </p>
                    )}
                  </div>

                  {/* Hiển thị chi tiết bệnh nhân đã chọn */}
                  {selectedPatient && (
                    <div className="mt-4 p-4 bg-white rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        {t("ui.patientDetails")}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">
                            {t("ui.fullName")}
                          </span>{" "}
                          <span className="text-gray-800">
                            {selectedPatient.fullName || t("ui.notUpdated")}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            {t("ui.age")}
                          </span>{" "}
                          <span className="text-gray-800">
                            {selectedPatient.age || t("ui.notUpdated")}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            {t("ui.gender")}
                          </span>{" "}
                          <span className="text-gray-800">
                            {getGenderText(selectedPatient.gender) ||
                              t("ui.notUpdated")}
                          </span>
                        </div>
                        {selectedPatient.insuranceNumber && (
                          <div className="col-span-2">
                            <span className="font-medium text-gray-600">
                              {t("ui.healthInsurance")}
                            </span>{" "}
                            <span className="text-gray-800">
                              {selectedPatient.insuranceNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Triệu chứng */}
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                        {t("ui.symptoms")} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder={t("ui.symptomsPlaceholder")}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm resize-none"
                      required
                    />
                    {errors.symptoms && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.symptoms}
                      </p>
                    )}
                  </div>
                </div>

                {/* Nút điều khiển */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !selectedSchedule ||
                      !selectedPatient ||
                      !selectedSlot
                    }
                    className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        {t("ui.creating")}
                      </span>
                    ) : (
                      t("ui.createApm")
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>

        {/* Modal các cuộc hẹn trong ngày */}
        <Modal
          isOpen={isDayModalOpen}
          onClose={closeDayModal}
          className="max-w-[700px] lg:p-8 lg:pb-6 mt-[10vh] mb-8 max-h-[80vh]"
        >
          <div className="flex flex-col px-4">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 text-xl lg:text-2xl">
                {t("ui.apmList")} {selectedDate}
              </h5>
              <p className="text-sm text-gray-600 mb-4">
                {t("ui.totalAppointments")}{" "}
                <span className="font-semibold text-blue-600">
                  {dayEvents.length} {t("ui.appointments")}
                </span>
              </p>
            </div>
            <div className="mt-4 overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
              {dayEvents.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-8">
                  {t("ui.noAppointmentsToday")}
                </p>
              ) : (
                <div className="space-y-3">
                  {dayEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className="p-4 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200"
                      onClick={() => {
                        setSelectedEvent(event);
                        closeDayModal();
                        openModal();
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500">
                            #{index + 1}
                          </span>

                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              event.extendedProps.calendar === "success"
                                ? "bg-green-100 text-green-800"
                                : event.extendedProps.calendar === "cancel"
                                ? "bg-red-100 text-red-800"
                                : event.extendedProps.calendar === "no-show"
                                ? "bg-red-100 text-red-800"
                                : event.extendedProps.calendar === "upcoming"
                                ? "bg-yellow-100 text-yellow-800"
                                : event.extendedProps.calendar === "waiting"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {event.extendedProps.calendar === "success"
                              ? t("stats.completed")
                              : event.extendedProps.calendar === "cancel"
                              ? t("status.cancelled")
                              : event.extendedProps.calendar === "no-show"
                              ? t("pastAppointments.noShow")
                              : event.extendedProps.calendar === "upcoming"
                              ? t("status.confirmed")
                              : t("status.pending")}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          {event.extendedProps.eventTime
                            ? formatTimeToVietnamese(
                                event.extendedProps.eventTime
                              )
                            : t("prescriptionDetail.notSpecified")}
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-base font-semibold text-gray-800 mb-1">
                          {event.title}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">{t("ui.patientId")}</span>{" "}
                            {event.extendedProps.patientId || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">{t("ui.doctorLabel")}</span>{" "}
                            {event.extendedProps.doctorName || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">{t("ui.department")}:</span>{" "}
                            {event.extendedProps.department || "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      </div>
      <Toast />
    </>
  );
};

export default MedicalCalendar;
