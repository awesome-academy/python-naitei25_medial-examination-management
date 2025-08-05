from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from rest_framework.parsers import JSONParser, MultiPartParser
from common.constants import PAGE_NO_DEFAULT, PAGE_SIZE_DEFAULT
from django.utils.translation import gettext as _

from .models import (
    Appointment,
    AppointmentNote,
    ServiceOrder,
    Service,
    Schedule
)
from .serializers import (
    AppointmentSerializer,
    AppointmentCreateSerializer,
    AppointmentUpdateSerializer,
    AppointmentDetailSerializer,
    AppointmentDoctorViewSerializer,
    AppointmentPatientViewSerializer,
    AvailableSlotSerializer,
    ScheduleTimeSerializer,
    CustomPageNumberPagination,
    AppointmentNoteSerializer,
    ServiceOrderSerializer,
    ServiceSerializer,
    AppointmentFilterSerializer,
    AppointmentPatientFilterSerializer,
)
from .services import (
    AppointmentService,
    ServiceOrderService,
    ServicesService
)

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().order_by("-created_at")
    serializer_class = AppointmentSerializer
    pagination_class = CustomPageNumberPagination

    def get_serializer_class(self):
        if self.action == 'create':
            return AppointmentCreateSerializer
        elif self.action == 'update':
            return AppointmentUpdateSerializer
        elif self.action == 'retrieve':
            return AppointmentDetailSerializer
        return AppointmentSerializer

    @action(detail=False, methods=['get'], url_path='doctor/(?P<doctor_id>[^/.]+)')
    def get_by_doctor(self, request, doctor_id):
        filter_serializer = AppointmentFilterSerializer(data=request.query_params)
        filter_serializer.is_valid(raise_exception=True)
        validated = filter_serializer.validated_data

        result_page = AppointmentService.get_appointments_by_doctor_id_optimized(
            doctor_id=doctor_id,
            shift=validated.get('shift'),
            work_date=validated.get('work_date'),
            appointment_status=validated.get('appointment_status'),
            room_id=validated.get('room_id'),
            page_no=validated['page_no'],
            page_size=validated['page_size']
        )

        serializer = AppointmentDoctorViewSerializer(result_page['results'], many=True)
        return Response({
            "content": serializer.data,
            "pageNo": result_page['pageNo'],
            "pageSize": result_page['pageSize'],
            "totalElements": result_page['totalElements'],
            "totalPages": result_page['totalPages'],
            "last": result_page['last'],
        })


    @action(detail=False, methods=['get'], url_path='patient/(?P<patient_id>[^/.]+)')
    def get_by_patient(self, request, patient_id):
        query_serializer = AppointmentPatientFilterSerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        validated = query_serializer.validated_data

        result_page = AppointmentService.get_appointments_by_patient_id_optimized(
            patient_id, validated['page_no'], validated['page_size']
        )
        response_serializer = AppointmentPatientViewSerializer(result_page['results'], many=True)
        return Response({
            "content": response_serializer.data,
            "pageNo": result_page['pageNo'],
            "pageSize": result_page['pageSize'],
            "totalElements": result_page['totalElements'],
            "totalPages": result_page['totalPages'],
            "last": result_page['last']
        })


    @action(detail=False, methods=['get'], url_path='schedule/available-slots')
    def available_slots(self, request):
        schedule_id = request.query_params.get('schedule_id')
        date = request.query_params.get('date')
        if not schedule_id or not date:
            return Response({"error": _("Yêu cầu schedule_id và date")}, status=status.HTTP_400_BAD_REQUEST)

        try:
            schedule = Schedule.objects.get(id=schedule_id, work_date=date)
        except Schedule.DoesNotExist:
            return Response({"error": _("Lịch trình không tồn tại")}, status=status.HTTP_404_NOT_FOUND)

        # Tạo slots từ start_time đến end_time (mỗi slot 30 phút)
        from datetime import datetime, timedelta
        start_time = datetime.strptime(schedule.start_time.strftime('%H:%M:%S'), '%H:%M:%S')
        end_time = datetime.strptime(schedule.end_time.strftime('%H:%M:%S'), '%H:%M:%S')
        slots = []
        current_time = start_time
        while current_time < end_time:
            slot_start = current_time.strftime('%H:%M:%S')
            slot_end = (current_time + timedelta(minutes=30)).strftime('%H:%M:%S')
            is_available = not Appointment.objects.filter(
                schedule_id=schedule_id,
                slot_start__gte=slot_start,
                slot_start__lt=slot_end,
                status__in=['PENDING', 'CONFIRMED']
            ).exists()
            slots.append({
                "time": slot_start,
                "available": is_available,
                "scheduleId": schedule.id
            })
            current_time += timedelta(minutes=30)

        return Response({
            "date": date,
            "timeSlots": slots
        })

    @action(detail=False, methods=['get'], url_path='schedule/(?P<schedule_id>[^/.]+)')
    def get_by_schedule(self, request, schedule_id):
        result = AppointmentService.get_appointments_by_schedule_ordered(schedule_id)
        serializer = AppointmentSerializer(result, many=True)
        return Response(serializer.data)


