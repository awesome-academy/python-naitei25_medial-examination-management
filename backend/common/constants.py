# ======================
# Numeric constraints
# ======================
DECIMAL_MAX_DIGITS = 10
DECIMAL_DECIMAL_PLACES = 2

# ======================
# Enum char field length
# ======================
ENUM_LENGTH = {
    "DEFAULT": 1
}

# ======================
# Common field length
# ======================
COMMON_LENGTH = {
    "NAME": 100,
    "ADDRESS": 255,
    "NOTE": 255,
    "TITLE": 100,
    "TOKEN": 255,
    "URL": 255,
    "PUBLIC_ID": 100,
}

# ======================
# User domain
# ======================
USER_LENGTH = {
    "EMAIL": 100,
    "PASSWORD": 255,
    "PHONE": 20,
}

# ======================
# Patient domain
# ======================
PATIENT_LENGTH = {
    "IDENTITY": 20,
    "INSURANCE": 50,
    "BLOOD_TYPE": 10,
    "RELATIONSHIP": 50,
}

# ======================
# Doctor domain
# ======================
DOCTOR_LENGTH = {
    "DEPARTMENT_NAME": 100,
    "BUILDING": 20,
    "SPECIALIZATION": 100,
    "ROOM_NOTE": 255,
    "ACADEMIC_DEGREE": 10,
}

# ======================
# Service domain
# ======================
SERVICE_LENGTH = {
    "SERVICE_NAME": 100,
}

# ======================
# Payment domain
# ======================
PAYMENT_LENGTH = {
    "ITEM_TYPE": 20,
}

# ======================
# Pharmacy & Prescription domain
# ======================
PHARMACY_LENGTH = {
    "UNIT": 50,
    "CATEGORY": 50,
    "DOSAGE": 100,
    "FREQUENCY": 50,
    "DURATION": 50,
    "PRESCRIPTION_NOTE": 255,
}
