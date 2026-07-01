from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.accounts import views as account_views
from apps.intelligence.urls import food_urlpatterns, goal_urlpatterns, intelligence_urlpatterns, workout_urlpatterns

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/onboarding/", account_views.OnboardingStateView.as_view(), name="onboarding-state"),
    path("api/onboarding/complete/", account_views.OnboardingCompleteView.as_view(), name="onboarding-complete"),
    path("api/onboarding/options/", account_views.OnboardingOptionsView.as_view(), name="onboarding-options"),
    path("api/exercises/", include("apps.exercises.urls")),
    path("api/workouts/", include("apps.workouts.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/goal/", include((goal_urlpatterns, "goal"))),
    path("api/food/", include((food_urlpatterns, "food"))),
    path("api/workout/", include((workout_urlpatterns, "workout"))),
    path("api/intelligence/", include((intelligence_urlpatterns, "intelligence"))),
    # OpenAPI / Swagger
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
