from rest_framework import serializers
from .models import Patient, EmergencyContact

class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = "__all__"

class PatientSerializer(serializers.ModelSerializer):
    emergency_contacts = EmergencyContactSerializer(many=True, read_only=True, source='emergencycontact_set')

    class Meta:
        model = Patient
        fields = "__all__"
