import { useState, useRef, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import viLocale from "@fullcalendar/core/locales/vi";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";

import PageMeta from "../../components/common/PageMeta";
import ReturnButton from "../../components/ui/button/ReturnButton";
import { Modal } from "../../components/ui/modal/index.tsx";
import { useModal } from "../../hooks/useModal.ts";
import { scheduleService } from "../../services/scheduleService";
import { doctorService } from "../../services/doctorService";

// Interface for schedule events - no more mock data dependency
interface DoctorScheduleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  className?: string;
  extendedProps: {
    calendar:
      | "morning"
      | "afternoon"
      | "surgery"
      | "meeting"
      | "working"
      | "free"
      | "break"
      | "vacation";
    startTime: string;
    endTime: string;
    department: string;
    location: string;
    type: "consultation" | "surgery" | "meeting" | "break";
    description?: string;
    colorClass?: string;
  };
}

// Function to format time to Vietnamese style
const formatTimeToVietnamese = (time: string): string => {
  if (!time) return "";

  const [hours, minutes] = time.split(":");
  const hourNum = parseInt(hours, 10);
  const minuteNum = parseInt(minutes, 10);

  return `${hourNum}:${minuteNum.toString().padStart(2, "0")}`;
};

// Function to format date to Vietnamese style (dd/mm/yyyy)
const formatDateToVietnamese = (dateString: string): string => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString();

  return `${day}/${month}/${year}`;
};

