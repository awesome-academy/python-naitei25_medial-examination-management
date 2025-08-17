import payos
import logging
from django.conf import settings
from django.db import transaction as django_transaction
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from appointments.models import Appointment 

from .models import Bill, BillDetail, Transaction
from .serializers import TransactionDTOSerializer
from common.enums import PaymentStatus, TransactionStatus, ServiceType, PaymentMethod, AppointmentStatus # THÊM AppointmentStatus
from appointments.serializers import AppointmentSerializer

logger = logging.getLogger(__name__)

class BillService:
    def get_all_bills(self, page, size, sort_by='created_at', sort_order='desc'):
        if page <= 0:
            raise ValueError(_("Số trang không được nhỏ hơn hoặc bằng 0"))
        if size < 1 or size > 100:
            size = 10
        valid_sort_fields = ['created_at', 'total_cost', 'amount', 'status']
        if sort_by not in valid_sort_fields:
            sort_by = 'created_at'
        order_prefix = '-' if sort_order.lower() == 'desc' else ''
        return Bill.objects.all().order_by(f"{order_prefix}{sort_by}")[(page - 1) * size:page * size]

    @django_transaction.atomic
    def create_bill(self, data):
        bill = Bill(
            appointment_id=data['appointment_id'],
            patient_id=data['patient_id'],
            total_cost=0,   # sẽ tính lại
            insurance_discount=data['insurance_discount'],
            amount=0,
            status=data['status']
        )
        bill.save()

        # Nếu có bill_details (luồng admin)
        if data.get('bill_details'):
            bill_details = [
                BillDetail(
                    bill=bill,
                    item_type=detail_data['item_type'],
                    quantity=detail_data['quantity'],
                    unit_price=detail_data['unit_price'],
                    insurance_discount=detail_data['insurance_discount'] or 0,
                    total_price=detail_data['unit_price'] * detail_data['quantity']
                )
                for detail_data in data['bill_details']
            ]
            BillDetail.objects.bulk_create(bill_details)

            # ✅ Tính lại tổng tiền từ bill_details
            bill_details_qs = bill.details.all()
            bill.total_cost = sum(d.total_price for d in bill_details_qs)
            bill.insurance_discount = sum(d.insurance_discount or 0 for d in bill_details_qs)
            bill.amount = bill.total_cost - (bill.insurance_discount or 0)

        else:
            # ✅ Luồng booking (bệnh nhân đặt lịch, chưa có service)
            appointment = Appointment.objects.get(pk=data['appointment_id'])
            doctor_price = getattr(appointment.doctor, "price", 0) or 0
            booking_fee = getattr(appointment, "booking_fee", 0) or 0

            base_price = booking_fee if booking_fee > 0 else doctor_price

            bill.total_cost = base_price
            bill.insurance_discount = 0   # sau này nếu có tính bảo hiểm thì set vào đây
            bill.amount = base_price - bill.insurance_discount

        bill.save()
        return bill

    @django_transaction.atomic
    def update_bill(self, id, data):
        bill = get_object_or_404(Bill, pk=id)
        for key, value in data.items():
            if value is not None:
                setattr(bill, key, value)
        bill.save()
        return bill

    def get_bill_by_id(self, id):
        return get_object_or_404(Bill, pk=id)

    def delete_bill(self, id):
        bill = get_object_or_404(Bill, pk=id)
        bill.delete()

    @django_transaction.atomic
    def create_bill_detail(self, bill_id, data):
        bill = get_object_or_404(Bill, pk=bill_id)
        bill_details = [
            BillDetail(
                bill=bill,
                item_type=detail_data['item_type'],
                quantity=detail_data['quantity'],
                unit_price=detail_data['unit_price'],
                insurance_discount=detail_data['insurance_discount'] or 0,
                total_price=detail_data['unit_price'] * detail_data['quantity']
            )
            for detail_data in data
        ]
        if bill_details:
            BillDetail.objects.bulk_create(bill_details)
        bill_details_qs = bill.details.all()
        bill.total_cost = sum(d.total_price for d in bill_details_qs)
        bill.insurance_discount = sum(d.insurance_discount or 0 for d in bill_details_qs)
        bill.amount = bill.total_cost - (bill.insurance_discount or 0)
        bill.save()
        return bill

    def get_detail_by_bill(self, bill_id):
        bill = get_object_or_404(Bill, pk=bill_id)
        details = bill.details.all()
        if not details.exists():
            raise ValueError(_("Không tìm thấy chi tiết hóa đơn"))
        return details

    def get_bills_by_patient_id(self, patient_id):
        return Bill.objects.filter(patient_id=patient_id)

