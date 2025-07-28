from rest_framework import viewsets
from .models import Department, ExaminationRoom, Doctor, Schedule
from .serializers import (
    DepartmentSerializer,
    ExaminationRoomSerializer,
    DoctorSerializer,
    ScheduleSerializer,
)

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class ExaminationRoomViewSet(viewsets.ModelViewSet):
    queryset = ExaminationRoom.objects.all()
    serializer_class = ExaminationRoomSerializer

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer

class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer
