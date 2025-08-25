"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import type { ScheduleResponse } from "../../services/scheduleService"; // Import ScheduleResponse

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
    department: string; // This is building
    location: string; // This is roomNote
    type: "consultation" | "surgery" | "meeting" | "break";
    description?: string;
    colorClass?: string;
    roomId?: number; // Add roomId here
  };
}

// Function to format time to Vietnamese style
const formatTimeToVietnamese = (time: string): string => {
  if (!time) return "";

  const [hours, minutes] = time.split(":");
  const hourNum = Number.parseInt(hours, 10);
  const minuteNum = Number.parseInt(minutes, 10);

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

// Function to format calendar title with i18n
const formatCalendarTitle = (date: Date, t: any): string => {
  const monthKeys = [
    "doctors.schedule.months.january",
    "doctors.schedule.months.february",
    "doctors.schedule.months.march",
    "doctors.schedule.months.april",
    "doctors.schedule.months.may",
    "doctors.schedule.months.june",
    "doctors.schedule.months.july",
    "doctors.schedule.months.august",
    "doctors.schedule.months.september",
    "doctors.schedule.months.october",
    "doctors.schedule.months.november",
    "doctors.schedule.months.december",
  ];

  return `${t(monthKeys[date.getMonth()])} ${date.getFullYear()}`;
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
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  // Đảm bảo doctorId luôn là một số. Nếu id không hợp lệ, mặc định là 0.
  const doctorId = id ? Number(id) : 0;
  const loggedInDoctorId = Number(localStorage.getItem("doctorId"));
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
  const [newEvent, setNewEvent] = useState({
    date: "",
    startTime: "",
    endTime: "",
    calendar: "morning" as "morning" | "afternoon" | "surgery" | "meeting",
  });
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
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
  const [calendarInitialDate, setCalendarInitialDate] = useState<Date>(
    new Date()
  ); // New state for initialDate

  const [isEditMode, setIsEditMode] = useState(false);
  const [editEvent, setEditEvent] = useState({
    date: "",
    startTime: "",
    endTime: "",
    calendar: "morning" as "morning" | "afternoon" | "surgery" | "meeting",
  });

  const [errorModal, setErrorModal] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: "" });
  const [successModal, setSuccessModal] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Log events state whenever it changes
  useEffect(() => {
    console.log("Events state after update:", events);
  }, [events]);

  // Log initial doctorId and selectedRoomId
  useEffect(() => {
    console.log("INIT DEBUG: id from useParams:", id);
    console.log("INIT DEBUG: doctorId (parsed):", doctorId);
    console.log("INIT DEBUG: selectedRoomId (initial):", selectedRoomId);
    console.log("INIT DEBUG: rooms (initial):", rooms);
  }, [id, doctorId, selectedRoomId, rooms]);

  const shiftToCalendarType: Record<
    string,
    DoctorScheduleEvent["extendedProps"]["calendar"]
  > = {
    M: "morning",
    A: "afternoon",
    E: "surgery",
    N: "meeting",
  };

  const calendarTypeToShift: Record<
    DoctorScheduleEvent["extendedProps"]["calendar"],
    string
  > = {
    morning: "M",
    afternoon: "A",
    surgery: "E",
    meeting: "N",
  };

  const processScheduleToEvent = (
    sch: ScheduleResponse,
    index: number
  ): DoctorScheduleEvent | null => {
    console.log(`🔧 Processing schedule ${index + 1}:`, sch);

    const workDate = sch.work_date;
    const startTime = sch.start_time;
    const endTime = sch.end_time;

    if (!workDate || !startTime || !endTime) {
      console.error(
        `❌ Skipping schedule ${sch.id} due to missing date/time components: work_date=${workDate}, start_time=${startTime}, end_time=${endTime}`
      );
      return null;
    }

    const calendarType = shiftToCalendarType[sch.shift as string] || "morning";
    const eventType = "consultation";

    let colorClass = "fc-bg-success";
    let bgColor = "";
    let bColor = "";
    let titlePrefix = "";

    switch (calendarType) {
      case "morning":
        colorClass = "fc-bg-waiting";
        bgColor = "#F59E0B30"; // Orange-ish
        bColor = "#F59E0B30";
        titlePrefix = t("doctorSchedule.shifts.morning");
        break;
      case "afternoon":
        colorClass = "fc-bg-cancel";
        bgColor = "#10B98130"; // Green-ish
        bColor = "#10B98130";
        titlePrefix = t("doctorSchedule.shifts.afternoon");
        break;
      case "surgery":
        colorClass = "fc-bg-danger";
        bgColor = "#EF444430"; // Red-ish
        bColor = "#EF444430";
        titlePrefix = t("doctorSchedule.shifts.surgery");
        break;
      case "meeting":
        colorClass = "fc-bg-success";
        bgColor = "#3B82F630"; // Blue-ish
        bColor = "#3B82F630";
        titlePrefix = t("doctorSchedule.shifts.meeting");
        break;
      default:
        colorClass = "fc-bg-success"; // Default fallback
        bgColor = "#9CA3AF30"; // Gray-ish default
        bColor = "#9CA3AF30";
        titlePrefix = t("doctorSchedule.title");
        break;
    }

    const startDateTimeFull = `${workDate}T${startTime}`;
    const endDateTimeFull = `${workDate}T${endTime}`;

    console.log(
      `DEBUG: Constructed startDateTimeFull: ${startDateTimeFull}, endDateTimeFull: ${endDateTimeFull}`
    );

    const startDateObj = new Date(startDateTimeFull);
    const endDateObj = new Date(endDateTimeFull);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      console.error(
        `❌ Invalid Date object created for schedule ${sch.id}: start: '${startDateTimeFull}', end: '${endDateTimeFull}'. Skipping this event.`
      );
      return null;
    }

    const event: DoctorScheduleEvent = {
      id: String(sch.id),
      title: sch.title || titlePrefix,
      start: startDateObj.toISOString(),
      end: endDateObj.toISOString(),
      allDay: false,
      backgroundColor: bgColor,
      borderColor: bColor,
      className: `event-fc-color ${colorClass}`,
      extendedProps: {
        calendar: calendarType,
        startTime: startTime,
        endTime: endTime,
        department: sch.building || "",
        location: sch.room_note || "",
        type: eventType,
        description: "",
        colorClass: colorClass,
        roomId: sch.room_id,
      },
    };
    console.log(`✅ Successfully processed schedule ${sch.id}. Event:`, event);
    return event;
  };

  useEffect(() => {
    const fetchData = async () => {
      // Kiểm tra doctorId ngay từ đầu
      if (isNaN(doctorId) || doctorId === 0) {
        console.error("❌ Doctor ID is invalid or missing:", doctorId);
        setErrorModal({
          open: true,
          message: t("doctorSchedule.errors.invalidDoctorId"),
        });
        return;
      }

      try {
        console.log("Fetching data for doctorId:", doctorId);

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

        try {
          const examinationRooms = await doctorService.getAllExaminationRooms();

          const roomsData = examinationRooms.map((room) => ({
            roomId: room.roomId,
            note: room.note || `${t("doctorSchedule.room")} ${room.roomId}`,
            building: room.building || "N/A",
            floor: room.floor || 1,
            type: room.type,
          }));
          setRooms(roomsData);
          // Đảm bảo selectedRoomId được đặt nếu có phòng, mặc định là 1 nếu không có phòng
          setSelectedRoomId(roomsData.length > 0 ? roomsData[0].roomId : 1);
        } catch (error) {
          console.error(
            "❌ Error loading examination rooms from backend:",
            error
          );
        }

        const schedules = await scheduleService.getSchedulesByDoctorId(
          doctorId
        );
        console.log(
          "Raw schedules from API for doctorId",
          doctorId,
          ":",
          schedules
        );

        if (schedules.length === 0) {
          console.warn("No schedules found for doctor ID:", doctorId);
          setEvents([]);
          setCalendarInitialDate(new Date()); // Reset to current date if no schedules
          return;
        }

        const processedEvents = schedules
          .map(processScheduleToEvent)
          .filter(Boolean);

        console.log(
          "Final processed events before setting state:",
          processedEvents
        );
        setEvents(processedEvents);

        if (processedEvents.length > 0) {
          setCalendarInitialDate(new Date(processedEvents[0].start));
          console.log("✅ Calendar initial date set to first event's date.");
        } else {
          setCalendarInitialDate(new Date()); // Default to current date if no valid events
          console.log(
            "❌ No valid events found, setting calendar to current date."
          );
        }
      } catch (error) {
        console.error("Error fetching schedule data:", error);
        setCalendarInitialDate(new Date()); // Fallback to current date on error
      }
    };
    fetchData();
  }, [doctorId]);

  if (loggedInDoctorId && doctorId !== loggedInDoctorId) {
    return <Navigate to="/not-found" replace />;
  }

  const handleRoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRoomId(Number(e.target.value));
  };

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

    const eventData = {
      id: String(event.id || ""),
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

    setTimeout(() => {
      console.log("🔍 Modal state after click - isOpen:", isOpen);
      console.log("🔍 Selected event after click:", selectedEvent);
    }, 100);
  };

  const handleCloseModal = () => {
    closeModal();
    setSelectedEvent(null);
    setIsEditMode(false);
  };

  const handleStartEdit = () => {
    if (selectedEvent) {
      const dateOnly = selectedEvent.start.split("T")[0];
      setEditEvent({
        date: dateOnly,
        startTime: selectedEvent.extendedProps.startTime.substring(0, 5),
        endTime: selectedEvent.extendedProps.endTime.substring(0, 5),
        calendar: selectedEvent.extendedProps.calendar,
      });

      if (selectedEvent.extendedProps.roomId) {
        setSelectedRoomId(selectedEvent.extendedProps.roomId);
      } else {
        const currentRoom = rooms.find(
          (room) =>
            room.note === selectedEvent.extendedProps.location &&
            room.building === selectedEvent.extendedProps.department
        );
        setSelectedRoomId(currentRoom?.roomId || rooms[0]?.roomId || 1); // Mặc định là 1
      }
      setIsEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditEvent({
      date: "",
      startTime: "",
      endTime: "",
      calendar: "morning",
    });
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;

    const requiresRoom = editEvent.calendar !== "meeting";

    if (
      !editEvent.date ||
      !editEvent.startTime ||
      !editEvent.endTime ||
      (requiresRoom && !selectedRoomId)
    ) {
      const missingFields = [];
      if (!editEvent.date)
        missingFields.push(t("doctorSchedule.fieldLabels.date"));
      if (!editEvent.startTime)
        missingFields.push(t("doctorSchedule.fieldLabels.startTime"));
      if (!editEvent.endTime)
        missingFields.push(t("doctorSchedule.fieldLabels.endTime"));
      if (requiresRoom && !selectedRoomId)
        missingFields.push(t("doctorSchedule.fieldLabels.room"));

      setErrorModal({
        open: true,
        message: t("doctorSchedule.errors.missingFields", {
          fields: missingFields.join(", "),
        }),
      });
      return;
    }

    if (editEvent.startTime >= editEvent.endTime) {
      setErrorModal({
        open: true,
        message: t("doctorSchedule.errors.invalidTimeRange"),
      });
      return;
    }

    // Đảm bảo finalDoctorId là số hợp lệ
    const finalDoctorId = Number(doctorId);
    if (isNaN(finalDoctorId) || finalDoctorId === 0) {
      setErrorModal({
        open: true,
        message:
          "Không xác định được ID bác sĩ hợp lệ. Vui lòng tải lại trang hoặc kiểm tra URL.",
      });
      setIsSubmitting(false);
      return;
    }

    // Xác định room ID để gửi đi
    let roomToSend: number;
    if (editEvent.calendar === "meeting") {
      roomToSend = rooms[0]?.roomId ?? 1; // Mặc định là 1 nếu không có phòng
    } else {
      roomToSend = selectedRoomId ?? rooms[0]?.roomId ?? 1; // Mặc định là 1
    }

    // Đảm bảo roomToSend là số hợp lệ và không phải 0 (nếu 0 không hợp lệ)
    if (isNaN(roomToSend) || roomToSend === 0) {
      setErrorModal({
        open: true,
        message:
          "Không xác định được phòng hợp lệ. Vui lòng chọn phòng hoặc kiểm tra dữ liệu phòng.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        scheduleId: Number(selectedEvent.id),
        doctor: finalDoctorId, // Gửi dưới dạng số
        work_date: editEvent.date,
        start_time: editEvent.startTime + ":00",
        end_time: editEvent.endTime + ":00",
        shift: calendarTypeToShift[editEvent.calendar],
        room: roomToSend, // Gửi dưới dạng số
      };

      await scheduleService.updateSchedule(
        finalDoctorId,
        payload.scheduleId,
        payload
      );

      setSuccessModal({
        open: true,
        message: t("doctorSchedule.success.updateSuccess"),
      });

      const schedules = await scheduleService.getSchedulesByDoctorId(
        finalDoctorId
      );
      const events = schedules.map(processScheduleToEvent).filter(Boolean);
      setEvents(events); // Cập nhật lại sự kiện sau khi sửa

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
        message: t("doctorSchedule.errors.updateFailed"),
      });
      console.error("Error updating event:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEvent = async () => {
    const requiresRoom = newEvent.calendar !== "meeting";

    if (
      !newEvent.date ||
      !newEvent.startTime ||
      !newEvent.endTime ||
      (requiresRoom && !selectedRoomId)
    ) {
      const missingFields = [];
      if (!newEvent.date)
        missingFields.push(t("doctorSchedule.fieldLabels.date"));
      if (!newEvent.startTime)
        missingFields.push(t("doctorSchedule.fieldLabels.startTime"));
      if (!newEvent.endTime)
        missingFields.push(t("doctorSchedule.fieldLabels.endTime"));
      if (requiresRoom && !selectedRoomId)
        missingFields.push(t("doctorSchedule.fieldLabels.room"));

      setErrorModal({
        open: true,
        message: t("doctorSchedule.errors.missingFields", {
          fields: missingFields.join(", "),
        }),
      });
      return;
    }
    if (newEvent.startTime >= newEvent.endTime) {
      setErrorModal({
        open: true,
        message: t("doctorSchedule.errors.invalidTimeRange"),
      });
      return;
    }

    // Đảm bảo finalDoctorId là số hợp lệ
    const finalDoctorId = Number(doctorId);
    if (isNaN(finalDoctorId) || finalDoctorId === 0) {
      setErrorModal({
        open: true,
        message:
          "Không xác định được ID bác sĩ hợp lệ. Vui lòng tải lại trang hoặc kiểm tra URL.",
      });
      setIsSubmitting(false);
      return;
    }

    // Xác định room ID để gửi đi
    let roomToSend: number;
    if (newEvent.calendar === "meeting") {
      roomToSend = rooms[0]?.roomId ?? 1; // Mặc định là 1 nếu không có phòng
    } else {
      roomToSend = selectedRoomId ?? rooms[0]?.roomId ?? 1; // Mặc định là 1
    }

    // Đảm bảo roomToSend là số hợp lệ và không phải 0 (nếu 0 không hợp lệ)
    if (isNaN(roomToSend) || roomToSend === 0) {
      setErrorModal({
        open: true,
        message:
          "Không xác định được phòng hợp lệ. Vui lòng chọn phòng hoặc kiểm tra dữ liệu phòng.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      setIsSubmitting(true);

      console.log(
        "DEBUG: finalDoctorId before payload construction:",
        finalDoctorId
      );
      console.log(
        "DEBUG: selectedRoomId before payload construction:",
        selectedRoomId
      );
      console.log(
        "DEBUG: rooms array length before payload construction:",
        rooms.length
      );
      if (rooms.length > 0) {
        console.log(
          "DEBUG: rooms[0]?.roomId before payload construction:",
          rooms[0]?.roomId
        );
      }
      console.log("DEBUG: roomToSend calculated:", roomToSend);

      const payload = {
        doctor: finalDoctorId, // Gửi dưới dạng số
        work_date: newEvent.date,
        start_time: newEvent.startTime + ":00",
        end_time: newEvent.endTime + ":00",
        shift: calendarTypeToShift[newEvent.calendar], // Use the consistent mapping
        room: roomToSend, // Gửi dưới dạng số
      };
      console.log("Payload gửi lên BE:", payload);
      await scheduleService.createSchedule(payload);

      setSuccessModal({
        open: true,
        message: t("doctorSchedule.success.createSuccess"),
      });

      const schedules = await scheduleService.getSchedulesByDoctorId(
        finalDoctorId
      );
      const events = schedules.map(processScheduleToEvent).filter(Boolean); // Use the consistent processing function
      setEvents(events);
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
        message: t("doctorSchedule.errors.createFailed"),
      });
      console.error("Error adding event:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAddModal = () => {
    closeAddModal();
    setNewEvent({
      date: "",
      startTime: "",
      endTime: "",
      calendar: "morning",
    });
  };

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
    console.log(
      "Rendering event content for:",
      eventInfo.event.id,
      eventInfo.event.title
    );
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
        title={`${doctorData?.fullName || t("common.doctor")} | ${t(
          "doctorSchedule.title"
        )}`}
        description={`${t("doctorSchedule.title")} ${
          doctorData?.fullName || t("common.doctor")
        }${doctorData?.specialty ? ` - ${doctorData.specialty}` : ""}`}
      />
      <div className="flex justify-start items-center mb-6">
        <ReturnButton />
        <h3 className="font-semibold tracking-tight">
          {t("doctorSchedule.pageTitle", {
            doctorName: doctorData?.fullName || doctorId || "",
          })}
        </h3>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar doctor-schedule-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            initialDate={calendarInitialDate} // Use the new state variable here
            locale={viLocale}
            headerToolbar={{
              left: "prev,next today addScheduleButton",
              center: "title",
              right: "dayGridMonth",
            }}
            customButtons={{
              addScheduleButton: {
                text: t("doctorSchedule.addScheduleButton"),
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
              return formatCalendarTitle(info.date.marker, t);
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
              daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
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
                {t("doctorSchedule.scheduleDetails")}
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
                          {t("doctorSchedule.activity")}
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {selectedEvent.title}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("doctorSchedule.workDate")}
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
                            {t("doctorSchedule.startTime")}
                          </label>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            {formatTimeToVietnamese(
                              selectedEvent.extendedProps.startTime
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("doctorSchedule.endTime")}
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
                          {t("doctorSchedule.location")}
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {selectedEvent.extendedProps.location}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("doctorSchedule.department")}
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {selectedEvent.extendedProps.department}
                        </div>
                      </div>

                      {selectedEvent.extendedProps.description && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("doctorSchedule.description")}
                          </label>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            {selectedEvent.extendedProps.description}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("doctorSchedule.status")}
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
                              "morning" && t("doctorSchedule.shifts.morning")}
                            {selectedEvent.extendedProps.calendar ===
                              "afternoon" &&
                              t("doctorSchedule.shifts.afternoon")}
                            {selectedEvent.extendedProps.calendar ===
                              "surgery" && t("doctorSchedule.shifts.surgery")}
                            {selectedEvent.extendedProps.calendar ===
                              "meeting" && t("doctorSchedule.shifts.meeting")}
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
                        {t("doctorSchedule.edit")}
                      </button>
                      <button
                        onClick={handleCloseModal}
                        type="button"
                        className="btn btn-secondary flex justify-center rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-300"
                      >
                        {t("doctorSchedule.close")}
                      </button>
                    </div>
                  </>
                ) : (
                  // Edit Mode
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("doctorSchedule.date")}{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={editEvent.date}
                          onChange={(e) =>
                            setEditEvent({ ...editEvent, date: e.target.value })
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                          title={t("doctorSchedule.selectDate")}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("doctorSchedule.shiftType")}{" "}
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
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:focus:border-base-500 outline-0"
                          title={t("doctorSchedule.selectShiftType")}
                        >
                          <option value="morning">
                            {t("doctorSchedule.shifts.morning")}
                          </option>
                          <option value="afternoon">
                            {t("doctorSchedule.shifts.afternoon")}
                          </option>
                          <option value="surgery">
                            {t("doctorSchedule.shifts.surgery")}
                          </option>
                          <option value="meeting">
                            {t("doctorSchedule.shifts.meeting")}
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("doctorSchedule.startTime")}{" "}
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
                          title={t("doctorSchedule.selectStartTime")}
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
                          {t("doctorSchedule.endTime")}{" "}
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
                          title={t("doctorSchedule.selectEndTime")}
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
                          {t("doctorSchedule.room")}{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedRoomId ?? ""}
                          onChange={handleRoomChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                          disabled={rooms.length === 0}
                          title={t("doctorSchedule.selectRoom")}
                        >
                          <option value="">
                            {rooms.length === 0
                              ? t("doctorSchedule.noRoom")
                              : `${t("doctorSchedule.selectRoom")} (${
                                  rooms.length
                                } ${t("doctorSchedule.availableRooms")})`}
                          </option>
                          {rooms.map((room) => (
                            <option
                              key={room.roomId}
                              value={String(room.roomId)}
                            >
                              {t("doctorSchedule.room")} {room.roomId}
                              {room.note ? ` - ${room.note}` : ""}
                              {room.building ? ` - ${room.building}` : ""}
                              {room.floor
                                ? ` - ${t("doctorSchedule.floor")} ${
                                    room.floor
                                  }`
                                : ""}
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
                        {t("doctorSchedule.cancel")}
                      </button>
                      <button
                        onClick={handleUpdateEvent}
                        disabled={isSubmitting}
                        type="button"
                        className="px-4 py-2.5 text-sm font-medium text-white bg-base-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting
                          ? t("doctorSchedule.updating")
                          : t("doctorSchedule.update")}
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
                {t("doctorSchedule.addNewSchedule")}
              </h5>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("doctorSchedule.date")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, date: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                    title={t("doctorSchedule.selectDate")}
                    placeholder={t("doctorSchedule.selectDate")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("doctorSchedule.shiftType")}{" "}
                    <span className="text-red-500">*</span>
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
                    title={t("doctorSchedule.selectShiftType")}
                  >
                    <option value="morning">
                      {t("doctorSchedule.shifts.morning")}
                    </option>
                    <option value="afternoon">
                      {t("doctorSchedule.shifts.afternoon")}
                    </option>
                    <option value="surgery">
                      {t("doctorSchedule.shifts.surgery")}
                    </option>
                    <option value="meeting">
                      {t("doctorSchedule.shifts.meeting")}
                    </option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("doctorSchedule.startTime")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, startTime: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                    title={t("doctorSchedule.selectStartTime")}
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
                    {t("doctorSchedule.endTime")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, endTime: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                    title={t("doctorSchedule.selectEndTime")}
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
                      {t("doctorSchedule.room")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedRoomId ?? ""}
                      onChange={handleRoomChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-base-500/20 focus:border-base-500 outline-0"
                      disabled={rooms.length === 0}
                      title={t("doctorSchedule.selectRoom")}
                    >
                      <option value="">
                        {rooms.length === 0
                          ? t("doctorSchedule.noRoom")
                          : `${t("doctorSchedule.selectRoom")} (${
                              rooms.length
                            } ${t("doctorSchedule.availableRooms")})`}
                      </option>
                      {rooms.map((room) => {
                        console.log("🏥 Rendering room option:", room);
                        return (
                          <option key={room.roomId} value={String(room.roomId)}>
                            {t("doctorSchedule.room")} {room.roomId}
                            {room.note ? ` - ${room.note}` : ""}
                            {room.building ? ` - ${room.building}` : ""}
                            {room.floor
                              ? ` - ${t("doctorSchedule.floor")} ${room.floor}`
                              : ""}
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
                  {t("doctorSchedule.cancel")}
                </button>
                <button
                  onClick={handleAddEvent}
                  disabled={isSubmitting}
                  type="button"
                  className="px-4 py-2.5 text-sm font-medium text-white bg-base-600 rounded-lg hover:bg-base-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? t("doctorSchedule.adding")
                    : t("doctorSchedule.addSchedule")}
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
            <h4 className="text-lg font-semibold mb-2 text-red-600">
              {t("doctorSchedule.errors.error")}
            </h4>
            <p className="mb-4">{errorModal.message}</p>
            <button
              onClick={() => setErrorModal({ open: false, message: "" })}
              className="px-4 py-2 bg-base-600 text-white rounded-lg hover:bg-base-700"
            >
              {t("doctorSchedule.close")}
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
              {t("doctorSchedule.success.success")}
            </h4>
            <p className="mb-4">{successModal.message}</p>
            <button
              onClick={() => setSuccessModal({ open: false, message: "" })}
              className="px-4 py-2 bg-base-600 text-white rounded-lg hover:bg-base-700"
            >
              {t("doctorSchedule.close")}
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default DoctorSchedule;