// Function to format calendar title in Vietnamese format
const formatCalendarTitle = (date: Date): string => {
  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

interface DoctorData {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  department: string;
  doctorId: string;
  accountType: string;
  position: string;
  specialty: string;
  address: string;
  country: string;
  city: string;
  postalCode: string;
  avatar: string;
}

const DoctorSchedule = () => {
  const { id } = useParams<{ id: string }>();
  const doctorId = id ? Number(id) : undefined;
  // Lấy doctorId của bác sĩ đang đăng nhập từ localStorage
  const loggedInDoctorId = Number(localStorage.getItem("doctorId"));
  // Nếu không phải lịch của chính mình thì redirect
  if (loggedInDoctorId && doctorId !== loggedInDoctorId) {
    return <Navigate to="/not-found" replace />;
  }
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const {
    isOpen: isAddModalOpen,
    openModal: openAddModal,
    closeModal: closeAddModal,
  } = useModal();
  const [events, setEvents] = useState<DoctorScheduleEvent[]>([]);
  const [selectedEvent, setSelectedEvent] =
    useState<DoctorScheduleEvent | null>(null);
  // Add new event form state
  const [newEvent, setNewEvent] = useState({
    date: "",
    startTime: "",
    endTime: "",
    calendar: "morning" as "morning" | "afternoon" | "surgery" | "meeting",
  });
  // Doctor info for display
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  // Danh sách phòng khám lấy trực tiếp từ database
  const [rooms, setRooms] = useState<
    {
      roomId: number;
      note: string;
      building: string;
      floor: number;
      type?: string;
    }[]
  >([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editEvent, setEditEvent] = useState({
    date: "",
    startTime: "",
    endTime: "",
    calendar: "morning" as "morning" | "afternoon" | "surgery" | "meeting",
  });

  // Load doctor info và danh sách phòng khám từ database
  useEffect(() => {
    const fetchData = async () => {
      if (!doctorId) return;
      try {
        console.log("Fetching data for doctorId:", doctorId);

        // Lấy thông tin bác sĩ (nếu cần hiển thị)
        try {
          if (typeof doctorService?.getDoctorById === "function") {
            const doctor = await doctorService.getDoctorById(doctorId);
            console.log("Doctor data:", doctor);
            setDoctorData({
              firstName: "",
              lastName: "",
              fullName: doctor.fullName || "",
              email: "",
              phone: "",
              gender: "",
              dateOfBirth: "",
              department: "",
              doctorId: doctor.doctorId?.toString() || "",
              accountType: "",
              position: "",
              specialty: "",
              address: "",
              country: "",
              city: "",
              postalCode: "",
              avatar: "",
            });
          }
        } catch (error) {
          console.log("Could not fetch doctor details:", error);
        }

        // Lấy danh sách phòng khám từ backend examination-room service
        try {
          const examinationRooms = await doctorService.getAllExaminationRooms();

          // Map ALL rooms to the format we need - ensure no data is lost
          const roomsData = examinationRooms.map((room) => ({
            roomId: room.roomId,
            note: room.note || `Phòng khám ${room.roomId}`, // Fallback if note is empty
            building: room.building || "N/A",
            floor: room.floor || 1,
            type: room.type,
          }));
          setRooms(roomsData);
          setSelectedRoomId(roomsData[0]?.roomId || null);
        } catch (error) {
          console.error(
            "❌ Error loading examination rooms from backend:",
            error
          );
        }

        // Lấy lịch làm việc từ API
        const schedules = await scheduleService.getSchedulesByDoctorId(
          doctorId
        );
        console.log(
          "Lịch làm việc trả về từ API cho doctorId",
          doctorId,
          ":",
          schedules
        );

        if (schedules.length === 0) {
          console.warn("No schedules found for doctor ID:", doctorId);
          setEvents([]);
          return;
        }

        // Lọc lại chỉ lấy lịch của đúng bác sĩ
        const filteredSchedules = schedules.filter(
          (sch) => (sch.doctor_id || sch.doctorId) === doctorId
        );
        const events = filteredSchedules
          .map((sch, index) => {
            console.log(`🔧 Processing schedule ${index + 1}:`, sch);

            // Map shift to calendar field properly
            const calendarType =
              sch.shift?.toLowerCase() === "morning"
                ? "morning"
                : sch.shift?.toLowerCase() === "afternoon"
                ? "afternoon"
                : "morning"; // default to morning

            const eventType = "consultation"; // default to consultation

            // Ensure proper date formatting for FullCalendar
            const startDateTime = `${sch.work_date || sch.workDate}T${
              sch.start_time || sch.startTime
            }`;
            const endDateTime = `${sch.work_date || sch.workDate}T${
              sch.end_time || sch.endTime
            }`;

            // Define color mapping based on schedule type
            let colorClass = "fc-bg-success";
            if (calendarType === "afternoon") {
              colorClass = "fc-bg-cancel";
            } else if (calendarType === "morning") {
              colorClass = "fc-bg-waiting";
            } else if (calendarType === "surgery") {
              colorClass = "fc-bg-danger";
            } else if (calendarType === "meeting") {
              colorClass = "fc-bg-success"; // Blue for meetings
            }

            const event = {
              id: (sch.scheduleId || sch.id).toString(),
              title:
                sch.title ||
                `${
                  calendarType === "morning"
                    ? "Ca sáng"
                    : calendarType === "afternoon"
                    ? "Ca chiều"
                    : calendarType === "surgery"
                    ? "Phẫu thuật"
                    : calendarType === "meeting"
                    ? "Hội chẩn"
                    : "Ca sáng"
                }`,
              start: startDateTime,
              end: endDateTime,
              allDay: false,
              className: `event-fc-color ${colorClass}`,
              extendedProps: {
                calendar: calendarType,
                startTime: sch.start_time || sch.startTime,
                endTime: sch.end_time || sch.endTime,
                department: sch.building || "",
                location: sch.room_note || sch.roomNote || "",
                type: eventType,
                description: "",
                colorClass: colorClass,
              },
            };

            // Validate the date
            const startDate = new Date(event.start);
            const endDate = new Date(event.end);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
              console.error(
                `❌ Invalid date detected for event ${index + 1}:`,
                event
              );
              return null;
            }

            return event;
          })
          .filter(Boolean);

        setEvents(events);

        // Navigate calendar to the first event's date if events exist
        if (events.length > 0) {
          const firstEventDate = new Date(events[0]!.start);

          // Use setTimeout to ensure calendar is fully rendered before navigation
          setTimeout(() => {
            if (calendarRef.current) {
              const calendarApi = calendarRef.current.getApi();
              calendarApi.gotoDate(firstEventDate);
              console.log("✅ Calendar navigation completed");

              // Force calendar to re-render events
              calendarApi.refetchEvents();
            }
          }, 100);
        } else {
          console.log("❌ No valid events found, staying on current date");
        }
      } catch (error) {
        console.error("Error fetching schedule data:", error);
      }
    };
    fetchData();
  }, [doctorId]);

  // Khi chọn phòng
  const handleRoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRoomId(Number(e.target.value));
  };

  // Handler khi click vào sự kiện
  const handleEventClick = (clickInfo: EventClickArg) => {
    console.log("🔍 Event clicked:", clickInfo.event);
    console.log("🔍 Modal state before click - isOpen:", isOpen);
    const event = clickInfo.event;
    console.log("📅 Event details:", {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      extendedProps: event.extendedProps,
    });

    // Ensure event is properly set
    const eventData = {
      id: event.id,
      title: event.title,
      start: event.start?.toISOString() || "",
      end: event.end?.toISOString() || "",
      allDay: event.allDay || false,
      extendedProps: event.extendedProps,
    } as DoctorScheduleEvent;

    console.log("📋 Setting selectedEvent to:", eventData);
    setSelectedEvent(eventData);

    console.log("🔓 Opening modal...");
    openModal();

    // Force a small delay to ensure state updates
    setTimeout(() => {
      console.log("🔍 Modal state after click - isOpen:", isOpen);
      console.log("🔍 Selected event after click:", selectedEvent);
    }, 100);
  };

  // Handle đóng modal
  const handleCloseModal = () => {
    closeModal();
    setSelectedEvent(null);
    setIsEditMode(false);
  };

  // Handle bắt đầu chỉnh sửa
  const handleStartEdit = () => {
    if (selectedEvent) {
      const dateOnly = selectedEvent.start.split("T")[0];
      setEditEvent({
        date: dateOnly,
        startTime: selectedEvent.extendedProps.startTime.substring(0, 5), // Remove seconds
        endTime: selectedEvent.extendedProps.endTime.substring(0, 5), // Remove seconds
        calendar: selectedEvent.extendedProps.calendar,
      });

      // Set selected room if not meeting type
      if (selectedEvent.extendedProps.calendar !== "meeting") {
        // Try to find room from location info
        const currentRoom = rooms.find(
          (room) =>
            selectedEvent.extendedProps.location.includes(
              room.roomId.toString()
            ) || selectedEvent.extendedProps.location.includes(room.note)
        );
        setSelectedRoomId(currentRoom?.roomId || rooms[0]?.roomId || null);
      }

      setIsEditMode(true);
    }
  };

  // Handle hủy chỉnh sửa
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditEvent({
      date: "",
      startTime: "",
      endTime: "",
      calendar: "morning",
    });
  };

  // Handle cập nhật lịch
  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;

    // Validation
    const requiresRoom = editEvent.calendar !== "meeting";

    if (
      !editEvent.date ||
      !editEvent.startTime ||
      !editEvent.endTime ||
      (requiresRoom && !selectedRoomId)
    ) {
      const missingFields = [];
      if (!editEvent.date) missingFields.push("ngày");
      if (!editEvent.startTime) missingFields.push("thời gian bắt đầu");
      if (!editEvent.endTime) missingFields.push("thời gian kết thúc");
      if (requiresRoom && !selectedRoomId) missingFields.push("phòng");

      setErrorModal({
        open: true,
        message: `Vui lòng điền đầy đủ thông tin: ${missingFields.join(", ")}!`,
      });
      return;
    }

    // Kiểm tra thời gian bắt đầu < kết thúc
    if (editEvent.startTime >= editEvent.endTime) {
      setErrorModal({
        open: true,
        message: "Thời gian bắt đầu phải trước thời gian kết thúc!",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      if (!doctorId) throw new Error("Không xác định được bác sĩ.");

      // Chuẩn bị dữ liệu gửi backend
      const payload = {
        scheduleId: Number(selectedEvent.id),
        doctorId,
        workDate: editEvent.date,
        startTime: editEvent.startTime + ":00",
        endTime: editEvent.endTime + ":00",
        shift:
          editEvent.calendar === "surgery" || editEvent.calendar === "meeting"
            ? "MORNING" // Default to MORNING for surgery and meeting
            : (editEvent.calendar.toUpperCase() as "MORNING" | "AFTERNOON"),
        roomId:
          editEvent.calendar === "meeting"
            ? rooms[0]?.roomId || 1 // Use default room for meeting
            : selectedRoomId || rooms[0]?.roomId || 1,
      };

      await scheduleService.updateSchedule(
        doctorId,
        payload.scheduleId,
        payload
      );

      // Show success message
      setSuccessModal({
        open: true,
        message: "Cập nhật lịch làm việc thành công!",
      });

      // Reload lại danh sách lịch
      const schedules = await scheduleService.getSchedulesByDoctorId(doctorId);
      const events = schedules.map((sch) => {
        const calendarType =
          sch.shift?.toLowerCase() === "morning"
            ? "morning"
            : sch.shift?.toLowerCase() === "afternoon"
            ? "afternoon"
            : "morning";

        const eventType = "consultation";

        let colorClass = "fc-bg-success";
        if (calendarType === "afternoon") {
          colorClass = "fc-bg-cancel";
        } else if (calendarType === "morning") {
          colorClass = "fc-bg-waiting";
        } else if (calendarType === "surgery") {
          colorClass = "fc-bg-danger";
        } else if (calendarType === "meeting") {
          colorClass = "fc-bg-success";
        }

        return {
          id: sch.scheduleId.toString(),
          title:
            sch.title ||
            `${
              calendarType === "morning"
                ? "Ca sáng"
                : calendarType === "afternoon"
                ? "Ca chiều"
                : calendarType === "surgery"
                ? "Phẫu thuật"
                : calendarType === "meeting"
                ? "Hội chẩn"
                : "Ca sáng"
            }`,
          start: `${sch.workDate}T${sch.startTime}`,
          end: `${sch.workDate}T${sch.endTime}`,
          allDay: false,
          className: `event-fc-color ${colorClass}`,
          extendedProps: {
            calendar: calendarType as
              | "morning"
              | "afternoon"
              | "surgery"
              | "meeting",
            startTime: sch.startTime,
            endTime: sch.endTime,
            department: sch.building || "",
            location: sch.roomNote || "",
            type: eventType as "consultation" | "surgery" | "meeting",
            description: "",
            colorClass: colorClass,
          },
        };
      });
      setEvents(events);

      // Reset edit mode và đóng modal
      setIsEditMode(false);
      setEditEvent({
        date: "",
        startTime: "",
        endTime: "",
        calendar: "morning",
      });
      closeModal();
      setSelectedEvent(null);
    } catch (err) {
      setErrorModal({
        open: true,
        message: "Cập nhật lịch làm việc thất bại. Vui lòng thử lại!",
      });
      console.error("Error updating event:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modal state for error and success
  const [errorModal, setErrorModal] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: "" });
  const [successModal, setSuccessModal] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle thêm lịch mới (gọi backend)
  const handleAddEvent = async () => {
    // Validation - Hội chẩn không cần chọn phòng
    const requiresRoom = newEvent.calendar !== "meeting";

    if (
      !newEvent.date ||
      !newEvent.startTime ||
      !newEvent.endTime ||
      (requiresRoom && !selectedRoomId)
    ) {
      const missingFields = [];
      if (!newEvent.date) missingFields.push("ngày");
      if (!newEvent.startTime) missingFields.push("thời gian bắt đầu");
      if (!newEvent.endTime) missingFields.push("thời gian kết thúc");
      if (requiresRoom && !selectedRoomId) missingFields.push("phòng");

      setErrorModal({
        open: true,
        message: `Vui lòng điền đầy đủ thông tin: ${missingFields.join(", ")}!`,
      });
      return;
    }
    // Kiểm tra thời gian bắt đầu < kết thúc
    if (newEvent.startTime >= newEvent.endTime) {
      setErrorModal({
        open: true,
        message: "Thời gian bắt đầu phải trước thời gian kết thúc!",
      });
      return;
    }
    try {
      setIsSubmitting(true);
      if (!doctorId) throw new Error("Không xác định được bác sĩ.");
      // Chuẩn bị dữ liệu gửi backend
      const payload = {
        doctorId,
        workDate: newEvent.date,
        startTime: newEvent.startTime + ":00",
        endTime: newEvent.endTime + ":00",
        shift:
          newEvent.calendar === "surgery" || newEvent.calendar === "meeting"
            ? "MORNING" // Default to MORNING for surgery and meeting
            : (newEvent.calendar.toUpperCase() as "MORNING" | "AFTERNOON"),
        roomId:
          newEvent.calendar === "meeting"
            ? rooms[0]?.roomId || 1 // Use default room for meeting
            : selectedRoomId || rooms[0]?.roomId || 1, // Ensure we always have a roomId
      };
      await scheduleService.createSchedule(payload);

      // Show success message
      setSuccessModal({
        open: true,
        message: "Thêm lịch làm việc thành công!",
      });

      // Sau khi tạo thành công, reload lại danh sách lịch
      const schedules = await scheduleService.getSchedulesByDoctorId(doctorId);
      const events = schedules.map((sch) => {
        // Map shift to calendar field properly
        const calendarType =
          sch.shift?.toLowerCase() === "morning"
            ? "morning"
            : sch.shift?.toLowerCase() === "afternoon"
            ? "afternoon"
            : "morning"; // default to morning

        const eventType = "consultation"; // default to consultation

        // Define color mapping based on schedule type
        let colorClass = "fc-bg-success"; // default green for working hours
        if (calendarType === "morning") {
          colorClass = "fc-bg-success"; // Green for morning shifts
        } else if (calendarType === "afternoon") {
          colorClass = "fc-bg-waiting"; // Yellow for afternoon shifts
        } else if (calendarType === "surgery") {
          colorClass = "fc-bg-danger"; // Red for surgery
        } else if (calendarType === "meeting") {
          colorClass = "fc-bg-success"; // Blue for meetings
        } else if (calendarType === "break" || calendarType === "vacation") {
          colorClass = "fc-bg-cancel"; // Gray for breaks/vacation
        }

        return {
          id: sch.scheduleId.toString(),
          title:
            sch.title ||
            `${
              calendarType === "morning"
                ? "Ca sáng"
                : calendarType === "afternoon"
                ? "Ca chiều"
                : calendarType === "surgery"
                ? "Phẫu thuật"
                : calendarType === "meeting"
                ? "Hội chẩn"
                : "Ca sáng"
            }`,
          start: `${sch.workDate}T${sch.startTime}`,
          end: `${sch.workDate}T${sch.endTime}`,
          allDay: false,
          backgroundColor:
            calendarType === "morning" ? "#F59E0B30" : "#10B98130",
          borderColor: calendarType === "morning" ? "#F59E0B30" : "#10B98130",
          className: `event-fc-color ${colorClass}`, // Apply color dot system
          extendedProps: {
            calendar: calendarType as
              | "morning"
              | "afternoon"
              | "surgery"
              | "meeting"
              | "free"
              | "break"
              | "vacation",
            startTime: sch.startTime,
            endTime: sch.endTime,
            department: sch.building || "",
            location: sch.roomNote || "",
            type: eventType as "consultation" | "surgery" | "meeting" | "break",
            description: "",
            colorClass: colorClass, // Store color class for reference
          },
        };
      });
      setEvents(events);
      // Reset form và đóng modal
      setNewEvent({
        date: "",
        startTime: "",
        endTime: "",
        calendar: "morning",
      });
      closeAddModal();
    } catch (err) {
      setErrorModal({
        open: true,
        message: "Tạo lịch làm việc thất bại. Vui lòng thử lại!",
      });
      console.error("Error adding event:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle đóng modal thêm lịch
  const handleCloseAddModal = () => {
    closeAddModal();
    setNewEvent({
      date: "",
      startTime: "",
      endTime: "",
      calendar: "morning",
    });
  };

  // Function to render event content using FullCalendar defaults with color dots
  const renderEventContent = (eventInfo: {
    event: {
      title: string;
      extendedProps: {
        calendar: string;
        type: string;
        startTime: string;
        endTime: string;
        location?: string;
        department?: string;
        colorClass?: string;
      };
    };
    timeText: string;
  }) => {
    // Use default FullCalendar rendering with simple time formatting
    const startTime = formatTimeToVietnamese(
      eventInfo.event.extendedProps.startTime
    );
    const endTime = formatTimeToVietnamese(
      eventInfo.event.extendedProps.endTime
    );
    const timeRange = `${startTime} - ${endTime}`;

    return (
      <div>
        <div className="fc-daygrid-event-dot"></div>
        <div className="fc-event-time">{timeRange}</div>
        <div className="fc-event-title">{eventInfo.event.title}</div>
      </div>
    );
  };

  return (
    <div>
      <PageMeta
        title={`${doctorData?.fullName || "Bác sĩ"} | Lịch làm việc Bác sĩ`}
        description={`Lịch làm việc của ${doctorData?.fullName || "Bác sĩ"}${
          doctorData?.specialty ? ` - ${doctorData.specialty}` : ""
        }`}
      />
      <div className="flex justify-start items-center mb-6">
        <ReturnButton />
        <h3 className="font-semibold tracking-tight">
          Lịch làm việc - Bác sĩ: {doctorData?.fullName || doctorId || ""}
        </h3>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar doctor-schedule-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            initialDate={new Date()}
            locale={viLocale}
            headerToolbar={{
              left: "prev,next today addScheduleButton",
              center: "title",
              right: "dayGridMonth",
            }}
            customButtons={{
              addScheduleButton: {
                text: "Thêm lịch làm việc +",
                click: openAddModal,
              },
            }}
            events={events}
            selectable={true}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            height="auto"
            slotMinTime="06:00:00"
            slotMaxTime="24:00:00"
            slotLabelFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            titleFormat={(info) => {
              return formatCalendarTitle(info.date.marker);
            }}
            dayHeaderFormat={{
              weekday: "short",
            }}
            showNonCurrentDates={true}
            fixedWeekCount={false}
            weekends={true}
            eventDisplay="block"
            dayMaxEvents={true}
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5, 6, 7], // Monday to Sunday
              startTime: "07:00",
              endTime: "24:00",
            }}
          />
        </div>

        {/* Modal chi tiết lịch làm việc */}
        <Modal
          isOpen={isOpen}
          onClose={handleCloseModal}
          className="max-w-[500px] lg:p-8 mt-[20vh] mb-8"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <div>
              <h5 className="mb-4 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-xl">
                Chi tiết lịch làm việc
              </h5>
            </div>

            {selectedEvent && (
              <div className="space-y-4">
                {!isEditMode ? (
                  // View Mode
                  <>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hoạt động
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {selectedEvent.title}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ngày làm việc
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {formatDateToVietnamese(
                            selectedEvent.start.split("T")[0]
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Thời gian bắt đầu
                          </label>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            {formatTimeToVietnamese(
                              selectedEvent.extendedProps.startTime
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Thời gian kết thúc
                          </label>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            {formatTimeToVietnamese(
                              selectedEvent.extendedProps.endTime
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Địa điểm
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {selectedEvent.extendedProps.location}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Khoa/Phòng ban
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {selectedEvent.extendedProps.department}
                        </div>
                      </div>

                      {selectedEvent.extendedProps.description && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mô tả
                          </label>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            {selectedEvent.extendedProps.description}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Trạng thái
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              selectedEvent.extendedProps.calendar === "morning"
                                ? "bg-teal-100 text-base-800"
                                : selectedEvent.extendedProps.calendar ===
                                  "afternoon"
                                ? "bg-purple-100 text-purple-800"
                                : selectedEvent.extendedProps.calendar ===
                                  "surgery"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {selectedEvent.extendedProps.calendar ===
                              "morning" && "Ca sáng"}
                            {selectedEvent.extendedProps.calendar ===
                              "afternoon" && "Ca chiều"}
                            {selectedEvent.extendedProps.calendar ===
                              "surgery" && "Phẫu thuật"}
                            {selectedEvent.extendedProps.calendar ===
                              "meeting" && "Hội chẩn"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={handleStartEdit}
                        type="button"
                        className="px-4 py-2.5 text-sm font-medium text-white bg-base-600 rounded-lg hover:bg-base-700"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={handleCloseModal}
                        type="button"
                        className="btn btn-secondary flex justify-center rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-300"
                      >
                        Đóng
                      </button>
                    </div>
                  </>
                ) : (
                  // Edit Mode
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ngày <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={editEvent.date}
                          onChange={(e) =>
                            setEditEvent({ ...editEvent, date: e.target.value })
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                          title="Chọn ngày làm việc"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Loại ca làm việc{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={editEvent.calendar}
                          onChange={(e) =>
                            setEditEvent({
                              ...editEvent,
                              calendar: e.target.value as
                                | "morning"
                                | "afternoon"
                                | "surgery"
                                | "meeting",
                            })
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                          title="Chọn loại ca làm việc"
                        >
                          <option value="morning">Ca sáng</option>
                          <option value="afternoon">Ca chiều</option>
                          <option value="surgery">Phẫu thuật</option>
                          <option value="meeting">Hội chẩn</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Thời gian bắt đầu{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={editEvent.startTime}
                          onChange={(e) =>
                            setEditEvent({
                              ...editEvent,
                              startTime: e.target.value,
                            })
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                          title="Chọn thời gian bắt đầu (định dạng 24h)"
                          step="900"
                          min="00:00"
                          max="23:59"
                          data-format="24h"
                          lang="en-GB"
                          pattern="[0-9]{2}:[0-9]{2}"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Thời gian kết thúc{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={editEvent.endTime}
                          onChange={(e) =>
                            setEditEvent({
                              ...editEvent,
                              endTime: e.target.value,
                            })
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                          title="Chọn thời gian kết thúc (định dạng 24h)"
                          step="900"
                          min="00:00"
                          max="23:59"
                          data-format="24h"
                        />
                      </div>
                    </div>

                    {/* Conditional room selection - only show for non-meeting types */}
                    {editEvent.calendar !== "meeting" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phòng <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedRoomId ?? ""}
                          onChange={handleRoomChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                          disabled={rooms.length === 0}
                          title="Chọn phòng"
                        >
                          <option value="">
                            {rooms.length === 0
                              ? "Không có phòng"
                              : `Chọn phòng (${rooms.length} phòng có sẵn)`}
                          </option>
                          {rooms.map((room) => (
                            <option key={room.roomId} value={room.roomId}>
                              Phòng {room.roomId}
                              {room.note ? ` - ${room.note}` : ""}
                              {room.building ? ` - ${room.building}` : ""}
                              {room.floor ? ` - Tầng ${room.floor}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={handleCancelEdit}
                        type="button"
                        className="px-4 py-2.5 text-sm font-medium text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleUpdateEvent}
                        disabled={isSubmitting}
                        type="button"
                        className="px-4 py-2.5 text-sm font-medium text-white bg-base-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </Modal>

        {/* Modal thêm lịch làm việc mới */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={handleCloseAddModal}
          className="max-w-[600px] lg:p-8 mt-[10vh] mb-8"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <div>
              <h5 className="mb-4 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                Thêm lịch làm việc mới
              </h5>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, date: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                    title="Chọn ngày làm việc"
                    placeholder="Chọn ngày"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại ca làm việc <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newEvent.calendar}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        calendar: e.target.value as
                          | "morning"
                          | "afternoon"
                          | "surgery"
                          | "meeting",
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                    title="Chọn loại ca làm việc"
                  >
                    <option value="morning">Ca sáng</option>
                    <option value="afternoon">Ca chiều</option>
                    <option value="surgery">Phẫu thuật</option>
                    <option value="meeting">Hội chẩn</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, startTime: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                    title="Chọn thời gian bắt đầu (định dạng 24h)"
                    step="900"
                    min="00:00"
                    max="23:59"
                    data-format="24h"
                    lang="en-GB"
                    pattern="[0-9]{2}:[0-9]{2}"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, endTime: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                    title="Chọn thời gian kết thúc (định dạng 24h)"
                    step="900"
                    min="00:00"
                    max="23:59"
                    data-format="24h"
                  />
                </div>
              </div>
              {/* Conditional room selection - only show for non-meeting types */}
              {newEvent.calendar !== "meeting" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phòng <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedRoomId ?? ""}
                      onChange={handleRoomChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                      disabled={rooms.length === 0}
                      title="Chọn phòng"
                    >
                      <option value="">
                        {rooms.length === 0
                          ? "Không có phòng"
                          : `Chọn phòng (${rooms.length} phòng có sẵn)`}
                      </option>
                      {rooms.map((room) => {
                        console.log("🏥 Rendering room option:", room);
                        return (
                          <option key={room.roomId} value={room.roomId}>
                            Phòng {room.roomId}
                            {room.note ? ` - ${room.note}` : ""}
                            {room.building ? ` - ${room.building}` : ""}
                            {room.floor ? ` - Tầng ${room.floor}` : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleCloseAddModal}
                  type="button"
                  className="px-4 py-2.5 text-sm font-medium text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddEvent}
                  disabled={isSubmitting}
                  type="button"
                  className="px-4 py-2.5 text-sm font-medium text-white bg-base-600 rounded-lg hover:bg-base-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Đang thêm..." : "Thêm lịch"}
                </button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Modal báo lỗi nhập thiếu hoặc lỗi backend */}
        <Modal
          isOpen={errorModal.open}
          onClose={() => setErrorModal({ open: false, message: "" })}
          className="max-w-[400px]"
        >
          <div className="p-6">
            <h4 className="text-lg font-semibold mb-2 text-red-600">Lỗi</h4>
            <p className="mb-4">{errorModal.message}</p>
            <button
              onClick={() => setErrorModal({ open: false, message: "" })}
              className="px-4 py-2 bg-base-600 text-white rounded-lg hover:bg-base-700"
            >
              Đóng
            </button>
          </div>
        </Modal>

        {/* Modal thông báo thành công */}
        <Modal
          isOpen={successModal.open}
          onClose={() => setSuccessModal({ open: false, message: "" })}
          className="max-w-[400px]"
        >
          <div className="p-6">
            <h4 className="text-lg font-semibold mb-2 text-base-600">
              Thành công
            </h4>
            <p className="mb-4">{successModal.message}</p>
            <button
              onClick={() => setSuccessModal({ open: false, message: "" })}
              className="px-4 py-2 bg-base-600 text-white rounded-lg hover:bg-base-700"
            >
              Đóng
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default DoctorSchedule;
