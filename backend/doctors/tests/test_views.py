from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from datetime import date, time
from common.enums import DoctorType, AcademicDegree, Gender, RoomType, Shift
from doctors.models import Doctor, Department, ExaminationRoom, Schedule
from doctors.serializers import DoctorSerializer, DepartmentSerializer, ExaminationRoomSerializer, ScheduleSerializer

User = get_user_model()

class DoctorViewSetTest(APITestCase):
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
            academic_degree=AcademicDegree.BS_CKII.value,
            specialization='Cardiologist',
            type=DoctorType.EXAMINATION.value,
            department=cls.department,
            price=100.00
        )

    def test_list_doctors(self):
        response = self.client.get(reverse('doctor-list'))
        doctors = Doctor.objects.all()
        serializer = DoctorSerializer(doctors, many=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)

    def test_retrieve_doctor(self):
        response = self.client.get(reverse('doctor-detail', kwargs={'pk': self.doctor.pk}))
        serializer = DoctorSerializer(self.doctor)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)

    def test_create_doctor_authenticated(self):
        self.client.force_authenticate(user=self.user)
        data = {
            'password': 'newpass123',
            'email': 'newuser@example.com',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'identity_number': '094521111111',
            'birthday': '1990-01-01',
            'gender': Gender.FEMALE.value,
            'address': '456 Test Ave',
            'academic_degree': AcademicDegree.BS.value,
            'specialization': 'Neurologist',
            'type': DoctorType.SERVICE.value,
            'department_id': self.department.id,
            'price': 150.00
        }
        response = self.client.post(reverse('doctor-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Doctor.objects.filter(identity_number='094521111111').exists())

    def test_update_doctor_authenticated(self):
        self.client.force_authenticate(user=self.user)
        data = {
            'first_name': 'John',
            'last_name': 'Smith',
            'identity_number': '094555555555',
            'birthday': '1980-01-01',
            'gender': Gender.MALE.value,
            'address': '789 Test Rd',
            'academic_degree': AcademicDegree.BS.value,
            'specialization': 'Cardiologist',
            'type': DoctorType.SERVICE.value,
            'department_id': self.department.id,
            'price': 200.00
        }
        response = self.client.patch(reverse('doctor-detail', kwargs={'pk': self.doctor.pk}), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.doctor.refresh_from_db()
        self.assertEqual(self.doctor.address, '789 Test Rd')

    def test_partial_update_doctor_authenticated(self):
        self.client.force_authenticate(user=self.user)
        data = {'address': '999 New St', 'price': 250.00}
        response = self.client.patch(reverse('doctor-detail', kwargs={'pk': self.doctor.pk}), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.doctor.refresh_from_db()
        self.assertEqual(self.doctor.address, '999 New St')
        self.assertEqual(self.doctor.price, 250.00)

    def test_destroy_doctor_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(reverse('doctor-detail', kwargs={'pk': self.doctor.pk}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Doctor.objects.filter(pk=self.doctor.pk).exists())

    def test_search_doctor_by_identity_number(self):
        response = self.client.get(reverse('doctor-search') + '?identityNumber=123456789')
        serializer = DoctorSerializer(self.doctor)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)

    def test_filter_doctors(self):
        response = self.client.get(reverse('doctor-filter') + '?specialization=Cardiologist')
        doctors = Doctor.objects.filter(specialization='Cardiologist')
        serializer = DoctorSerializer(doctors, many=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)

class DepartmentViewSetTest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(email='testuser@example.com', password='testpass123')
        cls.department = Department.objects.create(department_name='Neurology')

    def test_list_departments(self):
        response = self.client.get(reverse('department-list'))
        departments = Department.objects.all()
        serializer = DepartmentSerializer(departments, many=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)

    def test_retrieve_department(self):
        response = self.client.get(reverse('department-detail', kwargs={'pk': self.department.pk}))
        serializer = DepartmentSerializer(self.department)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)

    def test_create_department_authenticated(self):
        self.client.force_authenticate(user=self.user)
        data = {'department_name': 'Orthopedics'}
        response = self.client.post(reverse('department-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Department.objects.filter(department_name='Orthopedics').exists())

    def test_update_department_authenticated(self):
        self.client.force_authenticate(user=self.user)
        data = {'department_name': 'Neurology Updated'}
        response = self.client.put(reverse('department-detail', kwargs={'pk': self.department.pk}), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.department.refresh_from_db()
        self.assertEqual(self.department.department_name, 'Neurology Updated')

    def test_destroy_department_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(reverse('department-detail', kwargs={'pk': self.department.pk}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Department.objects.filter(pk=self.department.pk).exists())

    def test_get_doctors_by_department(self):
        response = self.client.get(reverse('department-doctors', kwargs={'pk': self.department.pk}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

class ExaminationRoomViewSetTest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(email='testuser@example.com', password='testpass123')
        cls.department = Department.objects.create(department_name='Neurology')
        cls.room = ExaminationRoom.objects.create(
            department=cls.department,
            type=RoomType.EXAMINATION.value,
            building='A',
            floor=1
        )

    def test_list_rooms(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse('examination-room-list'))
        rooms = ExaminationRoom.objects.all()
        serializer = ExaminationRoomSerializer(rooms, many=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)

    def test_retrieve_room(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse('examination-room-detail', kwargs={'pk': self.room.pk}))
        serializer = ExaminationRoomSerializer(self.room)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)

    def test_create_room_authenticated(self):
        self.client.force_authenticate(user=self.user)
        data = {
            'department': self.department.id,
            'type': RoomType.EXAMINATION.value,
            'building': 'B',
            'floor': 2
        }
        response = self.client.post(reverse('examination-room-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ExaminationRoom.objects.filter(building='B', floor=2).exists())

    def test_search_rooms(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse('examination-room-search') + '?type=E')
        rooms = ExaminationRoom.objects.filter(type=RoomType.EXAMINATION.value)
        serializer = ExaminationRoomSerializer(rooms, many=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)

class ScheduleViewSetTest(APITestCase):
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
            academic_degree=AcademicDegree.BS_CKII.value,
            specialization='Cardiologist',
            type=DoctorType.SERVICE.value,
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

    def test_list_schedules(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse('schedule-list'))
        schedules = Schedule.objects.all()
        serializer = ScheduleSerializer(schedules, many=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)

    def test_retrieve_schedule(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse('schedule-detail', kwargs={'pk': self.schedule.pk}))
        serializer = ScheduleSerializer(self.schedule)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)

    def test_create_schedule_authenticated(self):
        self.client.force_authenticate(user=self.user)
        data = {
            'doctor': self.doctor.id,
            'room': self.room.id,
            'shift': Shift.AFTERNOON.value,
            'work_date': '2025-08-27',
            'start_time': '13:00',
            'end_time': '17:00',
            'max_patients': 10,
            'default_appointment_duration_minutes': 30
        }
        response = self.client.post(reverse('schedule-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Schedule.objects.filter(shift=Shift.AFTERNOON.value, work_date='2025-08-27').exists())

    def test_get_schedules_by_date(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse('schedule-get-by-date', kwargs={'date': '2025-08-26'}))
        schedules = Schedule.objects.filter(work_date=date(2025, 8, 26))
        serializer = ScheduleSerializer(schedules, many=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)
