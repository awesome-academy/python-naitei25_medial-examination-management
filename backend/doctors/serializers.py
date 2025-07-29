from rest_framework import serializers
from .models import Department, ExaminationRoom, Doctor, Schedule

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"

class ExaminationRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExaminationRoom
        fields = "__all__"

class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = "__all__"

class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = "__all__"
