from rest_framework import serializers
from django.core.validators import RegexValidator
from django.utils.translation import gettext as _
from .models import User
from common.constants import USER_LENGTH, FULL_NAME_LENGTH, IDENTITY_NUMBER_LENGTH, INSURANCE_NUMBER_LENGTH, ADDRESS_LENGTH, OTP_LENGTH, TOKEN_LENGTH
from common.enums import Gender, UserRole

class UserRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=USER_LENGTH["EMAIL"], required=False)
    phone = serializers.CharField(
        max_length=USER_LENGTH["PHONE"],
        required=False,
        validators=[RegexValidator(r'^(\+84|0)\d{9,10}$', message=_("Số điện thoại không hợp lệ"))]
    )
    password = serializers.CharField(max_length=USER_LENGTH["PASSWORD"])
    role = serializers.ChoiceField(choices=[(role.value, role.name) for role in UserRole])

    def validate(self, data):
        if not data.get('email') and not data.get('phone'):
            raise serializers.ValidationError({
                "email": _("Phải cung cấp email hoặc số điện thoại"),
                "phone": _("Phải cung cấp email hoặc số điện thoại")
            })
        
        required_fields = {
            "password": _("Mật khẩu không được để trống"),
            "role": _("Vai trò không được để trống"),
        }
        errors = {}
        for field, message in required_fields.items():
            if not data.get(field):
                errors[field] = message
        if errors:
            raise serializers.ValidationError(errors)
        return data

class UserUpdateRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=USER_LENGTH["EMAIL"], required=False)
    phone = serializers.CharField(
        max_length=USER_LENGTH["PHONE"], 
        required=False, 
        validators=[RegexValidator(r'^(\+84|0)\d{9,10}$', message=_("Số điện thoại không hợp lệ"))]
    )
    password = serializers.CharField(max_length=USER_LENGTH["PASSWORD"], required=False)
    role = serializers.ChoiceField(choices=[(role.value, role.name) for role in UserRole], required=False)

class UserResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'phone', 'role', 'created_at']

class PagedResponseSerializer(serializers.Serializer):
    content = UserResponseSerializer(many=True)
    page = serializers.IntegerField()
    size = serializers.IntegerField()
    totalElements = serializers.IntegerField()
    totalPages = serializers.IntegerField()
    last = serializers.BooleanField()

class ChangePasswordRequestSerializer(serializers.Serializer):
    oldPassword = serializers.CharField(max_length=USER_LENGTH["PASSWORD"])
    newPassword = serializers.CharField(max_length=USER_LENGTH["PASSWORD"])

    def validate(self, data):
        if not data.get('oldPassword'):
            raise serializers.ValidationError({"oldPassword": _("Mật khẩu cũ không được để trống")})
        if not data.get('newPassword'):
            raise serializers.ValidationError({"newPassword": _("Mật khẩu mới không được để trống")})
        return data

class RegisterRequestSerializer(serializers.Serializer):
    password = serializers.CharField(max_length=USER_LENGTH["PASSWORD"])
    email = serializers.EmailField(max_length=USER_LENGTH["EMAIL"])  
    fullName = serializers.CharField(max_length=FULL_NAME_LENGTH)
    identityNumber = serializers.CharField(max_length=IDENTITY_NUMBER_LENGTH)
    insuranceNumber = serializers.CharField(max_length=INSURANCE_NUMBER_LENGTH)
    birthday = serializers.DateField()
    gender = serializers.ChoiceField(choices=[(gender.value, gender.name) for gender in Gender])
    address = serializers.CharField(max_length=ADDRESS_LENGTH)

    def validate(self, data):
        required_fields = {
            "password": _("Mật khẩu không được để trống"),
            "email": _("Email không được để trống"), 
            "fullName": _("Họ tên không được để trống"),
            "identityNumber": _("CCCD không được để trống"),
            "insuranceNumber": _("Số bảo hiểm y tế không được để trống"),
            "birthday": _("Ngày sinh không được để trống"),
            "gender": _("Giới tính không được để trống"),
            "address": _("Địa chỉ không được để trống"),
        }
        errors = {}
        for field, message in required_fields.items():
            if not data.get(field):
                errors[field] = message
        if errors:
            raise serializers.ValidationError(errors)
        return data

class RegisterVerifyRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=USER_LENGTH["EMAIL"])  
    otp = serializers.CharField(max_length=OTP_LENGTH)               
        
    def validate(self, data):
        required_fields = {
            "email": _("Email không được để trống"),
            "otp": _("Mã OTP không được để trống"),
        }
        errors = {}
        for field, message in required_fields.items():
            if not data.get(field):
                errors[field] = message
        if errors:
            raise serializers.ValidationError(errors)
        return data

class LoginFlexibleRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=USER_LENGTH["EMAIL"], required=False)
    phone = serializers.CharField(
        max_length=USER_LENGTH["PHONE"], 
        required=False,
        validators=[RegexValidator(r'^(\+84|0)\d{9,10}$', message=_("Số điện thoại không hợp lệ"))]
    )
    password = serializers.CharField(max_length=USER_LENGTH["PASSWORD"])

    def validate(self, data):
        if not data.get('email') and not data.get('phone'):
            raise serializers.ValidationError({
                "email": _("Phải cung cấp email hoặc số điện thoại"),
                "phone": _("Phải cung cấp email hoặc số điện thoại")
            })
        
        if not data.get('password'):
            raise serializers.ValidationError({
                "password": _("Mật khẩu không được để trống")
            })
        
        return data

class ResetPasswordRequestSerializer(serializers.Serializer):
    resetToken = serializers.CharField(max_length=TOKEN_LENGTH)
    password = serializers.CharField(max_length=USER_LENGTH["PASSWORD"])

    def validate(self, data):
        required_fields = {
            "resetToken": _("Token đặt lại không được để trống"),
            "password": _("Mật khẩu không được để trống"),
        }
        errors = {}
        for field, message in required_fields.items():
            if not data.get(field):
                errors[field] = message
        if errors:
            raise serializers.ValidationError(errors)
        return data

class ForgotPasswordEmailRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=USER_LENGTH["EMAIL"])

    def validate(self, data):
        if not data.get('email'):
            raise serializers.ValidationError({
                "email": _("Email không được để trống")
            })
        return data

class LoginResponseSerializer(serializers.Serializer):
    token = serializers.CharField()

class UserResponseAuthSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'role']
