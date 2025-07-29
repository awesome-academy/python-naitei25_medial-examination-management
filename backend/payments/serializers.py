from rest_framework import serializers
from .models import Bill, BillDetail, Transaction

class BillDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillDetail
        fields = "__all__"

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = "__all__"

class BillSerializer(serializers.ModelSerializer):
    bill_details = BillDetailSerializer(many=True, read_only=True, source='billdetail_set')
    transactions = TransactionSerializer(many=True, read_only=True, source='transaction_set')

    class Meta:
        model = Bill
        fields = "__all__"