class AppointmentNoteViewSet(viewsets.ModelViewSet):
    queryset = AppointmentNote.objects.all()
    serializer_class = AppointmentNoteSerializer

    @action(detail=False, methods=['get'], url_path='appointment/(?P<appointment_id>[^/.]+)/notes')
    def list_by_appointment(self, request, appointment_id=None):
        notes = AppointmentNote.objects.filter(appointment_id=appointment_id)
        serializer = self.get_serializer(notes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='appointment/(?P<appointment_id>[^/.]+)/notes')
    def create_note(self, request, appointment_id=None):
        data = request.data.copy()
        data['appointment'] = appointment_id  # gán quan hệ appointment_id vào serializer
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(appointment_id=appointment_id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)



class ServiceOrderViewSet(viewsets.ViewSet):
    parser_classes = [MultiPartParser, JSONParser]

    def list(self, request):
        """GET /appointments/services/service-orders"""
        orders = ServiceOrderService.get_all_orders()
        serializer = ServiceOrderSerializer(orders, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """GET /appointments/services/service-orders/{orderId}"""
        order = ServiceOrderService.get_order_by_id(pk)
        serializer = ServiceOrderSerializer(order)
        return Response(serializer.data)

    def create(self, request):
        """POST /appointments/services/service-orders"""
        serializer = ServiceOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(ServiceOrderSerializer(order).data)

    def update(self, request, pk=None):
        """PUT /appointments/services/service-orders/{orderId}"""
        serializer = ServiceOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = ServiceOrderService.update_order(pk, serializer.validated_data)
        return Response(ServiceOrderSerializer(updated).data)

    def destroy(self, request, pk=None):
        """DELETE /appointments/services/service-orders/{orderId}"""
        ServiceOrderService.delete_order(pk)
        return Response({"message": _("Đặt dịch vụ đã xóa thành công")})

    @action(detail=False, methods=['get'], url_path='appointments/(?P<appointment_id>[^/.]+)/orders')
    def by_appointment(self, request, appointment_id=None):
        """GET /appointments/services/appointments/{appointmentId}/orders"""
        orders = ServiceOrderService.get_orders_by_appointment_id(appointment_id)
        serializer = ServiceOrderSerializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='rooms/(?P<room_id>[^/.]+)/orders')
    def by_room(self, request, room_id=None):
        status_param = request.query_params.get('status')
        order_date_str = request.query_params.get('orderDate')

        order_date = None
        if order_date_str:
            order_date = parse_date(order_date_str)
            if not order_date:
                return Response({"error": _("Ngày không hợp lệ. Định dạng đúng: YYYY-MM-DD")}, status=400)

        orders = ServiceOrderService.get_orders_by_room_and_status_and_date(
            room_id=room_id,
            status=status_param,
            order_date=order_date
        )
        serializer = ServiceOrderSerializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='result')
    def upload_result(self, request, pk=None):
        file = request.FILES.get('file')
        if not file:
            return Response({"message": _("Thiếu tệp kết quả.")}, status=status.HTTP_400_BAD_REQUEST)

        updated_order = ServiceOrderService.upload_test_result(pk, file)
        return Response({
            "message": _("Tải lên kết quả thành công."),
            "data": ServiceOrderSerializer(updated_order).data
        })



class ServiceViewSet(viewsets.ViewSet):
    def list(self, request):
        """GET /appointments/services/"""
        services = ServicesService.get_all_services()
        serializer = ServiceSerializer(services, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """GET /appointments/services/{serviceId}/"""
        service = ServicesService.get_service_by_id(pk)
        serializer = ServiceSerializer(service)
        return Response(serializer.data)

    def create(self, request):
        """POST /appointments/services/"""
        serializer = ServiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        created = serializer.save()
        return Response(ServiceSerializer(created).data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        """PUT /appointments/services/{serviceId}/"""
        serializer = ServiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = ServicesService.update_service(pk, serializer.validated_data)
        return Response(ServiceSerializer(updated).data)

    def destroy(self, request, pk=None):
        """DELETE /appointments/services/{serviceId}/"""
        ServicesService.delete_service(pk)
        return Response({"message": _("Dịch vụ đã xóa thành công")})
