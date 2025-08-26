"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Table, Input, Button, Avatar, Space, Card, Select, Tooltip, Empty, DatePicker, message, Spin } from "antd"
import {
    EditOutlined,
    SearchOutlined,
    FilterOutlined,
    UserOutlined,
    CalendarOutlined,
    ReloadOutlined,
    ClearOutlined,
} from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import type { ServiceOrder } from "../../types/serviceOrder"
import { api } from "../../../../shared/services/api"
import { getServiceOrdersByRoomId } from "../../services/serviceOrderService"
import { appointmentService } from "../../services/appointmentService"
import { servicesService } from "../../services/servicesService"
import { paymentService } from "../../services/paymentService"
import type { Bill } from "../../types/payment"
import dayjs from "dayjs"
import type { Dayjs } from "dayjs"
import { useTranslation } from "react-i18next"

const { Search } = Input
const { Option } = Select

interface WorkSchedule {
    id: number;
    doctor_id: number;
    work_date: string;
    start_time: string;
    end_time: string;
    shift: string;
    room: number | { id: number };
}

const ServicePatients: React.FC = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const doctorId = localStorage.getItem("currentDoctorId")

    // States
    const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
    const [appointmentsData, setAppointmentsData] = useState<{ [key: number]: any }>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([])
    const [scheduleLoading, setScheduleLoading] = useState(false)
    const [selectedDate, setSelectedDate] = useState<string | null>(dayjs().format("YYYY-MM-DD"))
    const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>(undefined)
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState("")

    // Fetch work schedules
    const fetchWorkSchedules = useCallback(async () => {
        if (!doctorId) {
            message.error("No doctor ID found.");
            return;
        }

        setScheduleLoading(true);
        try {
            const response = await api.get(`/schedules/?doctor_id=${doctorId}`);
            const schedules = response.data || [];
            setWorkSchedules(schedules);

            if (selectedDate && !selectedRoomId && schedules.length > 0) {
                const dateSchedule = schedules.find((schedule: WorkSchedule) => schedule.work_date === selectedDate);
                if (dateSchedule) {
                    const roomId = typeof dateSchedule.room_id === "number" ? dateSchedule.room_id : dateSchedule.room_id?.id;
                    setSelectedRoomId(roomId);
                } else {
                    console.error("No schedule found for date:", selectedDate);
                }
            }
        } catch (error: any) {
            console.error("Error in fetchWorkSchedules:", error.response?.data || error.message);
            message.error(error.response?.data?.message || "Unable to load work schedules");
            setWorkSchedules([]);
        } finally {
            setScheduleLoading(false);
        }
    }, [doctorId, selectedDate, selectedRoomId]);

    const fetchServiceOrders = useCallback(async () => {
        if (!selectedRoomId) {
            setServiceOrders([]);
            setAppointmentsData({});
            console.error("No selectedRoomId, skipping fetchServiceOrders");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await getServiceOrdersByRoomId(
                selectedRoomId,
                statusFilter !== "all" ? statusFilter : undefined,
                selectedDate || undefined,
            );

            const orders = Array.isArray(data) ? data : [];
            if (orders.length === 0) {
                console.error("No service orders found for the given filters");
                setServiceOrders([]);
                setAppointmentsData({});
                return;
            }

            const servicesData = await servicesService.getAllServices();

            const serviceMap = new Map();
            if (Array.isArray(servicesData)) {
                servicesData.forEach((service) => {
                    serviceMap.set(service.service_id, service.service_name);
                });
            } else {
                console.warn("servicesData is not an array:", servicesData);
            }

            const enrichedOrders = orders.map((order) => ({
                orderId: order.id || order.order_id,
                appointmentId: order.appointment_id,
                roomId: order.room_id,
                serviceId: order.service_id,
                serviceName: serviceMap.get(order.service_id),
                orderStatus: order.status || order.order_status,
                result: order.result,
                number: order.number,
                orderTime: order.order_time,
            }));


            // Fetch appointment and bill for each order
            const appointmentPromises = enrichedOrders.map(async (order) => {
                try {
                    const appointment = await appointmentService.getAppointmentById(order.appointmentId);
                    // Fetch bill for this appointment
                    const bill = await paymentService.getBillByAppointmentId(order.appointmentId);
                    return { appointmentId: order.appointmentId, appointment, bill };
                } catch (error) {
                    console.error(`Error fetching appointment or bill for ${order.appointmentId}:`, error);
                    return { appointmentId: order.appointmentId, appointment: null, bill: null };
                }
            });

            const appointmentResults = await Promise.all(appointmentPromises);
            // Only keep orders with PAID bill status
            const paidAppointmentIds = new Set(
                appointmentResults
                    .filter(result => result.bill && result.bill.status === 'P')
                    .map(result => result.appointmentId)
            );
            const filteredOrders = enrichedOrders.filter(order => paidAppointmentIds.has(order.appointmentId));
            const appointmentsMap = appointmentResults.reduce(
                (acc, result) => {
                    if (result.appointment) {
                        acc[result.appointmentId] = result.appointment;
                    }
                    return acc;
                },
                {} as { [key: number]: any },
            );

            setServiceOrders(filteredOrders);
            setAppointmentsData(appointmentsMap);
        } catch (err: any) {
            console.error("Error in fetchServiceOrders:", err.response?.data || err.message);
            setError(t("errors.fetchServiceOrders"));
            message.error(err.response?.data?.message || t("errors.fetchServiceOrders"));
            setServiceOrders([]);
            setAppointmentsData({});
        } finally {
            setLoading(false);
        }
    }, [selectedRoomId, statusFilter, selectedDate, t]);

    useEffect(() => {
        fetchWorkSchedules()
    }, [fetchWorkSchedules])

    useEffect(() => {
        if (selectedRoomId) {
            fetchServiceOrders()
        }
    }, [selectedRoomId, statusFilter, selectedDate, fetchServiceOrders])

    // Build room filter options with room.note
    const getRoomsForSelectedDate = useMemo(() => {
        if (!selectedDate || !Array.isArray(workSchedules)) return [];
        // Find all schedules for the selected date
        const roomsToday = workSchedules
            .filter((schedule) => schedule.work_date === selectedDate)
            .map((schedule) => {
                // Use room_id and room_note directly if present
                const roomId = (schedule as any).room_id ?? (typeof schedule.room === "object" && schedule.room !== null ? (schedule.room as any).id : schedule.room);
                const roomNote = (schedule as any).room_note ?? (typeof schedule.room === "object" && schedule.room !== null ? (schedule.room as any).note : undefined);
                return { roomId, roomNote };
            });
        // Remove duplicate roomId
        const uniqueRooms = roomsToday.filter((room, idx, arr) =>
            room.roomId !== undefined && arr.findIndex(r => r.roomId === room.roomId) === idx
        );
        return uniqueRooms.map(room => ({
            roomId: room.roomId,
            displayName: room.roomNote ? `${room.roomNote}` : `${t("table.room")} ${room.roomId}`,
        }));
    }, [selectedDate, workSchedules, t]);

    // Filter and search logic similar to Patient.tsx
    const filteredServiceOrders = useMemo(() => {
        if (!Array.isArray(serviceOrders)) return [];
        let filtered = serviceOrders;

        // Filter by status
        if (statusFilter && statusFilter !== "all") {
            filtered = filtered.filter(order => order.orderStatus === statusFilter);
        }

        // Search by patient name, phone, id, service name, orderId
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(order => {
                const appointment = appointmentsData[order.appointmentId];
                const patientInfo = appointment?.patientInfo;
                return (
                    order.serviceName?.toLowerCase().includes(searchLower) ||
                    order.orderId?.toString().includes(searchLower) ||
                    patientInfo?.first_name?.toLowerCase().includes(searchLower) ||
                    patientInfo?.last_name?.toLowerCase().includes(searchLower) ||
                    patientInfo?.phoneNumber?.includes(searchLower) ||
                    patientInfo?.id?.toString().includes(searchLower)
                );
            });
        }
        return filtered;
    }, [serviceOrders, searchTerm, statusFilter, appointmentsData]);

    const stats = useMemo(() => {
        const orders = Array.isArray(filteredServiceOrders) ? filteredServiceOrders : []
        return {
            total: orders.length,
            ordered: orders.filter((order) => order.orderStatus === "O").length,
            completed: orders.filter((order) => order.orderStatus === "C").length,
        }
    }, [filteredServiceOrders])

    const handleDateChange = (date: Dayjs | null) => {
        const dateStr = date ? date.format("YYYY-MM-DD") : null
        setSelectedDate(dateStr)
        setSelectedRoomId(undefined)
    }

    const handleStatusChange = (value: string) => {
        setStatusFilter(value)
    }

    const handleClearFilters = () => {
        setSelectedDate(dayjs().format("YYYY-MM-DD"))
        setSelectedRoomId(undefined)
        setStatusFilter("all")
        setSearchTerm("")
    }

    const handleRefresh = () => {
        fetchWorkSchedules()
        if (selectedRoomId) {
            fetchServiceOrders()
        }
    }

    const handleViewServiceOrder = (record: ServiceOrder) => {
        const appointment = appointmentsData[record.appointmentId]
        navigate(`/doctor/service/patient/detail/${record.orderId}`, {
            state: {
                roomId: record.roomId,
                appointmentData: appointment,
                serviceOrder: record,
            },
        })
    }

    // Sort appointments by status
    const statusOrder = ["O", "C"]
    const sortedAppointments = [...filteredServiceOrders].sort((a, b) => {
        const aIndex = statusOrder.indexOf(a.orderStatus)
        const bIndex = statusOrder.indexOf(b.orderStatus)
        return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex)
    })

    const columns = [
        {
            title: t("table.no"),
            key: "index",
            width: 70,
            render: (_: any, __: any, index: number) => (
                <span style={{ fontWeight: 500, color: "#6b7280" }}>{index + 1}</span>
            ),
        },
        {
            title: t("table.patient"),
            dataIndex: "appointmentId",
            key: "patient",
            render: (appointmentId: number, record: ServiceOrder) => {
                const appointment = appointmentsData[appointmentId];
                const patientInfo = appointment?.patientInfo;
                return (
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <Avatar
                            src={
                                patientInfo?.avatar ||
                                "https://png.pngtree.com/png-clipart/20210608/ourlarge/pngtree-dark-gray-simple-avatar-png-image_3418404.jpg"
                            }
                            size={48}
                            style={{ marginRight: 12, border: "2px solid #e0f2fe" }}
                            icon={<UserOutlined />}
                        />
                        <div>
                            <div style={{ fontWeight: 600, color: "#111827", marginBottom: "2px" }}>
                                {patientInfo
                                    ? `${patientInfo.first_name || ""} ${patientInfo.last_name || ""}`.trim() || t("table.noInformation")
                                    : t("table.noInformation")}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>
                                {t("table.patientId")}: {patientInfo?.id || "N/A"}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>
                                {patientInfo?.birthday ? new Date(patientInfo.birthday).toLocaleDateString("vi-VN") : "N/A"} -{" "}
                                {patientInfo?.gender === "M" ? t("table.male") : patientInfo?.gender === "F" ? t("table.female") : "N/A"}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            title: t("table.service"),
            dataIndex: "serviceName",
            key: "serviceName",
            render: (serviceName: string, record: ServiceOrder) => (
                <div>
                    <div style={{ fontWeight: 600, color: "#111827", marginBottom: "4px" }}>{serviceName}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                        {t("table.orderId")}: {record.orderId}
                    </div>
                    {record.result && (
                        <div style={{ display: "flex", gap: "8px" }}>
                            <Button
                                size="small"
                                type="link"
                                style={{ padding: "0", height: "auto", fontSize: "11px", color: "#1d4ed8" }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(record.result, "_blank");
                                }}
                            >
                                {t("table.viewPDF")}
                            </Button>
                            <Button
                                size="small"
                                type="link"
                                style={{ padding: "0", height: "auto", fontSize: "11px", color: "#1d4ed8" }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const link = document.createElement("a");
                                    link.href = record.result!;
                                    link.download = `ket-qua-${record.orderId}.pdf`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                            >
                                {t("table.download")}
                            </Button>
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: t("table.orderTime"),
            dataIndex: "orderTime",
            key: "orderTime",
            render: (orderTime: string) => (
                <div style={{ display: "flex", alignItems: "center" }}>
                    <CalendarOutlined style={{ marginRight: 8, color: "#6b7280" }} />
                    <span style={{ color: "#374151" }}>
                        {orderTime ? dayjs(orderTime).format("HH:mm DD/MM/YYYY") : t("table.none")}
                    </span>
                </div>
            ),
        },
        {
            title: t("table.status"),
            dataIndex: "orderStatus",
            key: "orderStatus",
            render: (status: string) => {
                const statusConfig = {
                    O: { color: "#b45309", bgColor: "#fef3c7", text: t("status.ordered") },
                    C: { color: "#15803d", bgColor: "#d1fae5", text: t("status.completed") },
                };
                const config = statusConfig[status as keyof typeof statusConfig] || {
                    color: "#6b7280",
                    bgColor: "#f3f4f6",
                    text: t("table.unknown"),
                };
                return (
                    <span
                        style={{
                            color: config.color,
                            backgroundColor: config.bgColor,
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 500,
                        }}
                    >
                        {config.text}
                    </span>
                );
            },
        },
        {
            title: t("table.actions"),
            key: "action",
            width: 120,
            render: (_: any, record: ServiceOrder) => (
                <Space size="small">
                    <Tooltip title={t("table.viewDetails")}>
                        <Button
                            icon={<EditOutlined />}
                            type="text"
                            size="small"
                            onClick={() => handleViewServiceOrder(record)}
                            style={{ color: "#1d4ed8" }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ]

    return (
        <div style={{ minHeight: "100vh" }}>
            <div style={{ }}>
                {/* Header */}
                <div style={{ marginBottom: "24px" }}>
                    <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111827", margin: 0, marginBottom: "8px" }}>
                        {t("header.patientList")}
                    </h1>
                    <p style={{ color: "#6b7280", fontSize: "16px", margin: 0 }}>
                        {t("header.manageAndTrack")}
                        {selectedDate && (
                            <span style={{ marginLeft: "8px", fontWeight: 500 }}>
                                - {t("header.date")}: {dayjs(selectedDate).format("DD/MM/YYYY")}
                            </span>
                        )}
                        {selectedRoomId && (
                            <span style={{ marginLeft: "8px", fontWeight: 500 }}>
                                - {t("table.room")} {selectedRoomId}
                            </span>
                        )}
                    </p>
                </div>

                {/* Stats Cards */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "16px",
                        marginBottom: "24px",
                    }}
                >
                    <Card size="small" style={{ textAlign: "center", borderColor: "#1d4ed8" }}>
                        <div style={{ fontSize: "24px", fontWeight: "bold", color: "#111827" }}>{stats.total}</div>
                        <div style={{ color: "#6b7280" }}>{t("stats.totalAppointments")}</div>
                    </Card>
                    <Card size="small" style={{ textAlign: "center", borderColor: "#b45309" }}>
                        <div style={{ fontSize: "24px", fontWeight: "bold", color: "#b45309" }}>{stats.ordered}</div>
                        <div style={{ color: "#6b7280" }}>{t("stats.ordered")}</div>
                    </Card>
                    <Card size="small" style={{ textAlign: "center", borderColor: "#15803d" }}>
                        <div style={{ fontSize: "24px", fontWeight: "bold", color: "#15803d" }}>{stats.completed}</div>
                        <div style={{ color: "#6b7280" }}>{t("stats.completed")}</div>
                    </Card>
                </div>

                {/* Filters */}
                <Card
                    bordered={false}
                    style={{
                        borderRadius: "16px",
                        marginBottom: "24px",
                        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                        border: "1px solid #1d4ed8",
                    }}
                >
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                        <Search
                            placeholder={t("placeholders.searchPatient")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: 320 }}
                            prefix={<SearchOutlined style={{ color: "#6b7280" }} />}
                        />
                        <DatePicker
                            placeholder={t("placeholders.selectWorkingDate")}
                            style={{ width: 200 }}
                            value={selectedDate ? dayjs(selectedDate) : null}
                            onChange={handleDateChange}
                            format="DD/MM/YYYY"
                        />
                        <Select
                            placeholder={t("placeholders.selectRoom")}
                            value={selectedRoomId}
                            style={{ width: 300 }}
                            disabled
                        >
                            {selectedRoomId && (
                                (() => {
                                    const room = getRoomsForSelectedDate.find(r => r.roomId === selectedRoomId);
                                    return room ? (
                                        <Option key={room.roomId} value={room.roomId}>
                                            {room.displayName}
                                        </Option>
                                    ) : null;
                                })()
                            )}
                        </Select>
                        <Select
                            placeholder={t("placeholders.status")}
                            value={statusFilter}
                            onChange={handleStatusChange}
                            style={{ width: 150 }}
                            suffixIcon={<FilterOutlined style={{ color: "#6b7280" }} />}
                        >
                            <Option value="all">{t("options.allStatuses")}</Option>
                            <Option value="O">{t("status.ordered")}</Option>
                            <Option value="C">{t("status.completed")}</Option>
                        </Select>
                        <Button icon={<ClearOutlined />} onClick={handleClearFilters} type="text" style={{ color: "#1d4ed8" }}>
                            {t("buttons.clearFilters")}
                        </Button>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleRefresh}
                            loading={loading || scheduleLoading}
                            style={{ marginLeft: "auto", color: "#1d4ed8" }}
                        >
                            {t("buttons.refresh")}
                        </Button>
                    </div>
                </Card>

                {/* Service Orders Table */}
                <Card
                    bordered={false}
                    style={{
                        borderRadius: "16px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        height: "100%",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "20px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#111827", margin: 0 }}>
                                {t("header.serviceOrderList")}
                            </h2>
                            <span
                                style={{
                                    backgroundColor: "#e0f2fe",
                                    color: "#1d4ed8",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    padding: "4px 12px",
                                    borderRadius: "20px",
                                }}
                            >
                                {stats.total} {t("header.patients")}
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "60px 0" }}>
                            <Spin size="large" />
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: "center", padding: "60px 0" }}>
                            <Empty description={error} />
                        </div>
                    ) : !selectedRoomId ? (
                        <Empty
                            description={t("empty.noPatientsFound")}
                            style={{ padding: "60px 0" }}
                        />
                    ) : !Array.isArray(filteredServiceOrders) || filteredServiceOrders.length === 0 ? (
                        <Empty description={t("empty.noOrdersFound")} style={{ padding: "60px 0" }} />
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={sortedAppointments}
                            rowKey="orderId"
                            pagination={{
                                pageSize: 20,
                                showSizeChanger: true,
                                pageSizeOptions: ["10", "20", "50"],
                                showTotal: (total, range) => t("pagination.showing", { start: range[0], end: range[1], total }),
                                style: { marginTop: "16px" },
                            }}
                            style={{ borderRadius: "12px" }}
                            rowClassName={(record, index) => (index % 2 === 0 ? "table-row-light" : "table-row-dark")}
                        />
                    )}
                </Card>
            </div>
        </div>
    )
}

export default ServicePatients
