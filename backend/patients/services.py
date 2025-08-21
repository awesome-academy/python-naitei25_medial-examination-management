from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from .models import Patient, EmergencyContact
import cloudinary.uploader
class PatientService:
    def create_patient(self, data):
        # Logic tạo patient từ CreatePatientRequest
        user_data = {
            'email': data['email'],
            'phone': data['phone'],
            'password': data['password']
        }
        # Tạo User trước
        with transaction.atomic():
            from users.services import UserService
            # Thêm role cho user_data
            user_data['role'] = 'P'
            user_response = UserService().add_user(user_data)
            # Lấy user object từ response
            from users.models import User
            user = User.objects.get(id=user_response['id'])
            
            patient = Patient.objects.create(
                user=user,
                identity_number=data['identity_number'],
                insurance_number=data['insurance_number'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                birthday=data['birthday'],
                gender=data['gender'],
                address=data.get('address'),
                allergies=data.get('allergies'),
                height=data.get('height'),
                weight=data.get('weight'),
                blood_type=data.get('bloodType'),  # Fix field name mapping
            )
            
            # Debug: Print emergency contacts data
            emergency_contacts = data.get('emergencyContactDtos', [])
            print(f"Emergency contacts to create: {emergency_contacts}")
            
            for contact_data in emergency_contacts:
                print(f"Creating emergency contact: {contact_data}")
                EmergencyContact.objects.create(
                    patient=patient,
                    contact_name=contact_data['contact_name'],
                    contact_phone=contact_data['contact_phone'],
                    relationship=contact_data['relationship']
                )

        return patient
    
    def upload_avatar(self, patient, file):
        try:
            # Upload file lên Cloudinary
            upload_result = cloudinary.uploader.upload(
                file,
                folder=f"patients/{patient.id}/avatars",
                resource_type="image",
                public_id=f"avatar_{patient.id}"
            )
            patient.avatar = upload_result['secure_url']
            patient.save()
            return patient
        except Exception as e:
            raise Exception(f"Không thể upload ảnh: {str(e)}")

    def delete_avatar(self, patient):
        try:
            if patient.avatar:
                public_id = f"patients/{patient.id}/avatars/avatar_{patient.id}"
                cloudinary.uploader.destroy(public_id, resource_type="image")
                patient.avatar = None
                patient.save()
            return patient
        except Exception as e:
            raise Exception(f"Không thể xóa ảnh: {str(e)}")

    def delete_patient(self, patient):
        """Delete patient by soft deleting the associated user and hard deleting related data"""
        try:
            with transaction.atomic():
                # Hard delete emergency contacts since they don't have soft deletion fields
                EmergencyContact.objects.filter(patient=patient).delete()
                
                # Hard delete patient record since it doesn't have soft deletion fields
                patient.delete()
                
                # Soft delete the associated user (this updates users table with is_deleted=True and deleted_at)
                user = patient.user
                user.soft_delete()
                
            return patient
        except Exception as e:
            raise Exception(f"Không thể xóa bệnh nhân: {str(e)}")


class EmergencyContactService:
    def create_emergency_contact(self, patient_id, data):
        patient = Patient.objects.get(pk=patient_id)
        contact = EmergencyContact.objects.create(
            patient=patient,
            contact_name=data['contact_name'],
            contact_phone=data['contact_phone'],
            relationship=data['relationship']
        )
        return contact

    def get_all_emergency_contacts(self, patient_id):
        return EmergencyContact.objects.filter(patient_id=patient_id).order_by("contact_name")

    def get_contact_by_id_and_patient_id(self, contact_id, patient_id):
        return get_object_or_404(
            EmergencyContact,
            contact_id=contact_id,
            patient_id=patient_id
        )

    def update_emergency_contact(self, contact_id, patient_id, data):
        contact = self.get_contact_by_id_and_patient_id(contact_id, patient_id)
        for key, value in data.items():
            setattr(contact, key, value)
        contact.save()
        return contact

    def delete_emergency_contact(self, contact_id, patient_id):
        contact = self.get_contact_by_id_and_patient_id(contact_id, patient_id)
        contact.delete()
