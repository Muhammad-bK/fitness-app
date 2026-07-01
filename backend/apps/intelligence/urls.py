from django.urls import path

from . import views

goal_urlpatterns = [
    path("estimate/", views.GoalEstimateView.as_view(), name="goal-estimate"),
]

food_urlpatterns = [
    path("search/", views.FoodSearchView.as_view(), name="food-search"),
    path("log/", views.FoodLogView.as_view(), name="food-log"),
    path("<int:fdc_id>/", views.FoodDetailView.as_view(), name="food-detail"),
]

workout_urlpatterns = [
    path("generate/", views.WorkoutGenerateView.as_view(), name="workout-generate"),
    path("today/", views.WorkoutTodayView.as_view(), name="workout-today"),
    path("plan/", views.WorkoutPlanView.as_view(), name="workout-plan"),
]

intelligence_urlpatterns = [
    path("exercise-catalog/", views.ExerciseCatalogView.as_view(), name="exercise-catalog"),
    path("muscle-anatomy/", views.MuscleAnatomyView.as_view(), name="muscle-anatomy"),
    path("progress/", views.FitnessProgressView.as_view(), name="fitness-progress"),
]
