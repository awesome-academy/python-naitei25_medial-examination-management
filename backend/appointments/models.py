from django.db import models
from core.models import BaseModel
from doctors.models import Doctor, Schedule, ExaminationRoom
from patients.models import Patient
from common.enums import AppointmentStatus, NoteType, OrderStatus, ServiceType
from common.constants import SERVICE_LENGTH, COMMON_LENGTH, DECIMAL_MAX_DIGITS, DECIMAL_DECIMAL_PLACES, ENUM_LENGTH

class Appointment(BaseModel):
    doctor = models.ForeignKey(Doctor, on_delete=models.RESTRICT)
    patient = models.ForeignKey(Patient, on_delete=models.RESTRICT)
    schedule = models.ForeignKey(Schedule, on_delete=models.RESTRICT)
    symptoms = models.TextField()
    number = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=ENUM_LENGTH["DEFAULT"], choices=[(a.value, a.name) for a in AppointmentStatus])

    def __str__(self):
        return f"Appointment {self.pk}"


class AppointmentNote(BaseModel):
    appointment = models.ForeignKey(Appointment, on_delete=models.RESTRICT)
    noteType = models.CharField(max_length=ENUM_LENGTH["DEFAULT"], choices=[(n.value, n.name) for n in NoteType])
    noteText = models.TextField()

    def __str__(self):
        return f"Note {self.pk}"


class Service(BaseModel):
    service_name = models.CharField(max_length=SERVICE_LENGTH["SERVICE_NAME"])
    service_type = models.CharField(max_length=ENUM_LENGTH["DEFAULT"], choices=[(s.value, s.name) for s in ServiceType])
    price = models.DecimalField(max_digits=DECIMAL_MAX_DIGITS, decimal_places=DECIMAL_DECIMAL_PLACES)

    def __str__(self):
        return self.service_name


class ServiceOrder(BaseModel):
    appointment = models.ForeignKey(Appointment, on_delete=models.RESTRICT)
    room = models.ForeignKey(ExaminationRoom, on_delete=models.RESTRICT)
    service = models.ForeignKey(Service, on_delete=models.RESTRICT)
    status = models.CharField(max_length=ENUM_LENGTH["DEFAULT"], choices=[(o.value, o.name) for o in OrderStatus])
    result = models.TextField(blank=True, null=True)
    number = models.IntegerField(blank=True, null=True)
    order_time = models.DateTimeField(blank=True, null=True)
    result_time = models.DateTimeField(blank=True, null=True)
    result_file_url = models.CharField(max_length=COMMON_LENGTH["URL"], blank=True, null=True)
    result_file_public_id = models.CharField(max_length=COMMON_LENGTH["PUBLIC_ID"], blank=True, null=True)

    def __str__(self):
        return f"Order {self.pk}"
