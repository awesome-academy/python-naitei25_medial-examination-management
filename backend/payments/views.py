from rest_framework import viewsets
from .models import Bill, BillDetail, Transaction
from .serializers import (
    BillSerializer,
    BillDetailSerializer,
    TransactionSerializer,
)

class BillViewSet(viewsets.ModelViewSet):
    queryset = Bill.objects.all()
    serializer_class = BillSerializer

class BillDetailViewSet(viewsets.ModelViewSet):
    queryset = BillDetail.objects.all()
    serializer_class = BillDetailSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
