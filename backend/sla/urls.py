from rest_framework.routers import DefaultRouter
from .views import SLARuleViewSet

router = DefaultRouter()
router.register(r'sla-rules', SLARuleViewSet, basename='sla-rules')

urlpatterns = router.urls