from django.test import TestCase
from django.utils import timezone
from datetime import date, time
from rest_framework import serializers
from doctors.models import Doctor, Department, ExaminationRoom, Schedule
from doctors.serializers import (
    DepartmentSerializer, ExaminationRoomSerializer, ScheduleSerializer,
    CreateDoctorRequestSerializer, DoctorSerializer, DoctorPartialUpdateSerializer,
    DoctorUpdateSerializer
)
from users.models import User
from common.enums import Gender, AcademicDegree, DoctorType, RoomType, Shift, UserRole
from common.constants import DOCTOR_LENGTH, COMMON_LENGTH, PATIENT_LENGTH, USER_LENGTH, DECIMAL_MAX_DIGITS, DECIMAL_DECIMAL_PLACES

class DepartmentSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.department = Department.objects.create(
            department_name="Cardiology",
            description="Heart-related treatments",
            avatar="https://example.com/avatar.jpg"
        )

    def test_serialize_department(self):
        serializer = DepartmentSerializer(self.department)
        expected_data = {
            'id': self.department.id,
            'department_name': "Cardiology",
            'description': "Heart-related treatments",
            'avatar': "https://example.com/avatar.jpg",
            'created_at': self.department.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        }
        self.assertEqual(serializer.data, expected_data)

    def test_validate_department(self):
        data = {
            'department_name': "Neurology",
            'description': "Brain-related treatments",
            'avatar': "https://example.com/neuro.jpg"
        }
        serializer = DepartmentSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        department = serializer.save()
        self.assertEqual(department.department_name, "Neurology")

class ExaminationRoomSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.department = Department.objects.create(department_name="Cardiology")
        cls.room = ExaminationRoom.objects.create(
            department=cls.department,
            type=RoomType.EXAMINATION.value,
            building="A",
            floor=1,
            note="Room 101"
        )

    def test_serialize_examination_room(self):
        serializer = ExaminationRoomSerializer(self.room)
        expected_data = {
            'roomId': self.room.id,
            'id': self.room.id,
            'department': self.department.id,
            'department_id': self.department.id,
            'type': RoomType.EXAMINATION.value,
            'building': "A",
            'floor': 1,
            'note': "Room 101",
            'created_at': self.room.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        }
        self.assertEqual(serializer.data, expected_data)

    def test_validate_examination_room(self):
        data = {
            'department': self.department.id,
            'type': RoomType.EXAMINATION.value,
            'building': "B",
            'floor': 2,
            'note': "Room 202"
        }
        serializer = ExaminationRoomSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        room = serializer.save()
        self.assertEqual(room.building, "B")
        self.assertEqual(room.floor, 2)

class ScheduleSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(email='testuser@example.com', password='testpass123')
        cls.department = Department.objects.create(department_name="Cardiology")
        cls.doctor = Doctor.objects.create(
            user=cls.user,
            first_name="John",
            last_name="Doe",
            identity_number="123456789",
            birthday=date(1980, 1, 1),
            gender=Gender.MALE.value,
            academic_degree=AcademicDegree.BS_CKI.value,
            specialization="Cardiologist",
            type=DoctorType.EXAMINATION.value,
            department=cls.department,
            price=100.00
        )
        cls.room = ExaminationRoom.objects.create(
            department=cls.department,
            type=RoomType.EXAMINATION.value,
            building="A",
            floor=1,
            note="Room 101"
        )
        cls.schedule = Schedule.objects.create(
            doctor=cls.doctor,
            room=cls.room,
            work_date=date(2025, 8, 26),
            start_time=time(8, 0),
            end_time=time(12, 0),
            shift=Shift.MORNING.value,
            max_patients=10,
            current_patients=0,
            status="AVAILABLE",
            default_appointment_duration_minutes=30
        )

    def test_serialize_schedule(self):
        serializer = ScheduleSerializer(self.schedule)
        expected_data = {
            'id': self.schedule.id,
            'work_date': "2025-08-26",
            'start_time': "08:00:00",
            'end_time': "12:00:00",
            'shift': Shift.MORNING.value,
            'max_patients': 10,
            'current_patients': 0,
            'status': "AVAILABLE",
            'default_appointment_duration_minutes': 30,
            'created_at': self.schedule.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'doctor_id': self.doctor.id,
            'room_id': self.room.id,
            'location': f"Tòa A, tầng 1, phòng Room 101",
            'building': "A",
            'floor': 1,
            'room_note': "Room 101"
        }
        self.assertEqual(serializer.data, expected_data)

    def test_validate_schedule(self):
        data = {
            'doctor': self.doctor.id,
            'room': self.room.id,
            'work_date': "2025-08-27",
            'start_time': "13:00:00",
            'end_time': "17:00:00",
            'shift': Shift.AFTERNOON.value,
            'max_patients': 8,
            'default_appointment_duration_minutes': 30
        }
        serializer = ScheduleSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        schedule = serializer.save()
        self.assertEqual(schedule.work_date, date(2025, 8, 27))
        self.assertEqual(schedule.shift, Shift.AFTERNOON.value)

    def test_read_only_fields(self):
        data = {
            'doctor': self.doctor.id,
            'room': self.room.id,
            'work_date': "2025-08-27",
            'start_time': "13:00:00",
            'end_time': "17:00:00",
            'shift': Shift.AFTERNOON.value,
            'max_patients': 8,
            'current_patients': 5,  # Should be ignored
            'status': "FULL",  # Should be ignored
            'default_appointment_duration_minutes': 30
        }
        serializer = ScheduleSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        schedule = serializer.save()
        self.assertEqual(schedule.current_patients, 0)  # Default value
        self.assertEqual(schedule.status, "AVAILABLE")  # Default value

class CreateDoctorRequestSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.department = Department.objects.create(department_name="Cardiology")

    def test_valid_data(self):
        data = {
            'email': "newdoctor@example.com",
            'password': "newpass123",
            'identity_number': "987654321",
            'first_name': "Jane",
            'last_name': "Smith",
            'birthday': "1990-01-01",
            'gender': Gender.FEMALE.value,
            'address': "456 Test Ave",
            'academic_degree': AcademicDegree.BS_CKI.value,
            'specialization': "Neurologist",
            'type': DoctorType.EXAMINATION.value,
            'department_id': self.department.id,
            'price': 150.00,
            'avatar': "https://example.com/avatar.jpg"
        }
        serializer = CreateDoctorRequestSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['email'], "newdoctor@example.com")

    def test_missing_required_fields(self):
        data = {
            'email': "newdoctor@example.com",
            # Missing password, identity_number, first_name, last_name, birthday, gender, academic_degree, specialization, type, department_id
        }
        serializer = CreateDoctorRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)
        self.assertIn('identity_number', serializer.errors)
        self.assertIn('first_name', serializer.errors)
        self.assertIn('last_name', serializer.errors)
        self.assertIn('birthday', serializer.errors)
        self.assertIn('gender', serializer.errors)
        self.assertIn('academic_degree', serializer.errors)
        self.assertIn('specialization', serializer.errors)
        self.assertIn('type', serializer.errors)
        self.assertIn('department_id', serializer.errors)

    def test_missing_email_and_phone(self):
        data = {
            'password': "newpass123",
            'identity_number': "987654321",
            'first_name': "Jane",
            'last_name': "Smith",
            'birthday': "1990-01-01",
            'gender': Gender.FEMALE.value,
            'academic_degree': AcademicDegree.BS_CKI.value,
            'specialization': "Neurologist",
            'type': DoctorType.EXAMINATION.value,
            'department_id': self.department.id
        }
        serializer = CreateDoctorRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email_or_phone', serializer.errors)

class DoctorSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123',
            role=UserRole.DOCTOR.value
        )
        cls.department = Department.objects.create(department_name="Cardiology")
        cls.doctor = Doctor.objects.create(
            user=cls.user,
            first_name="John",
            last_name="Doe",
            identity_number="123456789",
            birthday=date(1980, 1, 1),
            gender=Gender.MALE.value,
            address="123 Test St",
            academic_degree=AcademicDegree.BS_CKI.value,
            specialization="Cardiologist",
            type=DoctorType.EXAMINATION.value,
            department=cls.department,
            price=100.00,
            avatar="https://example.com/avatar.jpg"
        )

    def test_serialize_doctor(self):
        serializer = DoctorSerializer(self.doctor)
        expected_data = {
            'id': self.doctor.id,
            'user': {
                'id': self.user.id,
                'created_at': self.user.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                'updated_at': self.user.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                'email': 'testuser@example.com',
                'password': self.user.password,
                'phone': None,
                'role': UserRole.DOCTOR.value,
                'is_active': True,
                'is_verified': False,
                'is_deleted': False,
                'deleted_at': None
            },
            'department': {
                'id': self.department.id,
                'department_name': "Cardiology",
                'description': None,
                'avatar': None,
                'created_at': self.department.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            },
            'created_at': self.doctor.created_at.strftime("%Y-%m-%dT%H:%M:%S"),
            'schedules': [],
            'updated_at': self.doctor.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'identity_number': "123456789",
            'first_name': "John",
            'last_name': "Doe",
            'birthday': "1980-01-01",
            'gender': Gender.MALE.value,
            'address': "123 Test St",
            'academic_degree': AcademicDegree.BS_CKI.value,
            'specialization': "Cardiologist",
            'type': DoctorType.EXAMINATION.value,
            'avatar': "https://example.com/avatar.jpg",
            'price': "100.00"
        }
        self.assertEqual(serializer.data, expected_data)

class DoctorPartialUpdateSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(email='testuser@example.com', password='testpass123')
        cls.department = Department.objects.create(department_name="Cardiology")
        cls.doctor = Doctor.objects.create(
            user=cls.user,
            first_name="John",
            last_name="Doe",
            identity_number="123456789",
            birthday=date(1980, 1, 1),
            gender=Gender.MALE.value,
            address="123 Test St",
            academic_degree=AcademicDegree.BS_CKI.value,
            specialization="Cardiologist",
            type=DoctorType.EXAMINATION.value,
            department=cls.department,
            price=100.00
        )

    def test_partial_update(self):
        data = {
            'first_name': "Updated John",
            'specialization': "Neurologist"
        }
        serializer = DoctorPartialUpdateSerializer(instance=self.doctor, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated_doctor = serializer.save()
        self.assertEqual(updated_doctor.first_name, "Updated John")
        self.assertEqual(updated_doctor.specialization, "Neurologist")
        self.assertEqual(updated_doctor.last_name, "Doe")  # Unchanged

    def test_empty_data(self):
        serializer = DoctorPartialUpdateSerializer(instance=self.doctor, data={}, partial=True)
        self.assertTrue(serializer.is_valid())  # Empty data is valid for partial updates
        updated_doctor = serializer.save()
        self.assertEqual(updated_doctor.first_name, "John")  # No changes

class DoctorUpdateSerializerTest(TestCase):
    def test_valid_data(self):
        data = {
            'first_name': "Jane",
            'last_name': "Smith",
            'email': "jane.smith@example.com",
            'phone': "0123456789"  # Assuming a valid phone format
        }
        serializer = DoctorUpdateSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['first_name'], "Jane")
        self.assertEqual(serializer.validated_data['email'], "jane.smith@example.com")

    def test_invalid_phone(self):
        data = {
            'phone': "invalid_phone"
        }
        serializer = DoctorUpdateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)

    def test_empty_data(self):
        serializer = DoctorUpdateSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
