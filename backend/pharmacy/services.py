from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404
from django.utils.translation import gettext as _
from .models import Prescription, PrescriptionDetail, Medicine
from patients.models import Patient
from doctors.models import Doctor
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
import os

class PharmacyService:
    def __init__(self):
        # Register Vietnamese-supporting font
        font_path = os.path.join(os.path.dirname(__file__), 'static', 'fonts', 'NotoSans-Regular.ttf')
        pdfmetrics.registerFont(TTFont('NotoSans', font_path))

    def create_prescription(self, data):
        try:
            prescription = Prescription(
                appointment_id=data['appointment_id'],
                patient_id=data['patient_id'],
                follow_up_date=data.get('follow_up_date'),
                is_follow_up=data.get('is_follow_up', False),
                diagnosis=data['diagnosis'],
                systolic_blood_pressure=data['systolic_blood_pressure'],
                diastolic_blood_pressure=data['diastolic_blood_pressure'],
                heart_rate=data['heart_rate'],
                blood_sugar=data['blood_sugar'],
                note=data.get('note', '')
            )
            prescription.save()
            if 'prescription_details' in data and data['prescription_details']:
                for detail_data in data['prescription_details']:
                    try:
                        medicine = Medicine.objects.get(pk=detail_data['medicine_id'])
                        PrescriptionDetail.objects.create(
                            prescription=prescription,
                            medicine=medicine,
                            dosage=detail_data['dosage'],
                            frequency=detail_data['frequency'],
                            duration=detail_data['duration'],
                            prescription_notes=detail_data.get('prescription_notes', ''),
                            quantity=detail_data['quantity']
                        )
                    except Medicine.DoesNotExist:
                        raise ValueError(_("Không tìm thấy thuốc với ID: {medicine_id}").format(medicine_id=detail_data['medicine_id']))
            return prescription
        except Exception as e:
            raise ValueError(_("Lỗi khi tạo đơn thuốc: {error}").format(error=str(e)))

    def update_prescription(self, id, data):
        prescription = self.get_prescription_by_id(id)
        for key, value in data.items():
            if key != 'prescription_details' and value is not None and getattr(prescription, key) != value:
                setattr(prescription, key, value)
        if 'prescription_details' in data and data['prescription_details']:
            prescription.prescription_details.all().delete()
            for detail_data in data['prescription_details']:
                try:
                    medicine = Medicine.objects.get(pk=detail_data['medicine_id'])
                    PrescriptionDetail.objects.create(
                        prescription=prescription,
                        medicine=medicine,
                        dosage=detail_data['dosage'],
                        frequency=detail_data['frequency'],
                        duration=detail_data['duration'],
                        prescription_notes=detail_data.get('prescription_notes', ''),
                        quantity=detail_data['quantity']
                    )
                except Medicine.DoesNotExist:
                    raise ValueError(_("Không tìm thấy thuốc với ID: {medicine_id}").format(medicine_id=detail_data['medicine_id']))
        prescription.save()
        return prescription

    def delete_prescription(self, id):
        prescription = self.get_prescription_by_id(id)
        prescription.delete()

    def add_medicine_to_prescription(self, data):
        try:
            prescription = self.get_prescription_by_id(data['prescription_id'])
            medicine = Medicine.objects.get(pk=data['medicine_id'])
            detail = PrescriptionDetail(
                prescription=prescription,
                medicine=medicine,
                dosage=data['dosage'],
                frequency=data['frequency'],
                duration=data['duration'],
                prescription_notes=data.get('prescription_notes', ''),
                quantity=data['quantity']
            )
            detail.save()
            return detail
        except Medicine.DoesNotExist:
            raise ValueError(_("Không tìm thấy thuốc với ID: {medicine_id}").format(medicine_id=data['medicine_id']))
        except Exception as e:
            raise ValueError(_("Lỗi khi thêm thuốc vào đơn: {error}").format(error=str(e)))

    def get_prescription_details(self, prescription_id):
        prescription = self.get_prescription_by_id(prescription_id)
        return prescription.prescription_details.all()

    def update_prescription_detail(self, detail_id, data):
        detail = self.get_prescription_detail_by_id(detail_id)
        for key, value in data.items():
            if key != 'detail_id' and value is not None and getattr(detail, key) != value:
                setattr(detail, key, value)
        detail.save()
        return detail

    def delete_prescription_detail(self, detail_id):
        detail = self.get_prescription_detail_by_id(detail_id)
        detail.delete()

    def get_prescriptions_by_patient_id(self, patient_id):
        try:
            return Prescription.objects.filter(patient_id=patient_id)
        except Exception as e:
            raise ValueError(_("Lỗi khi lấy đơn thuốc theo patient_id: {error}").format(error=str(e)))

    def get_prescriptions_by_appointment_id(self, appointment_id):
        try:
            return Prescription.objects.filter(appointment_id=appointment_id)
        except Exception as e:
            raise ValueError(_("Lỗi khi lấy đơn thuốc theo appointment_id: {error}").format(error=str(e)))

    def get_prescription_by_id(self, id):
        try:
            return Prescription.objects.get(pk=id)
        except Prescription.DoesNotExist:
            raise Http404(_("Không tìm thấy đơn thuốc với ID: {id}").format(id=str(id)))

    def get_prescription_detail_by_id(self, id):
        try:
            return PrescriptionDetail.objects.get(pk=id)
        except PrescriptionDetail.DoesNotExist:
            raise Http404(_("Không tìm thấy chi tiết đơn thuốc với ID: {id}").format(id=str(id)))

    def add_new_medicine(self, data):
        try:
            if data['insurance_discount_percent'] < 0 or data['insurance_discount_percent'] > 1:
                raise ValueError(_("Phần trăm giảm giá phải từ 0 đến 1"))
            medicine = Medicine(
                medicine_name=data['medicine_name'],
                manufactor=data.get('manufactor'),
                category=data['category'],
                description=data.get('description'),
                usage=data['usage'],
                unit=data['unit'],
                insurance_discount_percent=data['insurance_discount_percent'],
                price=data['price'],
                quantity=data.get('quantity'),
                side_effects=data.get('side_effects')
            )
            medicine.save()
            return medicine
        except Exception as e:
            raise ValueError(_("Lỗi khi thêm thuốc mới: {error}").format(error=str(e)))

    def get_all_medicines(self):
        return Medicine.objects.all()

    def get_medicine_by_id(self, id):
        try:
            return Medicine.objects.get(pk=id)
        except Medicine.DoesNotExist:
            raise Http404(_("Không tìm thấy thuốc với ID: {id}").format(id=str(id)))

    def search_medicine(self, name, category):
        if name and category:
            return Medicine.objects.filter(medicine_name__icontains=name, category__icontains=category)
        elif name:
            return Medicine.objects.filter(medicine_name__icontains=name)
        elif category:
            return Medicine.objects.filter(category__icontains=category)
        return Medicine.objects.all()

    def update_medicine(self, id, data):
        medicine = self.get_medicine_by_id(id)
        for key, value in data.items():
            if value is not None and getattr(medicine, key) != value:
                setattr(medicine, key, value)
        if 'insurance_discount_percent' in data and data['insurance_discount_percent'] is not None:
            if data['insurance_discount_percent'] < 0 or data['insurance_discount_percent'] > 1:
                raise ValueError(_("Phần trăm giảm giá phải từ 0 đến 1"))
            medicine.insurance_discount = medicine.price * medicine.insurance_discount_percent / 100
        medicine.save()
        return medicine

    def delete_medicine(self, id):
        medicine = self.get_medicine_by_id(id)
        if PrescriptionDetail.objects.filter(medicine=medicine).exists():
            raise ValueError(_("Không thể xóa thuốc đã được kê trong đơn thuốc"))
        medicine.delete()

    def generate_prescription_pdf(self, prescription_id):
        prescription = self.get_prescription_by_id(prescription_id)
        try:
            patient = Patient.objects.get(pk=prescription.patient_id)
            doctor = Doctor.objects.get(pk=prescription.appointment.doctor_id)
        except (Patient.DoesNotExist, Doctor.DoesNotExist) as e:
            raise ValueError(_("Không tìm thấy thông tin bệnh nhân hoặc bác sĩ: {error}").format(error=str(e)))
        
        pdf_dto = {
            'patient_id': patient.id,
            'patient_name': f"{patient.last_name} {patient.first_name}",
            'patient_gender': patient.gender,
            'patient_birthday': patient.birthday,
            'patient_phone': patient.user.phone,
            'patient_email': patient.user.email,
            'patient_address': patient.address or '',
            'patient_identity_number': patient.identity_number,
            'patient_insurance_number': patient.insurance_number,
            'doctor_name': f"{doctor.last_name} {doctor.first_name}",
            'doctor_specialization': doctor.specialization,
            'doctor_academic_degree': doctor.academic_degree or '',
            'doctor_department': getattr(doctor, 'department', ''),
            'prescription_date': prescription.created_at.date(),
            'diagnosis': prescription.diagnosis,
            'systolic_blood_pressure': prescription.systolic_blood_pressure,
            'diastolic_blood_pressure': prescription.diastolic_blood_pressure,
            'heart_rate': prescription.heart_rate,
            'blood_sugar': prescription.blood_sugar,
            'note': prescription.note or '',
            'follow_up_date': prescription.follow_up_date,
            'follow_up': prescription.is_follow_up,
            'prescription_details': [
                {
                    'medicine_name': d.medicine.medicine_name,
                    'unit': d.medicine.unit,
                    'dosage': d.dosage,
                    'frequency': d.frequency,
                    'duration': d.duration,
                    'prescription_notes': d.prescription_notes or '',
                    'quantity': d.quantity
                } for d in prescription.prescriptiondetail_set.all()
            ]
        }

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        title_style.alignment = 1  # Center
        title_style.fontName = 'NotoSans'  # Use the registered Vietnamese font
        elements.append(Paragraph(_("ĐƠN THUỐC"), title_style))

        # Thông tin bệnh nhân
        data = [
            [_('Họ và tên:'), pdf_dto['patient_name']],
            [_('Giới tính:'), pdf_dto['patient_gender']],
            [_('Ngày sinh:'), pdf_dto['patient_birthday'].strftime('%d/%m/%Y')],
            [_('Số điện thoại:'), pdf_dto['patient_phone']],
            [_('Email:'), pdf_dto['patient_email']],
            [_('Địa chỉ:'), pdf_dto['patient_address']],
            [_('CMND/CCCD:'), pdf_dto['patient_identity_number']],
            [_('Số BHYT:'), pdf_dto['patient_insurance_number']]
        ]
        table = Table(data, colWidths=[150, 350])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'NotoSans'),  # Use Vietnamese font for headers
            ('FONTNAME', (0, 1), (-1, -1), 'NotoSans'),  # Use Vietnamese font for data
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(table)

        # Thông tin khám bệnh
        data = [
            [_('Chẩn đoán:'), pdf_dto['diagnosis']],
            [_('Huyết áp:'), f"{pdf_dto['systolic_blood_pressure']}/{pdf_dto['diastolic_blood_pressure']} mmHg"],
            [_('Nhịp tim:'), f"{pdf_dto['heart_rate']} bpm"],
            [_('Đường huyết:'), f"{pdf_dto['blood_sugar']} mg/dL"]
        ]
        if pdf_dto['note']:
            data.append([_('Ghi chú:'), pdf_dto['note']])
        table = Table(data, colWidths=[150, 350])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'NotoSans'),  # Use Vietnamese font for headers
            ('FONTNAME', (0, 1), (-1, -1), 'NotoSans'),  # Use Vietnamese font for data
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(table)

        # Chi tiết đơn thuốc
        data = [[_('STT'), _('Tên thuốc'), _('Đơn vị'), _('Liều dùng'), _('Tần suất'), _('Thời gian'), _('Số lượng')]]
        for i, detail in enumerate(pdf_dto['prescription_details'], 1):
            data.append([
                str(i), detail['medicine_name'], detail['unit'], detail['dosage'],
                detail['frequency'], detail['duration'], str(detail['quantity'])
            ])
        table = Table(data, colWidths=[50, 100, 70, 80, 80, 80, 80])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'NotoSans'),  # Use Vietnamese font for headers
            ('FONTNAME', (0, 1), (-1, -1), 'NotoSans'),  # Use Vietnamese font for data
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(table)

        # Thông tin tái khám
        if pdf_dto['follow_up'] and pdf_dto['follow_up_date']:
            follow_up_style = styles['Normal'].clone('FollowUpStyle')
            follow_up_style.fontName = 'NotoSans'  # Use Vietnamese font
            elements.append(Paragraph(_("Lịch tái khám: {date}").format(date=pdf_dto['follow_up_date'].strftime('%d/%m/%Y')), follow_up_style))

        # Thông tin bác sĩ
        doctor_style = ParagraphStyle(name='RightAlign', parent=styles['Normal'], alignment=2)
        doctor_style.fontName = 'NotoSans'  # Use Vietnamese font
        elements.append(Paragraph(_("Bác sĩ kê đơn"), doctor_style))
        doctor_name_style = ParagraphStyle(name='RightAlignBold', parent=styles['Normal'], alignment=2)
        doctor_name_style.fontName = 'NotoSans'  # Use Vietnamese font
        elements.append(Paragraph(pdf_dto['doctor_name'], doctor_name_style))
        doctor_info_style = ParagraphStyle(name='RightAlign', parent=styles['Normal'], alignment=2)
        doctor_info_style.fontName = 'NotoSans'  # Use Vietnamese font
        doctor_info = pdf_dto['doctor_specialization']
        if pdf_dto['doctor_department']:
            doctor_info += f" - {pdf_dto['doctor_department']}"
        elements.append(Paragraph(doctor_info, doctor_info_style))

        doc.build(elements)
        buffer.seek(0)
        return buffer