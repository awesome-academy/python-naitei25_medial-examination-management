from rest_framework import serializers
from .models import Bill, BillDetail, Transaction
from common.enums import PaymentStatus, ServiceType
from common.constants import PAYMENT_LENGTH, DECIMAL_MAX_DIGITS, DECIMAL_DECIMAL_PLACES, COMMON_LENGTH

class TransactionDTOSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'bill_id', 'amount', 'payment_method', 'transaction_date', 'status', 'created_at', 'updated_at']

class NewBillDetailRequestSerializer(serializers.Serializer):
    item_type = serializers.ChoiceField(choices=[(i.value, i.name) for i in ServiceType])
    quantity = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(max_digits=DECIMAL_MAX_DIGITS, decimal_places=DECIMAL_DECIMAL_PLACES)
    insurance_discount = serializers.DecimalField(max_digits=DECIMAL_MAX_DIGITS, decimal_places=DECIMAL_DECIMAL_PLACES, allow_null=True)

class NewBillRequestSerializer(serializers.Serializer):
    appointment_id = serializers.IntegerField()
    patient_id = serializers.IntegerField()
    total_cost = serializers.DecimalField(max_digits=DECIMAL_MAX_DIGITS, decimal_places=DECIMAL_DECIMAL_PLACES)
    insurance_discount = serializers.DecimalField(max_digits=DECIMAL_MAX_DIGITS, decimal_places=DECIMAL_DECIMAL_PLACES, allow_null=True)
    amount = serializers.DecimalField(max_digits=DECIMAL_MAX_DIGITS, decimal_places=DECIMAL_DECIMAL_PLACES)
    status = serializers.ChoiceField(choices=[(s.value, s.name) for s in PaymentStatus])
    bill_details = NewBillDetailRequestSerializer(many=True)

class UpdateBillRequestSerializer(serializers.Serializer):
    appointment_id = serializers.IntegerField(required=False)
    status = serializers.ChoiceField(choices=[(s.value, s.name) for s in PaymentStatus], required=False)

class BillDetailResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillDetail
        fields = ['id', 'bill_id', 'item_type', 'quantity', 'unit_price', 'total_price', 'insurance_discount', 'created_at', 'updated_at']

# serializers.py

class BillResponseSerializer(serializers.ModelSerializer):
    bill_details = BillDetailResponseSerializer(many=True, read_only=True)
    appointment = serializers.PrimaryKeyRelatedField(read_only=True)
    patient = serializers.PrimaryKeyRelatedField(read_only=True)
    amount = serializers.SerializerMethodField()  

    class Meta:
        model = Bill
        fields = [
            'id', 'appointment', 'patient',
            'total_cost', 'insurance_discount', 'amount',
            'status', 'created_at', 'updated_at', 'bill_details'
        ]

    def get_amount(self, obj):
        return sum(
            float(t.amount) for t in obj.transaction_set.all()
            if t.status == "SUCCESS"
        )


# class BillSerializer(serializers.ModelSerializer):
#     booking_fee = serializers.SerializerMethodField()
#     service_fee = serializers.SerializerMethodField()
#     amount = serializers.SerializerMethodField()

#     class Meta:
#         model = Bill
#         fields = [
#             'id',
#             'appointment',
#             'patient',
#             'total_cost',
#             'insurance_discount',
#             'amount',
#             'status',           # ⚡️ lấy trực tiếp từ model
#             'created_at',
#             'updated_at',
#             'booking_fee',
#             'service_fee'
#         ]

#     def get_booking_fee(self, obj):
#         return getattr(obj.appointment, "booking_fee", 0)

#     def get_service_fee(self, obj):
#         orders = obj.appointment.serviceorder_set.all()
#         return sum(float(order.service.price) for order in orders if order.service and order.service.price)

#     def get_amount(self, obj):
#         return sum(
#             float(t.amount) for t in obj.transaction_set.all()
#             if t.status == "SUCCESS"
#         )

# serializers.py
class BillSerializer(serializers.ModelSerializer):
    booking_fee = serializers.SerializerMethodField()
    service_fee = serializers.SerializerMethodField()
    amount = serializers.SerializerMethodField()  # vẫn giữ tính toán từ transaction

    class Meta:
        model = Bill
        fields = [
            'id',
            'appointment',
            'patient',
            'total_cost',
            'insurance_discount',
            'amount',
            'status',           # ⚡️ dùng trực tiếp field trong model
            'created_at',
            'updated_at',
            'booking_fee',
            'service_fee'
        ]

    def get_booking_fee(self, obj):
        return getattr(obj.appointment, "booking_fee", 0)

    def get_service_fee(self, obj):
        orders = obj.appointment.serviceorder_set.all()
        return sum(float(order.service.price) for order in orders if order.service and order.service.price)

    def get_amount(self, obj):
        return sum(
            float(t.amount) for t in obj.transaction_set.all()
            if t.status == "SUCCESS"
        )
