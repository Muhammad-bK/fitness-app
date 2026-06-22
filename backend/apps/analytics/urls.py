from django.urls import path

from . import views

urlpatterns = [
    path("bodyweight/", views.BodyWeightView.as_view(), name="analytics-bodyweight"),
    path("exercise/<uuid:exercise_id>/", views.ExerciseAnalyticsView.as_view(), name="analytics-exercise"),
    path("consistency/", views.ConsistencyView.as_view(), name="analytics-consistency"),
    path("dashboard/", views.DashboardView.as_view(), name="analytics-dashboard"),
]