class PayOSService:
    def __init__(self):
        payos_config = settings.PAYOS
        self.payos = payos.PayOS(client_id=payos_config['client_id'], 
                            api_key=payos_config['api_key'], 
                            checksum_key=payos_config['checksum_key'])

    def create_payment_link(self, bill_id):
        bill = get_object_or_404(Bill, pk=bill_id)
        
        if bill.status == PaymentStatus.PAID.value:
            raise ValueError(_("Hóa đơn đã được thanh toán"))
            # Tính số tiền cần thanh toán (booking fee hoặc doctor.price)
        # ✅ Luôn dùng bill.amount đã tính sẵn (có discount)
        amount = int(bill.amount or 0)

        if amount <= 0:
            raise ValueError(_("Số tiền thanh toán không hợp lệ"))


        item = payos.ItemData(name=f"Hóa đơn #{bill_id}", quantity=1, price=amount)
        order_code = int(bill_id) * 1000 + (int(timezone.now().timestamp()) % 1000)

        payment_data = payos.PaymentData(
            orderCode=order_code,
            description=f"Thanh toán hóa đơn #{bill_id}",
            amount=amount,
            cancelUrl=f"{settings.PAYMENT_CANCEL_URL}/{bill_id}/cancel",
            returnUrl=f"{settings.PAYMENT_SUCCESS_URL}/{bill_id}/success",
            items=[item]
        )

        response = self.payos.createPaymentLink(paymentData=payment_data)

        # Ghi transaction với số tiền đúng
        transaction = Transaction.objects.create(
            bill=bill,
            amount=amount,
            payment_method=PaymentMethod.ONLINE_BANKING.value,
            transaction_date=timezone.now(),
            status=TransactionStatus.PENDING.value
        )

        return response.checkoutUrl


    def handle_payment_callback(self, webhook_data):
        try:
            data = self.payos.verifyPaymentWebhookData(webhook_data)
    
            bill_id = data.orderCode // 1000
            bill = get_object_or_404(Bill, pk=bill_id)
            transaction = Transaction.objects.filter(bill=bill).order_by('-created_at').first()

            logger.info(f"Processing webhook for bill_id: {bill_id}, orderCode: {data.orderCode}")

            is_success = (
                webhook_data.get('success') is True or 
                getattr(data, 'status', '') == 'PAID' or
                webhook_data.get('status') == 'PAID'
            )

            paid_amount = int(transaction.amount or 0)

            if is_success:
                if paid_amount == int(bill.amount) and bill.details.count() == 0:
                    bill.status = PaymentStatus.BOOKING_PAID.value
                    if bill.appointment_id:
                        appointment = get_object_or_404(Appointment, pk=bill.appointment_id)
                        appointment.status = AppointmentStatus.CONFIRMED.value
                        appointment.save()
                    logger.info(f"Bill {bill_id} set to BOOKING_PAID and appointment confirmed.")
                elif paid_amount >= int(bill.amount):
                    bill.status = PaymentStatus.PAID.value
                    logger.info(f"Bill {bill_id} set to PAID.")

                if transaction:
                    transaction.status = TransactionStatus.SUCCESS.value
            else:
                if transaction:
                    transaction.status = TransactionStatus.FAILED.value
                logger.info(f"Payment failed for bill {bill_id}")

            bill.save()
            if transaction:
                transaction.save()

            return data
        except Exception as e:
            logger.error(f"Error in handle_payment_callback: {str(e)}")
            raise


    def get_payment_info(self, order_id):
            try:
                logger.info(f"Retrieving payment info for order_id {order_id}")
                result = self.payos.getPaymentLinkInformation(orderId=order_id)

                # Trích xuất bill_id từ order_id
                bill_id_from_order = int(order_id) // 1000
                
                bill = get_object_or_404(Bill, id=bill_id_from_order) 
                appointment = Appointment.objects.filter(id=bill.appointment_id).first()
                
                result_dict = {
                    'orderCode': getattr(result, 'orderCode', None),
                    'status': getattr(result, 'status', None),
                    'amount': bill.amount,
                    # Lấy description từ đối tượng result của PayOS
                    'description': getattr(result, 'description', f"Thanh toán hóa đơn #{bill_id_from_order}"), 
                    'createdAt': bill.created_at.isoformat(),
                    'appointment': AppointmentSerializer(appointment).data if appointment else None
                }
                logger.info(f"Payment info retrieved for order_id {order_id}: {result_dict}")
                return result_dict
            except Exception as e:
                logger.error(f"Error retrieving payment info for order_id {order_id}: {str(e)}")
                raise ValueError(_("Lỗi khi lấy thông tin thanh toán: {error}").format(error=str(e)))

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
            raise ValueError(_("Lỗi khi hủy thanh toán: {error}").format(error=str(e)))

