from rest_framework.routers import DefaultRouter

from .views import WorkoutSessionViewSet

router = DefaultRouter()
router.register("", WorkoutSessionViewSet, basename="workout")

urlpatterns = router.urls
