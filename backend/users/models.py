from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from core.models import BaseModel
from common.enums import UserRole
from common.constants import USER_LENGTH, ENUM_LENGTH

class UserManager(models.Manager):
    def create_user(self, email=None, password=None, phone=None, **extra_fields):
        if not email and not phone:
            raise ValueError('Email hoặc số điện thoại là bắt buộc')
        
        if email:
            email = self.normalize_email(email)
        
        user = self.model(email=email, phone=phone, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user
    
    def normalize_email(self, email):
        if email:
            return email.lower().strip()
        return email

class User(BaseModel):
    email = models.EmailField(max_length=USER_LENGTH["EMAIL"], unique=True, null=True, blank=True)
    password = models.CharField(max_length=USER_LENGTH["PASSWORD"])
    phone = models.CharField(max_length=USER_LENGTH["PHONE"], blank=True, null=True, unique=True)
    role = models.CharField(
        max_length=ENUM_LENGTH["DEFAULT"], 
        choices=[(r.value, r.name) for r in UserRole],
        default=UserRole.PATIENT.value
    )
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    def set_password(self, raw_password):
        if raw_password:
            self.password = make_password(raw_password)
    
    def check_password(self, raw_password):
        return check_password(raw_password, self.password)
    
    def has_perm(self, perm, obj=None):
        return True
    
    def has_module_perms(self, app_label):
        return True
    
    @property
    def is_staff(self):
        return self.role in [UserRole.ADMIN.value, UserRole.DOCTOR.value]
    
    @property
    def is_superuser(self):
        return self.role == UserRole.ADMIN.value
    
    @property
    def is_anonymous(self):
        return False
    
    @property
    def is_authenticated(self):
        return True
    
    @property
    def username(self):
        return self.email or self.phone
    
    def get_username(self):
        return self.username
    
    def natural_key(self):
        return (self.username,)
    
    def __str__(self):
        return self.email or self.phone or f"User {self.id}"
