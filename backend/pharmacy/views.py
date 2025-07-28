from rest_framework import viewsets
from .models import Medicine, Prescription, PrescriptionDetail
from .serializers import (
    MedicineSerializer,
    PrescriptionSerializer,
    PrescriptionDetailSerializer,
)

class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer

class PrescriptionDetailViewSet(viewsets.ModelViewSet):
    queryset = PrescriptionDetail.objects.all()
    serializer_class = PrescriptionDetailSerializer
