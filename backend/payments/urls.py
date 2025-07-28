from rest_framework.routers import DefaultRouter
from .views import BillViewSet, BillDetailViewSet, TransactionViewSet

router = DefaultRouter()
router.register(r'bills', BillViewSet, basename='bill')
router.register(r'bill-details', BillDetailViewSet, basename='bill-detail')
router.register(r'transactions', TransactionViewSet, basename='transaction')

urlpatterns = router.urls
