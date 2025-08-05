from rest_framework import serializers
from .models import Doctor, Department, ExaminationRoom, Schedule
from common.enums import Gender, AcademicDegree, DoctorType
from common.constants import DOCTOR_LENGTH, COMMON_LENGTH, PATIENT_LENGTH, ENUM_LENGTH, USER_LENGTH
from users.serializers import UserResponseSerializer
from datetime import datetime
from django.utils.translation import gettext_lazy as _

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class ExaminationRoomSerializer(serializers.ModelSerializer):
    department_id = serializers.IntegerField(source='department.id', read_only=True)

    class Meta:
        model = ExaminationRoom
        fields = '__all__'

class ScheduleSerializer(serializers.ModelSerializer):
    doctor_id = serializers.IntegerField(source='doctor.id', read_only=True)
    room_id = serializers.IntegerField(source='examination_room.id', read_only=True)

    class Meta:
        model = Schedule
        fields = '__all__'

    def get_location(self, obj):
        return _("Tòa {building}, tầng {floor}, phòng {room}").format(
            building=obj.examination_room.building,
            floor=obj.examination_room.floor,
            room=obj.examination_room.room_name or obj.examination_room.note
        )

class CreateDoctorRequestSerializer(serializers.Serializer):
    password = serializers.CharField(max_length=USER_LENGTH["PASSWORD"], required=True)
    identity_number = serializers.CharField(max_length=PATIENT_LENGTH["IDENTITY"], required=True)
    first_name = serializers.CharField(max_length=COMMON_LENGTH["NAME"], required=True)
    last_name = serializers.CharField(max_length=COMMON_LENGTH["NAME"], required=True)
    birthday = serializers.DateField(required=True)
    gender = serializers.ChoiceField(choices=[(g.value, g.name) for g in Gender])
    address = serializers.CharField(max_length=COMMON_LENGTH["ADDRESS"], required=False)
    academic_degree = serializers.ChoiceField(choices=[(a.value, a.name) for a in AcademicDegree])
    specialization = serializers.CharField(max_length=DOCTOR_LENGTH["SPECIALIZATION"], required=True)
    type = serializers.ChoiceField(choices=[(d.value, d.name) for d in DoctorType])
    department_id = serializers.IntegerField(required=True)
    email = serializers.EmailField(max_length=USER_LENGTH["EMAIL"], required=False)

    def validate(self, data):
        required_fields = {
            "password": _("Mật khẩu không được để trống"),
            "identity_number": _("CCCD không được để trống"),
            "first_name": _("Tên không được để trống"),
            "last_name": _("Họ không được để trống"),
            "birthday": _("Ngày sinh không được để trống"),
            "gender": _("Giới tính không được để trống"),
            "academic_degree": _("Học vấn không được để trống"),
            "specialization": _("Chuyên môn không được để trống"),
            "type": _("Loại bác sĩ không được để trống"),
            "department_id": _("ID khoa không được để trống"),
        }

        errors = {}
        for field, message in required_fields.items():
            if not data.get(field):
                errors[field] = message
        
        if not data.get('email') and not data.get('phone'):
            errors['email_or_phone'] = _("Email hoặc số điện thoại là bắt buộc")

        if errors:
            raise serializers.ValidationError(errors)

        return data


class DoctorSerializer(serializers.ModelSerializer):
    user = UserResponseSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S", read_only=True)

    class Meta:
        model = Doctor
        fields = '__all__'
