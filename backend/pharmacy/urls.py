from rest_framework.routers import DefaultRouter
from .views import MedicineViewSet, PrescriptionViewSet, PrescriptionDetailViewSet

router = DefaultRouter()
router.register(r'medicines', MedicineViewSet, basename='medicine')
router.register(r'prescriptions', PrescriptionViewSet, basename='prescription')
router.register(r'prescription-details', PrescriptionDetailViewSet, basename='prescription-detail')

urlpatterns = router.urls
