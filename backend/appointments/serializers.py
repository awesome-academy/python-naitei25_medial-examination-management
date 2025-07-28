from rest_framework import serializers
from .models import Appointment, AppointmentNote, Service, ServiceOrder

class AppointmentNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentNote
        fields = "__all__"

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = "__all__"

class ServiceOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceOrder
        fields = "__all__"

class AppointmentSerializer(serializers.ModelSerializer):
    appointment_notes = AppointmentNoteSerializer(many=True, read_only=True, source='appointmentnote_set')
    service_orders = ServiceOrderSerializer(many=True, read_only=True, source='serviceorder_set')

    class Meta:
        model = Appointment
        fields = "__all__"
