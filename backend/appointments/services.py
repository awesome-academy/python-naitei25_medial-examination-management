from datetime import datetime, date

from django.core.paginator import Paginator
from django.core.files.uploadedfile import UploadedFile
from django.shortcuts import get_object_or_404
from common.constants import PAGE_NO_DEFAULT, PAGE_SIZE_DEFAULT, ALL_SLOTS

from .models import Appointment, AppointmentNote, ServiceOrder, Service
from .serializers import (
    AppointmentNoteSerializer,
    ServiceOrderSerializer,
    ServiceSerializer
)


class AppointmentService:

    @staticmethod
    def get_appointments_by_doctor_id_optimized(
        doctor_id, shift=None, work_date=None, appointment_status=None, room_id=None, page_no=PAGE_NO_DEFAULT, page_size=PAGE_SIZE_DEFAULT
    ):
        qs = Appointment.objects.filter(doctor_id=doctor_id)

        if shift:
            qs = qs.filter(schedule__shift=shift)

        if work_date:
            qs = qs.filter(schedule__date=work_date)

        if appointment_status:
            qs = qs.filter(status=appointment_status)

        if room_id:
            qs = qs.filter(room_id=room_id)

        paginator = Paginator(qs.order_by("schedule__start_time"), page_size)
        page = paginator.get_page(page_no + 1)

        return {
            "results": list(page),
            "pageNo": page_no,
            "pageSize": page_size,
            "totalElements": paginator.count,
            "totalPages": paginator.num_pages,
            "last": not page.has_next()
        }

    @staticmethod
    def get_appointments_by_patient_id_optimized(patient_id, page_no, page_size):
        queryset = Appointment.objects.filter(patient_id=patient_id).order_by('-created_at')
        paginator = Paginator(queryset, page_size)
        page = paginator.get_page(page_no + 1)  # vì page_no trong Django bắt đầu từ 1

        return {
            "results": list(page.object_list),
            "pageNo": page_no,
            "pageSize": page_size,
            "totalElements": paginator.count,
            "totalPages": paginator.num_pages,
            "last": not page.has_next()
        }
    
    @staticmethod
    def get_all_appointments(page_no=PAGE_NO_DEFAULT+1, page_size=PAGE_SIZE_DEFAULT):
        appointments = Appointment.objects.all().order_by('-created_at')
        paginator = Paginator(appointments, page_size)
        return paginator.get_page(page_no)

    @staticmethod
    def get_appointments_by_doctor(doctor_id, page_no=None, page_size=None):
        qs = Appointment.objects.filter(doctor_id=doctor_id)
        if page_no and page_size:
            paginator = Paginator(qs, page_size)
            return paginator.get_page(page_no)
        return qs

    @staticmethod
    def get_appointments_by_patient(patient_id, page_no=None, page_size=None):
        qs = Appointment.objects.filter(patient_id=patient_id)
        if page_no and page_size:
            paginator = Paginator(qs, page_size)
            return paginator.get_page(page_no)
        return qs

    @staticmethod
    def get_appointments_by_doctor_and_date(doctor_id, date):
        return Appointment.objects.filter(doctor_id=doctor_id, schedule__date=date)

    @staticmethod
    def count_by_schedule_and_slot_start(schedule_id, slot_start):
        return Appointment.objects.filter(schedule_id=schedule_id, slot_start=slot_start).count()

    @staticmethod
    def get_appointments_by_schedule_ordered(schedule_id):
        return Appointment.objects.filter(schedule_id=schedule_id).order_by("slot_start")

    @staticmethod
    def get_appointments_by_doctor_and_schedules(doctor_id, schedule_ids, page_no=1, page_size=PAGE_SIZE_DEFAULT):
        qs = Appointment.objects.filter(doctor_id=doctor_id, schedule_id__in=schedule_ids)
        paginator = Paginator(qs, page_size)
        return paginator.get_page(page_no)
    
    @staticmethod
    def get_available_time_slots(schedule_id, data):
        appointment_date = data.get('appointment_date')  # lấy ngày từ serializer
        

        booked_slots = Appointment.objects.filter(
            schedule_id=schedule_id
        ).values_list('slot_start', 'slot_end')

        booked_list = list(booked_slots)

        available = []
        for slot in ALL_SLOTS:
            if (slot["slot_start"], slot["slot_end"]) not in booked_list:
                available.append({**slot, "available": True})
            else:
                available.append({**slot, "available": False})

        return available


class AppointmentNoteService:

    @staticmethod
    def get_notes_by_appointment_id(appointment_id):
        return AppointmentNote.objects.filter(appointment_id=appointment_id)

    @staticmethod
    def create_note(appointment_id, data):
        data['appointment'] = appointment_id
        serializer = AppointmentNoteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    @staticmethod
    def update_note(note_id, data):
        note = get_object_or_404(AppointmentNote, id=note_id)
        serializer = AppointmentNoteSerializer(note, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    @staticmethod
    def delete_note(note_id):
        note = get_object_or_404(AppointmentNote, id=note_id)
        note.delete()


class ServiceOrderService:

    @staticmethod
    def get_all_orders():
        return ServiceOrder.objects.all().order_by('-created_at')

    @staticmethod
    def get_order_by_id(order_id):
        return get_object_or_404(ServiceOrder, id=order_id)

    def create_order(data):
        return ServiceOrder.create_order(data)

    @staticmethod
    def update_order(order_id, data):
        order = get_object_or_404(ServiceOrder, id=order_id)
        serializer = ServiceOrderSerializer(order, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    @staticmethod
    def delete_order(order_id):
        order = get_object_or_404(ServiceOrder, id=order_id)
        order.delete()

    @staticmethod
    def get_orders_by_appointment_id(appointment_id):
        return ServiceOrder.objects.filter(appointment_id=appointment_id)

    @staticmethod
    def get_orders_by_room_and_status_and_date(room_id, status=None, order_date=None):
        filters = {
            "appointment__schedule__room_id": room_id,
        }
        if status:
            filters["status"] = status
        if order_date:
            filters["created_at__date"] = order_date

        return ServiceOrder.objects.filter(**filters)


    @staticmethod
    def upload_test_result(order_id, file: UploadedFile):
        order = get_object_or_404(ServiceOrder, id=order_id)
        order.test_result_file = file
        order.save()
        return order
    
class ServicesService:

    @staticmethod
    def get_all_services():
        return Service.objects.all().order_by('-created_at')

    @staticmethod
    def get_service_by_id(service_id):
        return get_object_or_404(Service, id=service_id)

    @staticmethod
    def create_service(data):
        serializer = ServiceSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    @staticmethod
    def update_service(service_id, data):
        service = get_object_or_404(Service, id=service_id)
        serializer = ServiceSerializer(service, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    @staticmethod
    def delete_service(service_id):
        service = get_object_or_404(Service, id=service_id)
        service.delete()

    @staticmethod
    def create_service(data):
        return Service.create_service(data)
    
