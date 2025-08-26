import uuid
from datetime import date, time

from django.test import TestCase
from django.contrib.auth import get_user_model

from core.models import BaseModel
from common.enums import Gender, AcademicDegree, DoctorType, RoomType, Shift
from common.constants import DOCTOR_LENGTH, COMMON_LENGTH, PATIENT_LENGTH, ENUM_LENGTH, SCHEDULE_DEFAULTS, DECIMAL_MAX_DIGITS, DECIMAL_DECIMAL_PLACES
from doctors.models import Department, ExaminationRoom, Doctor, Schedule, ScheduleStatus

User = get_user_model()

class DepartmentModelTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.department = Department.objects.create(
            department_name="Khoa Tim mạch",
            description="Chuyên điều trị các bệnh về tim mạch",
            avatar="tim_mach.png"
        )

    def test_department_name_label(self):
        field_label = self.department._meta.get_field('department_name').verbose_name
        self.assertEqual(field_label, 'department name')

    def test_department_name_max_length(self):
        max_length = self.department._meta.get_field('department_name').max_length
        self.assertEqual(max_length, DOCTOR_LENGTH["DEPARTMENT_NAME"])

    def test_description_label(self):
        field_label = self.department._meta.get_field('description').verbose_name
        self.assertEqual(field_label, 'description')

    def test_avatar_label(self):
        field_label = self.department._meta.get_field('avatar').verbose_name
        self.assertEqual(field_label, 'avatar')

    def test_string_representation(self):
        self.assertEqual(str(self.department), "Khoa Tim mạch")


class ExaminationRoomModelTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.department = Department.objects.create(department_name="Khoa Thần kinh")
        cls.room = ExaminationRoom.objects.create(
            department=cls.department,
            type=RoomType.EXAMINATION.value,
            building="A",
            floor=5,
            note="Phòng khám bệnh nhân"
        )

    def test_department_label(self):
        field_label = self.room._meta.get_field('department').verbose_name
        self.assertEqual(field_label, 'department')

    def test_type_label(self):
        field_label = self.room._meta.get_field('type').verbose_name
        self.assertEqual(field_label, 'type')

    def test_building_max_length(self):
        max_length = self.room._meta.get_field('building').max_length
        self.assertEqual(max_length, DOCTOR_LENGTH["BUILDING"])

    def test_string_representation(self):
        expected = f"{self.department.department_name} - {self.room.building} {self.room.floor}"
        self.assertEqual(str(self.room), expected)


class DoctorModelTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create(email='bacsinguyen@example.com')
        cls.department = Department.objects.create(department_name="Khoa Xương khớp")
        cls.doctor = Doctor.objects.create(
            user=cls.user,
            identity_number="094222222222",
            first_name="Văn",
            last_name="Nguyễn",
            birthday=date(1985, 3, 15),
            gender=Gender.MALE.value,
            address="Thủ đức, Tp HCM",
            academic_degree=AcademicDegree.BS.value,
            specialization="Phẫu thuật xương",
            type=DoctorType.EXAMINATION.value,
            department=cls.department,
            avatar="bac_si_nguyen.png",
            price=1500000.00
        )

    def test_first_name_label(self):
        field_label = self.doctor._meta.get_field('first_name').verbose_name
        self.assertEqual(field_label, 'first name')

    def test_identity_number_max_length(self):
        max_length = self.doctor._meta.get_field('identity_number').max_length
        self.assertEqual(max_length, PATIENT_LENGTH["IDENTITY"])

    def test_price_decimal_places(self):
        decimal_places = self.doctor._meta.get_field('price').decimal_places
        self.assertEqual(decimal_places, DECIMAL_DECIMAL_PLACES)

    def test_string_representation(self):
        expected = f"Dr. {self.doctor.first_name} {self.doctor.last_name}"
        self.assertEqual(str(self.doctor), expected)


class ScheduleModelTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create(email='bacsitran@example.com')
        cls.department = Department.objects.create(department_name="Khoa Nhi")
        cls.room = ExaminationRoom.objects.create(
            department=cls.department,
            type=RoomType.EXAMINATION.value,
            building="B",
            floor=3
        )
        cls.doctor = Doctor.objects.create(
            user=cls.user,
            identity_number="099999999999",
            first_name="Thị",
            last_name="Trần",
            gender=Gender.FEMALE.value,
            academic_degree=AcademicDegree.BS.value,
            specialization="Chăm sóc nhi khoa",
            type=DoctorType.SERVICE.value,
            department=cls.department
        )
        cls.schedule = Schedule.objects.create(
            doctor=cls.doctor,
            work_date=date(2025, 8, 27),
            start_time=time(8, 0),
            end_time=time(11, 0),
            shift=Shift.MORNING.value,
            room=cls.room,
            max_patients=SCHEDULE_DEFAULTS["MAX_PATIENTS"],
            current_patients=SCHEDULE_DEFAULTS["CURRENT_PATIENTS"],
            status=ScheduleStatus.AVAILABLE,
            default_appointment_duration_minutes=SCHEDULE_DEFAULTS["APPOINTMENT_DURATION_MINUTES"]
        )

    def test_doctor_label(self):
        field_label = self.schedule._meta.get_field('doctor').verbose_name
        self.assertEqual(field_label, 'doctor')

    def test_status_default(self):
        default_status = self.schedule._meta.get_field('status').default
        self.assertEqual(default_status, ScheduleStatus.AVAILABLE)

    def test_max_patients_default(self):
        default_max_patients = self.schedule._meta.get_field('max_patients').default
        self.assertEqual(default_max_patients, SCHEDULE_DEFAULTS["MAX_PATIENTS"])

    def test_string_representation(self):
        expected = f"Schedule {self.schedule.doctor} {self.schedule.work_date} {self.schedule.shift}"
        self.assertEqual(str(self.schedule), expected)
