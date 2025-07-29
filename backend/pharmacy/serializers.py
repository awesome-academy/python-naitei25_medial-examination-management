from rest_framework import serializers
from .models import Medicine, Prescription, PrescriptionDetail

class PrescriptionDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescriptionDetail
        fields = "__all__"

class PrescriptionSerializer(serializers.ModelSerializer):
    prescription_details = PrescriptionDetailSerializer(many=True, read_only=True, source='prescriptiondetail_set')

    class Meta:
        model = Prescription
        fields = "__all__"

class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = "__all__"