class TransactionService:
    def create_payment_link(self, bill_id):
        return PayOSService().create_payment_link(bill_id)

    @django_transaction.atomic
    def process_cash_payment(self, bill_id):
        bill = get_object_or_404(Bill, pk=bill_id)

        booking_fee = int(getattr(bill.appointment, "booking_fee", 0) or 0)
        service_fee = int(sum(
            float(o.service.price)
            for o in bill.appointment.serviceorder_set.all()
            if o.service and o.service.price
        ))

        # 🔹 Nếu bill chưa trả booking thì không cho thanh toán cash
        if bill.status == PaymentStatus.UNPAID.value:
            raise ValueError(_("Hóa đơn chưa thanh toán phí đặt chỗ (không thể trả tiền mặt)"))

        # 🔹 Nếu bill đã trả full rồi thì không cho trả tiếp
        if bill.status == PaymentStatus.PAID.value:
            raise ValueError(_("Hóa đơn đã được thanh toán đầy đủ"))

        # 🔹 Nếu bill đang BOOKING_PAID → chỉ cần trả service fee
        if bill.status == PaymentStatus.BOOKING_PAID.value:
            if service_fee <= 0:
                raise ValueError(_("Không có phí dịch vụ để thanh toán"))

            Transaction.objects.create(
                bill=bill,
                amount=service_fee,
                payment_method=PaymentMethod.CASH.value,
                transaction_date=timezone.now(),
                status=TransactionStatus.SUCCESS.value
            )

            # Cập nhật bill thành PAID
            bill.status = PaymentStatus.PAID.value
            bill.save(update_fields=["status"])
            return bill

        # 🔹 Nếu status khác thì báo lỗi
        raise ValueError(_("Trạng thái hóa đơn không hợp lệ để thanh toán tiền mặt"))

    @django_transaction.atomic
    def handle_payment_success(self, order_id):
        bill_id = int(order_id) // 1000 if int(order_id) > 1000 else int(order_id)
        bill = get_object_or_404(Bill, pk=bill_id)
        transaction = Transaction.objects.filter(bill=bill).order_by('-created_at').first()

        if not transaction or transaction.status != TransactionStatus.PENDING.value:
            logger.warning(f"Payment success handler called for order {order_id} but transaction not in PENDING state or not found.")
            return

        paid_amount = int(transaction.amount or 0)

        if paid_amount == int(bill.amount) and bill.details.count() == 0:
            bill.status = PaymentStatus.BOOKING_PAID.value
            if bill.appointment_id:
                appointment = get_object_or_404(Appointment, pk=bill.appointment_id)
                appointment.status = AppointmentStatus.CONFIRMED.value
                appointment.save()
            logger.info(f"Bill {bill.id} set to BOOKING_PAID and appointment confirmed by booking payment.")
        elif paid_amount >= int(bill.amount):
            bill.status = PaymentStatus.PAID.value
            logger.info(f"Bill {bill.id} set to PAID by full payment.")


        transaction.status = TransactionStatus.SUCCESS.value
        bill.save()
        transaction.save()


    def handle_payment_cancel(self, order_id):
        bill = get_object_or_404(Bill, pk=order_id)
        transaction = Transaction.objects.filter(bill=bill).order_by('-created_at').first()
        if transaction and transaction.status == TransactionStatus.PENDING.value:
            transaction.status = TransactionStatus.FAILED.value
            transaction.save()

    def get_transactions_by_bill_id(self, bill_id, sort_by='transaction_date', sort_order='desc'):
        try:
            if not Bill.objects.filter(id=bill_id).exists():
                logger.error(f"Bill not found for bill_id={bill_id}")
                raise Http404(_("Không tìm thấy hóa đơn"))
            
            valid_sort_fields = ['transaction_date', 'amount', 'status', 'created_at', 'updated_at']
            if sort_by not in valid_sort_fields:
                sort_by = 'transaction_date'
            
            order_prefix = '-' if sort_order.lower() == 'desc' else ''
            transactions = Transaction.objects.filter(bill_id=bill_id).order_by(f"{order_prefix}{sort_by}")
            
            logger.info(f"Retrieved {transactions.count()} transactions for bill_id={bill_id}, sorted by {sort_by} {sort_order}")
            return [TransactionDTOSerializer(t).data for t in transactions]
        except Http404:
            raise
        except ValueError as e:
            logger.error(f"Error retrieving transactions for bill_id={bill_id}: {str(e)}")
            raise ValueError(_("Lỗi khi lấy giao dịch: {error}").format(error=str(e)))
