from datetime import date

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.intelligence.integrations import api_ninjas, usda
from apps.intelligence.integrations.http_client import ExternalAPIError
from apps.intelligence.repositories.food_log import create_food_log, get_daily_logs
from apps.intelligence.repositories.workout_plan import (
    get_active_plan,
    get_today_workout_for_user,
    save_workout_plan,
)
from apps.intelligence.serializers import (
    FoodLogCreateSerializer,
    FoodLogEntrySerializer,
    GoalEstimateRequestSerializer,
    GoalEstimateResponseSerializer,
    GeneratedWorkoutPlanSerializer,
    WorkoutGenerateSerializer,
)
from apps.intelligence.services.goal_engine import estimate_goal
from apps.intelligence.services.progress_analytics import (
    build_goal_input_from_profile,
    get_fitness_progress,
    get_nutrition_summary,
)
from apps.intelligence.services.workout_generator import WorkoutGenerationInput, generate_workout_plan
from apps.intelligence.utils.muscle_mapping import MUSCLE_ANATOMY


class GoalEstimateView(APIView):
  permission_classes = [IsAuthenticated]

  def post(self, request):
    serializer = GoalEstimateRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    overrides = serializer.validated_data

    goal_input = build_goal_input_from_profile(request.user.profile, overrides)
    if not goal_input:
      return Response(
        {"error": {"code": "profile_incomplete", "message": "Complete your fitness profile first.", "details": {}}},
        status=status.HTTP_400_BAD_REQUEST,
      )

    result = estimate_goal(goal_input)
    data = {
      "bmr": result.bmr,
      "tdee": result.tdee,
      "calorie_target": result.calorie_target,
      "calorie_adjustment": result.calorie_adjustment,
      "macro_breakdown": {
        "protein_g": result.macro_breakdown.protein_g,
        "fat_g": result.macro_breakdown.fat_g,
        "carbs_g": result.macro_breakdown.carbs_g,
        "protein_pct": result.macro_breakdown.protein_pct,
        "fat_pct": result.macro_breakdown.fat_pct,
        "carbs_pct": result.macro_breakdown.carbs_pct,
      },
      "estimated_completion_date": result.estimated_completion_date,
      "weeks_needed": result.weeks_needed,
      "weekly_weight_projection": [
        {"week": p.week, "projected_weight_kg": p.projected_weight_kg, "date": p.date}
        for p in result.weekly_weight_projection
      ],
      "weekly_loss_kg": result.weekly_loss_kg,
      "weekly_gain_kg": result.weekly_gain_kg,
      "confidence_score": result.confidence_score,
    }
    return Response({"data": data}, status=status.HTTP_200_OK)


class FoodSearchView(APIView):
  permission_classes = [IsAuthenticated]

  def get(self, request):
    query = request.query_params.get("q", "").strip()
    if not query:
      return Response({"results": []})
    try:
      results = usda.search_foods(query)
      return Response({"results": results})
    except ExternalAPIError as exc:
      return Response(
        {"error": {"code": "usda_error", "message": str(exc), "details": {}}},
        status=exc.status_code or status.HTTP_502_BAD_GATEWAY,
      )


class FoodDetailView(APIView):
  permission_classes = [IsAuthenticated]

  def get(self, request, fdc_id: int):
    try:
      food = usda.get_food_detail(fdc_id)
      return Response(food)
    except ExternalAPIError as exc:
      return Response(
        {"error": {"code": "usda_error", "message": str(exc), "details": {}}},
        status=exc.status_code or status.HTTP_502_BAD_GATEWAY,
      )


class FoodLogView(APIView):
  permission_classes = [IsAuthenticated]

  def post(self, request):
    serializer = FoodLogCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
      entry = create_food_log(request.user, serializer.validated_data)
      return Response(FoodLogEntrySerializer(entry).data, status=status.HTTP_201_CREATED)
    except ExternalAPIError as exc:
      return Response(
        {"error": {"code": "usda_error", "message": str(exc), "details": {}}},
        status=exc.status_code or status.HTTP_502_BAD_GATEWAY,
      )

  def get(self, request):
    log_date_str = request.query_params.get("date")
    log_date = date.fromisoformat(log_date_str) if log_date_str else date.today()
    logs = get_daily_logs(request.user, log_date)
    summary = get_nutrition_summary(request.user, log_date, log_date)
    return Response({
      "date": log_date.isoformat(),
      "entries": FoodLogEntrySerializer(logs, many=True).data,
      "daily_totals": summary["daily"][0] if summary["daily"] else {
        "calories": 0, "protein": 0, "carbs": 0, "fat": 0,
      },
    })


class ExerciseCatalogView(APIView):
  """API Ninjas exercise discovery — GET /api/exercise-catalog/?muscle=&difficulty=&type="""

  permission_classes = [IsAuthenticated]

  def get(self, request):
    muscle = request.query_params.get("muscle")
    difficulty = request.query_params.get("difficulty")
    exercise_type = request.query_params.get("type")
    try:
      exercises = api_ninjas.search_exercises(
        muscle=muscle,
        difficulty=difficulty,
        exercise_type=exercise_type,
      )
      return Response({"results": exercises})
    except ExternalAPIError as exc:
      return Response(
        {"error": {"code": "api_ninjas_error", "message": str(exc), "details": {}}},
        status=exc.status_code or status.HTTP_502_BAD_GATEWAY,
      )


class MuscleAnatomyView(APIView):
  permission_classes = [IsAuthenticated]

  def get(self, request):
    return Response({"anatomy": MUSCLE_ANATOMY})


class WorkoutGenerateView(APIView):
  permission_classes = [IsAuthenticated]

  def post(self, request):
    serializer = WorkoutGenerateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    profile = request.user.profile

    from apps.intelligence.services.goal_engine import map_profile_goal_type

    inp = WorkoutGenerationInput(
      goal_type=data.get("goal_type") or map_profile_goal_type(profile.goal_type),
      experience_level=data.get("experience_level") or profile.experience_level or "beginner",
      workouts_per_week=data.get("workouts_per_week") or profile.workout_days_per_week or 3,
      split=data.get("split"),
    )
    plan_data = generate_workout_plan(inp)
    plan = save_workout_plan(request.user, plan_data)
    return Response(GeneratedWorkoutPlanSerializer(plan).data, status=status.HTTP_201_CREATED)


class WorkoutTodayView(APIView):
  permission_classes = [IsAuthenticated]

  def get(self, request):
    today = get_today_workout_for_user(request.user)
    if not today:
      return Response(
        {"error": {"code": "no_plan", "message": "Generate a workout plan first.", "details": {}}},
        status=status.HTTP_404_NOT_FOUND,
      )
    return Response(today)


class WorkoutPlanView(APIView):
  permission_classes = [IsAuthenticated]

  def get(self, request):
    plan = get_active_plan(request.user)
    if not plan:
      return Response({"plan": None})
    return Response({"plan": GeneratedWorkoutPlanSerializer(plan).data})


class FitnessProgressView(APIView):
  permission_classes = [IsAuthenticated]

  def get(self, request):
    return Response(get_fitness_progress(request.user))
