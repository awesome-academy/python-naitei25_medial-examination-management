from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, time, timedelta
from unittest.mock import patch
from doctors.models import Doctor, Department, ExaminationRoom, Schedule
from doctors.services import DoctorService, DepartmentService, ExaminationRoomService, ScheduleService
from users.models import User
from patients.models import Patient
from common.enums import Gender, AcademicDegree, DoctorType, RoomType, Shift
from appointments.models import Appointment
from common.enums import AppointmentStatus

User = get_user_model()

class DoctorServiceTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(email='testuser@example.com', password='testpass123')
        cls.department = Department.objects.create(department_name='Cardiology')
        cls.doctor = Doctor.objects.create(
            user=cls.user,
            first_name='John',
            last_name='Doe',
            identity_number='123456789',
            birthday=date(1980, 1, 1),
            gender=Gender.MALE.value,
            address='123 Test St',
            academic_degree=AcademicDegree.BS_CKI.value,
            specialization='Cardiologist',
            type=DoctorType.EXAMINATION.value,
            department=cls.department,
            price=100.00
        )
        cls.service = DoctorService()

    def test_get_all_doctors(self):
        doctors = self.service.get_all_doctors()
        self.assertEqual(doctors.count(), 1)
        self.assertEqual(doctors.first().id, self.doctor.id)

    def test_get_doctor_by_id(self):
        doctor = self.service.get_doctor_by_id(self.doctor.id)
        self.assertEqual(doctor.id, self.doctor.id)

    def test_create_doctor(self):
        data = {
            'email': f'newdoctor{int(timezone.now().timestamp())}@example.com',  # Dynamic email
            'password': 'newpass123',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'identity_number': '987654321',
            'birthday': date(1990, 1, 1),
            'gender': Gender.FEMALE.value,
            'address': '456 Test Ave',
            'academic_degree': AcademicDegree.BS_CKI.value,
            'specialization': 'Neurologist',
            'type': DoctorType.EXAMINATION.value,
            'department_id': self.department.id,
            'price': 150.00
        }
        doctor = self.service.create_doctor(data)
        self.assertEqual(doctor.identity_number, '987654321')
        self.assertEqual(doctor.user.email, data['email'])

    def test_update_doctor(self):
        data = {'first_name': 'Updated John'}
        updated_doctor = self.service.update_doctor(self.doctor.id, data)
        self.assertEqual(updated_doctor.first_name, 'Updated John')

    def test_delete_doctor(self):
        self.service.delete_doctor(self.doctor.id)
        self.assertFalse(Doctor.objects.filter(id=self.doctor.id).exists())

    def test_find_by_identity_number(self):
        doctor = self.service.find_by_identity_number('123456789')
        self.assertEqual(doctor.id, self.doctor.id)

    def test_filter_doctors(self):
        doctors = self.service.filter_doctors(
            gender=Gender.MALE.value,
            academic_degree=None,
            specialization='Cardiologist',
            type=None
        )
        self.assertEqual(doctors.count(), 1)
        self.assertEqual(doctors.first().id, self.doctor.id)

    def test_get_doctor_by_user_id(self):
        doctor = self.service.get_doctor_by_user_id(self.user.id)
        self.assertEqual(doctor.id, self.doctor.id)

    @patch('cloudinary.uploader.upload')
    def test_upload_avatar(self, mock_upload):
        mock_upload.return_value = {'secure_url': 'https://test.com/avatar.jpg'}
        file = 'fake_file'
        updated_doctor = self.service.upload_avatar(self.doctor, file)
        self.assertEqual(updated_doctor.avatar, 'https://test.com/avatar.jpg')

    @patch('cloudinary.uploader.destroy')
    def test_delete_avatar(self, mock_destroy):
        self.doctor.avatar = 'https://test.com/avatar.jpg'
        self.doctor.save()
        updated_doctor = self.service.delete_avatar(self.doctor)
        self.assertIsNone(updated_doctor.avatar)

class DepartmentServiceTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.department = Department.objects.create(department_name='Neurology')
        cls.service = DepartmentService()

    def test_get_all_departments(self):
        departments = self.service.get_all_departments()
        self.assertEqual(departments.count(), 1)
        self.assertEqual(departments.first().id, self.department.id)

    def test_get_department_by_id(self):
        department = self.service.get_department_by_id(self.department.id)
        self.assertEqual(department.id, self.department.id)

    def test_create_department(self):
        data = {'department_name': 'Orthopedics'}
        department = self.service.create_department(data)
        self.assertEqual(department.department_name, 'Orthopedics')

    def test_update_department(self):
        data = {'department_name': 'Updated Neurology'}
        updated_department = self.service.update_department(self.department.id, data)
        self.assertEqual(updated_department.department_name, 'Updated Neurology')

    def test_delete_department(self):
        self.service.delete_department(self.department.id)
        self.assertFalse(Department.objects.filter(id=self.department.id).exists())

    def test_get_doctors_by_department_id(self):
        doctors = self.service.get_doctors_by_department_id(self.department.id)
        self.assertEqual(doctors.count(), 0)  # No doctors in this department

class ExaminationRoomServiceTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.department = Department.objects.create(department_name='Neurology')
        cls.room = ExaminationRoom.objects.create(
            department=cls.department,
            type=RoomType.EXAMINATION.value,
            building='A',
            floor=1
        )
        cls.service = ExaminationRoomService()

    def test_get_all_examination_rooms(self):
        rooms = self.service.get_all_examination_rooms()
        self.assertEqual(rooms.count(), 1)
        self.assertEqual(rooms.first().id, self.room.id)

    def test_get_examination_room_by_id(self):
        room = self.service.get_examination_room_by_id(self.room.id)
        self.assertEqual(room.id, self.room.id)

    def test_create_examination_room(self):
        data = {
            'department': self.department,
            'type': RoomType.EXAMINATION.value,
            'building': 'B',
            'floor': 2
        }
        room = self.service.create_examination_room(data)
        self.assertEqual(room.building, 'B')

    def test_update_examination_room(self):
        data = {'building': 'Updated A'}
        updated_room = self.service.update_examination_room(self.room.id, data)
        self.assertEqual(updated_room.building, 'Updated A')

    def test_delete_examination_room(self):
        self.service.delete_examination_room(self.room.id)
        self.assertFalse(ExaminationRoom.objects.filter(id=self.room.id).exists())

    def test_filter_rooms(self):
        rooms = self.service.filter_rooms(type=RoomType.EXAMINATION.value, building='A', floor=1)
        self.assertEqual(rooms.count(), 1)
        self.assertEqual(rooms.first().id, self.room.id)

class ScheduleServiceTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(email='testuser@example.com', password='testpass123')
        cls.department = Department.objects.create(department_name='Cardiology')
        cls.doctor = Doctor.objects.create(
            user=cls.user,
            first_name='John',
            last_name='Doe',
            identity_number='123456789',
            birthday=date(1980, 1, 1),
            gender=Gender.MALE.value,
            address='123 Test St',
            academic_degree=AcademicDegree.BS_CKI.value,
            specialization='Cardiologist',
            type=DoctorType.EXAMINATION.value,
            department=cls.department,
            price=100.00
        )
        cls.room = ExaminationRoom.objects.create(
            department=cls.department,
            type=RoomType.EXAMINATION.value,
            building='A',
            floor=1
        )
        cls.schedule = Schedule.objects.create(
            doctor=cls.doctor,
            room=cls.room,
            shift=Shift.MORNING.value,
            work_date=date(2025, 8, 26),
            start_time=time(8, 0),
            end_time=time(12, 0),
            max_patients=10,
            default_appointment_duration_minutes=30
        )
        cls.service = ScheduleService()

    def test_get_all_schedules(self):
        schedules = self.service.get_all_schedules(doctor_id=self.doctor.id, shift=Shift.MORNING.value, work_date=date(2025, 8, 26), room_id=self.room.id)
        self.assertEqual(schedules.count(), 1)
        self.assertEqual(schedules.first().id, self.schedule.id)

    def test_get_schedule_by_id(self):
        schedule = self.service.get_schedule_by_id(self.schedule.id)
        self.assertEqual(schedule.id, self.schedule.id)

    def test_create_schedule(self):
        data = {
            'room': self.room,
            'shift': Shift.AFTERNOON.value,
            'work_date': date(2025, 8, 27),
            'start_time': time(13, 0),
            'end_time': time(17, 0),
            'max_patients': 10,
            'default_appointment_duration_minutes': 30
        }
        schedule = self.service.create_schedule(doctor_id=self.doctor.id, data=data)
        self.assertEqual(schedule.shift, Shift.AFTERNOON.value)

    def test_update_schedule(self):
        data = {'shift': Shift.AFTERNOON.value}
        updated_schedule = self.service.update_schedule(self.doctor.id, self.schedule.id, data)
        self.assertEqual(updated_schedule.shift, Shift.AFTERNOON.value)

    def test_delete_schedule(self):
        self.service.delete_schedule(self.doctor.id, self.schedule.id)
        self.assertFalse(Schedule.objects.filter(id=self.schedule.id).exists())

    def test_get_all_schedules_for_admin(self):
        schedules = self.service.get_all_schedules_for_admin()
        self.assertEqual(schedules.count(), 1)
        self.assertEqual(schedules.first().id, self.schedule.id)

    def test_get_schedules_by_ids(self):
        schedules = self.service.get_schedules_by_ids([self.schedule.id])
        self.assertEqual(schedules.count(), 1)
        self.assertEqual(schedules.first().id, self.schedule.id)

    def test_update_current_patients_count(self):
        # Create a user for the patient
        patient_user = User.objects.create_user(
            email=f'patient{int(timezone.now().timestamp())}@example.com',
            password='patientpass123'
        )
        # Create a patient with required fields
        patient = Patient.objects.create(
            user=patient_user,
            first_name='Test',
            last_name='Patient',
            identity_number='111222333',
            insurance_number='INS123456',
            birthday=date(1990, 1, 1),
            gender=Gender.FEMALE.value
        )
        # Create an appointment
        Appointment.objects.create(
            schedule=self.schedule,
            doctor=self.doctor,
            patient=patient,
            slot_start=timezone.now(),
            slot_end=timezone.now() + timedelta(minutes=30),
            status=AppointmentStatus.CONFIRMED.value
        )
        updated_schedule = self.service.update_current_patients_count(self.schedule.id)
        self.assertEqual(updated_schedule.current_patients, 1)
