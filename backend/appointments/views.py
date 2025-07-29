from rest_framework import viewsets
from .models import Appointment, AppointmentNote, Service, ServiceOrder
from .serializers import (
    AppointmentSerializer,
    AppointmentNoteSerializer,
    ServiceSerializer,
    ServiceOrderSerializer,
)

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer

class AppointmentNoteViewSet(viewsets.ModelViewSet):
    queryset = AppointmentNote.objects.all()
    serializer_class = AppointmentNoteSerializer

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

class ServiceOrderViewSet(viewsets.ModelViewSet):
    queryset = ServiceOrder.objects.all()
    serializer_class = ServiceOrderSerializer
