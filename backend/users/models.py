from django.db import models
from core.models import BaseModel
from common.enums import UserRole
from common.constants import USER_LENGTH, ENUM_LENGTH

class User(BaseModel):
    email = models.EmailField(max_length=USER_LENGTH["EMAIL"], unique=True)
    password = models.CharField(max_length=USER_LENGTH["PASSWORD"])
    phone = models.CharField(max_length=USER_LENGTH["PHONE"], blank=True, null=True)
    role = models.CharField(max_length=ENUM_LENGTH["DEFAULT"], choices=[(r.value, r.name) for r in UserRole])

    def __str__(self):
        return self.email
