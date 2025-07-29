from rest_framework.routers import DefaultRouter
from .views import PatientViewSet, EmergencyContactViewSet

router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'emergency-contacts', EmergencyContactViewSet, basename='emergency-contact')

urlpatterns = router.urls
