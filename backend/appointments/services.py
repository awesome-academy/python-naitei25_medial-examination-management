from datetime import datetime, date

from django.core.paginator import Paginator
from django.core.files.uploadedfile import UploadedFile
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Appointment, AppointmentNote, ServiceOrder, Service
from .serializers import (
    AppointmentNoteSerializer,
    ServiceOrderSerializer,
    ServiceSerializer
)


class AppointmentService:

    @staticmethod
    def get_all_appointments(page_no=1, page_size=10):
        appointments = Appointment.objects.all()
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
    def get_appointments_by_doctor_and_schedules(doctor_id, schedule_ids, page_no=1, page_size=10):
        qs = Appointment.objects.filter(doctor_id=doctor_id, schedule_id__in=schedule_ids)
        paginator = Paginator(qs, page_size)
        return paginator.get_page(page_no)

    @staticmethod
    def get_appointments_by_doctor_id_optimized(doctor_id, shift=None, work_date=None, appointment_status=None, room_id=None, page_no=0, page_size=10):
        qs = Appointment.objects.filter(doctor_id=doctor_id).select_related('patient', 'doctor', 'schedule')
        
        if shift:
            qs = qs.filter(schedule__shift=shift)
        
        if work_date:
            qs = qs.filter(schedule__work_date=work_date)
        
        if appointment_status:
            qs = qs.filter(status=appointment_status)
        
        if room_id:
            qs = qs.filter(schedule__room_id=room_id)
        
        qs = qs.order_by('-created_at')
        
        # Handle pagination
        total_count = qs.count()
        start_index = page_no * page_size
        end_index = start_index + page_size
        results = list(qs[start_index:end_index])
        
        total_pages = (total_count + page_size - 1) // page_size if page_size > 0 else 1
        is_last = page_no >= total_pages - 1 if total_pages > 0 else True
        
        return {
            'results': results,
            'pageNo': page_no,
            'pageSize': page_size,
            'totalElements': total_count,
            'totalPages': total_pages,
            'last': is_last
        }

    @staticmethod
    def get_appointments_by_patient_id_optimized(patient_id, page_no=0, page_size=10):

        qs = Appointment.objects.filter(patient_id=patient_id).select_related('patient', 'doctor', 'schedule')
        
        qs = qs.order_by('-created_at')
        
        total_count = qs.count()
        start_index = page_no * page_size
        end_index = start_index + page_size
        results = list(qs[start_index:end_index])
        
        total_pages = (total_count + page_size - 1) // page_size if page_size > 0 else 1
        is_last = page_no >= total_pages - 1 if total_pages > 0 else True
        
        return {
            'results': results,
            'pageNo': page_no,
            'pageSize': page_size,
            'totalElements': total_count,
            'totalPages': total_pages,
            'last': is_last
        }

    @staticmethod
    def get_available_time_slots(schedule_id, data):
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        existing_appointments = Appointment.objects.filter(schedule_id=schedule_id)
        
        slots = []
        
        if start_time and end_time:
            from datetime import datetime, timedelta
            current_time = datetime.combine(datetime.today(), start_time)
            end_datetime = datetime.combine(datetime.today(), end_time)
            
            while current_time < end_datetime:
                slot_end = current_time + timedelta(minutes=30)
                if slot_end.time() <= end_time:
                    # Check if this slot is available
                    is_available = not existing_appointments.filter(
                        slot_start=current_time.time(),
                        slot_end=slot_end.time()
                    ).exists()
                    
                    slots.append({
                        'slot_start': current_time.time(),
                        'slot_end': slot_end.time(),
                        'is_available': is_available
                    })
                
                current_time += timedelta(minutes=30)
        
        return slots

    @staticmethod
    def get_appointments_by_schedule_id(schedule_id):
        return Appointment.objects.filter(schedule_id=schedule_id).select_related('patient', 'doctor', 'schedule')


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
        return ServiceOrder.objects.all()

    @staticmethod
    def get_order_by_id(order_id):
        return get_object_or_404(ServiceOrder, id=order_id)

    @staticmethod
    def create_order(data):
        order = ServiceOrder.objects.create(
            appointment_id=data['appointment_id'],
            room_id=data['room_id'],
            service_id=data['service_id'],
            status=data.get('order_status', 'PENDING'),
            result=data.get('result'),
            number=data.get('number'),
            order_time=data.get('order_time'),
            result_time=data.get('result_time')
        )
        return order

    @staticmethod
    def update_order(order_id, data):
        order = get_object_or_404(ServiceOrder, id=order_id)
        
        if 'appointment_id' in data:
            order.appointment_id = data['appointment_id']
        if 'room_id' in data:
            order.room_id = data['room_id']
        if 'service_id' in data:
            order.service_id = data['service_id']
        if 'order_status' in data:
            order.status = data['order_status']
        if 'result' in data:
            order.result = data['result']
        if 'number' in data:
            order.number = data['number']
        if 'order_time' in data:
            order.order_time = data['order_time']
        if 'result_time' in data:
            order.result_time = data['result_time']
        
        order.save()
        return order

    @staticmethod
    def delete_order(order_id):
        order = get_object_or_404(ServiceOrder, id=order_id)
        order.delete()

    @staticmethod
    def get_orders_by_appointment_id(appointment_id):
        return ServiceOrder.objects.filter(appointment_id=appointment_id)

    @staticmethod
    def get_orders_by_room_id(room_id, status=None, order_date=None):
        qs = ServiceOrder.objects.filter(room_id=room_id)
        
        if status:
            qs = qs.filter(status=status)
        
        if order_date:
            qs = qs.filter(order_time__date=order_date)
        
        return qs

    @staticmethod
    def get_orders_by_room_and_status_and_date(room_id, status, order_date: datetime.date):
        return ServiceOrder.objects.filter(
            room_id=room_id,
            status=status,
            order_time__date=order_date
        )

    @staticmethod
    def upload_test_result(order_id, file: UploadedFile):
        order = get_object_or_404(ServiceOrder, id=order_id)
        order.result_file_url = f"/uploads/{file.name}" 
        order.save()
        return order
    
class ServicesService:

    @staticmethod
    def get_all_services():
        return Service.objects.all()

    @staticmethod
    def get_service_by_id(service_id):
        return get_object_or_404(Service, id=service_id)

    @staticmethod
    def create_service(data):
        service = Service.objects.create(
            service_name=data['service_name'],
            service_type=data['service_type'],
            price=data['price']
        )
        return service

    @staticmethod
    def update_service(service_id, data):
        service = get_object_or_404(Service, id=service_id)
        
        if 'service_name' in data:
            service.service_name = data['service_name']
        if 'service_type' in data:
            service.service_type = data['service_type']
        if 'price' in data:
            service.price = data['price']
        
        service.save()
        return service

    @staticmethod
    def delete_service(service_id):
        service = get_object_or_404(Service, id=service_id)
        service.delete()
