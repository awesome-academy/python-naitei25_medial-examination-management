from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .models import Appointment, AppointmentNote, ServiceOrder, Schedule
from patients.serializers import PatientSerializer
from doctors.serializers import DoctorSerializer
from common.enums import ServiceType
from .models import Service
from common.constants import DECIMAL_MAX_DIGITS, DECIMAL_DECIMAL_PLACES, PAGE_NO_DEFAULT, PAGE_SIZE_DEFAULT, MIN_VALUE
from django.utils.translation import gettext_lazy as _


class AvailableSlotSerializer(serializers.Serializer):
    time = serializers.CharField()
    available = serializers.BooleanField()
    scheduleId = serializers.IntegerField()
    
class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            'id',
            'slot_start', 'slot_end', 'schedule',
            'symptoms', 'status',
            'doctor', 'patient'
        ]
        read_only_fields = ['id']

class AppointmentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            'id', 'doctor', 'patient', 'schedule', 'symptoms',
            'number', 'status', 'slot_start', 'slot_end'
        ]


class AppointmentNoteSerializer(serializers.ModelSerializer):
    appointmentId = serializers.IntegerField(source='appointment.id', read_only=True)
    content = serializers.CharField(source='note_text')
    note_type = serializers.CharField()

    class Meta:
        model = AppointmentNote
        fields = ['id', 'appointmentId', 'note_type', 'content', 'created_at']

class ScheduleSerializer(serializers.ModelSerializer):
    location = serializers.CharField(source='room.location', read_only=True)
    room_note = serializers.CharField(source='room.room_note', read_only=True)
    floor = serializers.IntegerField(source='room.floor', read_only=True)
    building = serializers.CharField(source='room.building', read_only=True)

    class Meta:
        model = Schedule
        fields = [
            'id',
            'doctor',
            'work_date',
            'start_time',
            'end_time',
            'shift',
            'room',
            'location',
            'room_note',
            'floor',
            'building',
        ]


class AppointmentDetailSerializer(serializers.ModelSerializer):
    patientInfo = PatientSerializer(source='patient', read_only=True)
    doctorInfo = DoctorSerializer(source='doctor', read_only=True)
    schedule = ScheduleSerializer()
    appointmentNotes = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id', 'doctor', 'schedule', 'symptoms',
            'slot_start', 'slot_end', 'status', 'created_at',
            'patientInfo', 'doctorInfo', 'appointmentNotes',
        ]

    def get_appointmentNotes(self, obj):
        notes = AppointmentNote.objects.filter(appointment=obj)
        return AppointmentNoteSerializer(notes, many=True).data



class AppointmentDoctorViewSerializer(serializers.ModelSerializer):
    patientInfo = PatientSerializer(source='patient', read_only=True)
    schedule = ScheduleSerializer()

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient_id', 'patientInfo', 'symptoms',
            'schedule', 'status', 'created_at'
        ]


class AppointmentPatientViewSerializer(serializers.ModelSerializer):
    doctorInfo = DoctorSerializer(source='doctor', read_only=True)
    schedule = ScheduleSerializer()

    class Meta:
        model = Appointment
        fields = [
            'id', 'doctor_id', 'doctorInfo', 'schedule',
            'symptoms','slot_start', 'slot_end',
            'status', 'created_at'
        ]

class ScheduleTimeSerializer(serializers.Serializer):
    schedule_id = serializers.IntegerField(required=False)
    start_time = serializers.TimeField(required=False)
    end_time = serializers.TimeField(required=False)


class ServiceOrderSerializer(serializers.Serializer):
    order_id = serializers.IntegerField(required=False)
    appointment_id = serializers.IntegerField(
        required=True,
        error_messages={
            'required': _('Mã lịch hẹn không được để trống')
        }
    )
    room_id = serializers.IntegerField(
        required=True,
        error_messages={
            'required': _('Mã phòng không được để trống')
        }
    )

    service_id = serializers.IntegerField(
        required=True,
        error_messages={
            'required': _('Mã dịch vụ không được để trống')
        }
    )
    order_status = serializers.CharField(source='status',required=False)
    result = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    number = serializers.IntegerField(required=False)
    order_time = serializers.DateTimeField(required=False)
    result_time = serializers.DateTimeField(required=False)
    created_at = serializers.CharField(required=False)

    def create(self, validated_data):
        return ServiceOrder.objects.create(**validated_data)


class ServiceSerializer(serializers.Serializer):
    service_id = serializers.IntegerField(required=False)
    service_name = serializers.CharField(required=True)
    service_type = serializers.ChoiceField(
    choices=[(item.value, item.name) for item in ServiceType],
    required=True
)
    price = serializers.DecimalField(max_digits=DECIMAL_MAX_DIGITS, decimal_places=DECIMAL_DECIMAL_PLACES, required=True)
    created_at = serializers.CharField(required=False, allow_null=True)
    service_orders = ServiceOrderSerializer(many=True, required=False, allow_null=True)

    def create(self, validated_data):
        return Service.objects.create(**validated_data)


class AppointmentSerializer(serializers.ModelSerializer):
    appointment_notes = AppointmentNoteSerializer(many=True, read_only=True, source='appointmentnote_set')
    service_orders = ServiceOrderSerializer(many=True, read_only=True, source='serviceorder_set')

    class Meta:
        model = Appointment
        fields = "__all__"


class CustomPageNumberPagination(PageNumberPagination):
    page_size_query_param = 'pageSize'
    page_query_param = 'pageNo'

    def get_paginated_response(self, data):
        return Response({
            "content": data,
            "pageNo": self.page.number,
            "pageSize": self.page.paginator.per_page,
            "totalElements": self.page.paginator.count,
            "totalPages": self.page.paginator.num_pages,
            "last": not self.page.has_next()
        })


class AppointmentFilterSerializer(serializers.Serializer):
    shift = serializers.CharField(required=False, allow_blank=True)
    workDate = serializers.DateField(required=False, source='work_date', input_formats=['%Y-%m-%d'])
    appointmentStatus = serializers.CharField(required=False, source='appointment_status', allow_blank=True)
    roomId = serializers.IntegerField(required=False, source='room_id')
    pageNo = serializers.IntegerField(default=PAGE_NO_DEFAULT, min_value=MIN_VALUE, source='page_no')
    pageSize = serializers.IntegerField(default=PAGE_SIZE_DEFAULT, min_value=MIN_VALUE, source='page_size')

class AppointmentPatientFilterSerializer(serializers.Serializer):
    pageNo = serializers.IntegerField(default=PAGE_NO_DEFAULT, min_value=MIN_VALUE, source='page_no')
    pageSize = serializers.IntegerField(default=PAGE_SIZE_DEFAULT, min_value=MIN_VALUE, source='page_size')
