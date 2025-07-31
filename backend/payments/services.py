
from django.conf import settings
import payos
from .models import Bill, BillDetail, Transaction
from common.enums import PaymentStatus, TransactionStatus, ServiceType, PaymentMethod
from .serializers import TransactionDTOSerializer
from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404
from django.db import transaction as django_transaction
from django.utils import timezone
from payos import PayOS, ItemData, PaymentData
import logging

logger = logging.getLogger(__name__)
class BillService:
    def get_all_bills(self, page, size):
        if page <= 0:
            raise ValueError("Số trang không được nhỏ hơn hoặc bằng 0")
        if size < 1 or size > 100:
            size = 10
        return Bill.objects.all()[(page - 1) * size:page * size]

    @django_transaction.atomic
    def create_bill(self, data):
        bill = Bill(
            appointment_id=data['appointment_id'],
            patient_id=data['patient_id'],
            total_cost=data['total_cost'],
            insurance_discount=data['insurance_discount'],
            amount=data['amount'],
            status=data['status']
        )
        bill.save()
        for detail_data in data.get('bill_details', []):
            BillDetail.objects.create(
                bill=bill,
                item_type=detail_data['item_type'],
                quantity=detail_data['quantity'],
                unit_price=detail_data['unit_price'],
                insurance_discount=detail_data['insurance_discount'] or 0,
                total_price=detail_data['unit_price'] * detail_data['quantity']
            )
        bill.total_cost = sum(d.total_price for d in bill.details.all())
        bill.insurance_discount = sum(d.insurance_discount or 0 for d in bill.details.all())
        bill.amount = bill.total_cost - (bill.insurance_discount or 0)
        bill.save()
        return bill

    @django_transaction.atomic
    def update_bill(self, id, data):
        bill = self.get_bill_by_id(id)
        for key, value in data.items():
            if value is not None:
                setattr(bill, key, value)
        bill.save()
        return bill

    def get_bill_by_id(self, id):
        try:
            return Bill.objects.get(pk=id)
        except Bill.DoesNotExist:
            raise Http404

    def delete_bill(self, id):
        bill = self.get_bill_by_id(id)
        bill.delete()

    @django_transaction.atomic
    def create_bill_detail(self, bill_id, data):
        bill = self.get_bill_by_id(bill_id)
        for detail_data in data:
            detail = BillDetail(
                bill=bill,
                item_type=detail_data['item_type'],
                quantity=detail_data['quantity'],
                unit_price=detail_data['unit_price'],
                insurance_discount=detail_data['insurance_discount'] or 0,
                total_price=detail_data['unit_price'] * detail_data['quantity']
            )
            detail.save()
        bill.total_cost = sum(d.total_price for d in bill.details.all())
        bill.insurance_discount = sum(d.insurance_discount or 0 for d in bill.details.all())
        bill.amount = bill.total_cost - (bill.insurance_discount or 0)
        bill.save()
        return bill

    def get_detail_by_bill(self, bill_id):
        bill = self.get_bill_by_id(bill_id)
        return bill.details.all()

    def get_bills_by_patient_id(self, patient_id):
        return Bill.objects.filter(patient_id=patient_id)

class PayOSService:
    def __init__(self):
        payos_config = settings.PAYOS
        self.payos = PayOS(client_id=payos_config['client_id'], 
                          api_key=payos_config['api_key'], 
                          checksum_key=payos_config['checksum_key'])

    def create_payment_link(self, bill_id):
        bill_id = int(bill_id)  # Ensure bill_id is integer
        bill = Bill.objects.get(pk=bill_id)
        
        if bill.status == PaymentStatus.PAID.value:
            raise ValueError("Hóa đơn đã được thanh toán")
        if not bill.amount or bill.amount <= 0:
            raise ValueError("Số tiền thanh toán không hợp lệ")

        # Cancel existing pending transaction
        existing_transaction = Transaction.objects.filter(bill=bill).order_by('-created_at').first()
        if existing_transaction and existing_transaction.status == TransactionStatus.PENDING.value:
            try:
                # Correct method name: cancelPaymentLink
                self.payos.cancelPaymentLink(orderId=bill_id)
            except Exception as e:
                print(f"Error canceling old payment link: {str(e)}")
            existing_transaction.status = TransactionStatus.FAILED.value
            existing_transaction.save()

        # Create payment data
        item = ItemData(name=f"Hóa đơn #{bill_id}", quantity=1, price=int(bill.amount))
        order_code = int(bill_id) * 1000 + (int(timezone.now().timestamp()) % 1000)
        
        payment_data = PaymentData(
            orderCode=order_code,
            description=f"Thanh toán hóa đơn #{bill_id}",
            amount=int(bill.amount),
            cancelUrl=f"http://yourdomain.com/payment/transactions/{bill_id}/cancel",
            returnUrl=f"http://yourdomain.com/payment/transactions/{bill_id}/success",
            items=[item]
        )

        # Correct method name: createPaymentLink
        response = self.payos.createPaymentLink(paymentData=payment_data)
        
        # Create transaction record
        transaction = Transaction.objects.create(
            bill=bill,
            amount=bill.amount,
            payment_method=PaymentMethod.ONLINE_BANKING.value,
            transaction_date=timezone.now(),
            status=TransactionStatus.PENDING.value
        )
        
        # Return checkout URL (check response structure)
        return response.checkoutUrl

    def handle_payment_callback(self, webhook_data):
        # Correct method name: verifyPaymentWebhookData
        data = self.payos.verifyPaymentWebhookData(webhook_data)
        bill = Bill.objects.get(pk=data.orderCode)
        transaction = Transaction.objects.filter(bill=bill).order_by('-created_at').first()
        
        if webhook_data.get('success'):
            bill.status = PaymentStatus.PAID.value
            transaction.status = TransactionStatus.SUCCESS.value
        else:
            transaction.status = TransactionStatus.FAILED.value
        
        bill.save()
        transaction.save()
        return data

    def get_payment_info(self, order_id):
        try:
            result = self.payos.getPaymentLinkInformation(orderId=order_id)
            result_dict = {
                'orderCode': getattr(result, 'orderCode', None),
                'status': getattr(result, 'status', None),
                'amount': getattr(result, 'amount', None),
                'description': getattr(result, 'description', None),
                'createdAt': getattr(result, 'createdAt', None),
            }
            logger.info(f"Payment info retrieved for order_id {order_id}: {result_dict}")
            return result_dict
        except Exception as e:
            logger.error(f"Error retrieving payment info for order_id {order_id}: {str(e)}")
            raise ValueError(f"Lỗi khi lấy thông tin thanh toán: {str(e)}")

    def cancel_payment(self, order_id):
        try:
            result = self.payos.cancelPaymentLink(orderId=order_id)
            result_dict = {
                'orderCode': getattr(result, 'orderCode', None),
                'status': getattr(result, 'status', None),
            }
            logger.info(f"Payment canceled successfully for order_id {order_id}: {result_dict}")
            return result_dict
        except Exception as e:
            logger.error(f"Error canceling payment for order_id {order_id}: {str(e)}")
            raise ValueError(f"Lỗi khi hủy thanh toán: {str(e)}")

class TransactionService:
    def create_payment_link(self, bill_id):
        return PayOSService().create_payment_link(bill_id)

    @django_transaction.atomic
    def process_cash_payment(self, bill_id):
        try:
            bill = Bill.objects.get(pk=bill_id)
            if bill.status == PaymentStatus.PAID.value:
                raise ValueError("Hóa đơn đã được thanh toán")
            
            transaction = Transaction(
                bill=bill,
                amount=bill.amount,
                payment_method=PaymentMethod.CASH.value,
                transaction_date=timezone.now(),
                status=TransactionStatus.SUCCESS.value
            )
            transaction.save()

            bill.status = PaymentStatus.PAID.value
            bill.save()
        except Bill.DoesNotExist:
            raise Http404("Không tìm thấy hóa đơn")
        except Exception as e:
            raise ValueError(f"Lỗi khi xử lý thanh toán tiền mặt: {str(e)}")

    def handle_payment_success(self, order_id):
        bill = Bill.objects.get(pk=order_id)
        transaction = Transaction.objects.filter(bill=bill).order_by('-created_at').first()
        if transaction and transaction.status == TransactionStatus.PENDING.value:
            bill.status = PaymentStatus.PAID.value
            transaction.status = TransactionStatus.SUCCESS.value
            bill.save()
            transaction.save()

    def handle_payment_cancel(self, order_id):
        bill = Bill.objects.get(pk=order_id)
        transaction = Transaction.objects.filter(bill=bill).order_by('-created_at').first()
        if transaction and transaction.status == TransactionStatus.PENDING.value:
            transaction.status = TransactionStatus.FAILED.value
            transaction.save()

    def get_transactions_by_bill_id(self, bill_id):
        transactions = Transaction.objects.filter(bill_id=bill_id)
        return [TransactionDTOSerializer(t).data for t in transactions]
