from datetime import date, timedelta
from decimal import Decimal

from django.db.models import (
    Avg,
    Case,
    Count,
    F,
    Max,
    Q,
    Sum,
    Value,
    When,
)
from django.db.models.functions import ExtractIsoWeekDay, ExtractWeek, ExtractYear, TruncWeek
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.exercises.models import Exercise
from apps.workouts.models import ExerciseSet, WorkoutExercise, WorkoutSession
from apps.workouts.utils import estimate_one_rep_max


def _parse_period(request) -> tuple[date, date]:
    """Return (start_date, end_date) from period or explicit start/end params."""
    period = request.query_params.get("period", "month")
    end = date.today()
    start_param = request.query_params.get("start")
    end_param = request.query_params.get("end")

    if start_param and end_param:
        return date.fromisoformat(start_param), date.fromisoformat(end_param)

    if period == "week":
        start = end - timedelta(days=7)
    elif period == "year":
        start = end - timedelta(days=365)
    elif period == "all":
        start = date(2000, 1, 1)
    else:
        start = end - timedelta(days=30)

    if start_param:
        start = date.fromisoformat(start_param)
    if end_param:
        end = date.fromisoformat(end_param)

    return start, end


WORKING_SET_FILTER = ~Q(
    workout_exercise__sets__set_type="warmup"
)


class BodyWeightView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start, end = _parse_period(request)
        sessions = (
            WorkoutSession.objects.filter(
                user=request.user,
                workout_date__gte=start,
                workout_date__lte=end,
                body_weight_kg__isnull=False,
            )
            .order_by("workout_date")
            .values("workout_date", "body_weight_kg")
        )

        daily = [
            {"date": str(s["workout_date"]), "weight_kg": str(s["body_weight_kg"])}
            for s in sessions
        ]

        weekly_avg = (
            WorkoutSession.objects.filter(
                user=request.user,
                workout_date__gte=start,
                workout_date__lte=end,
                body_weight_kg__isnull=False,
            )
            .annotate(week_start=TruncWeek("workout_date"))
            .values("week_start")
            .annotate(avg_weight=Avg("body_weight_kg"))
            .order_by("week_start")
        )

        smoothed = [
            {"week": str(w["week_start"]), "avg_weight_kg": str(w["avg_weight"].quantize(Decimal("0.01")))}
            for w in weekly_avg
        ]

        current_weight = None
        net_change = None
        if daily:
            current_weight = daily[-1]["weight_kg"]
            net_change = str(
                (Decimal(daily[-1]["weight_kg"]) - Decimal(daily[0]["weight_kg"])).quantize(Decimal("0.01"))
            )

        return Response({
            "period": {"start": str(start), "end": str(end)},
            "daily": daily,
            "smoothed_weekly": smoothed,
            "current_weight_kg": current_weight,
            "net_change_kg": net_change,
        })


class ExerciseAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, exercise_id):
        start, end = _parse_period(request)

        exercise = Exercise.objects.filter(
            Q(is_global=True) | Q(created_by=request.user),
            id=exercise_id,
        ).first()
        if not exercise:
            return Response({"error": {"code": "not_found", "message": "Exercise not found.", "details": {}}}, status=404)

        working_sets = (
            ExerciseSet.objects.filter(
                workout_exercise__exercise_id=exercise_id,
                workout_exercise__workout_session__user=request.user,
                workout_exercise__workout_session__workout_date__gte=start,
                workout_exercise__workout_session__workout_date__lte=end,
            )
            .exclude(set_type="warmup")
            .select_related("workout_exercise__workout_session")
            .order_by("workout_exercise__workout_session__workout_date")
        )

        # Group sets by session date
        sessions_data: dict[date, list] = {}
        for s in working_sets:
            d = s.workout_exercise.workout_session.workout_date
            sessions_data.setdefault(d, []).append(s)

        weight_progression = []
        rep_progression = []
        volume_progression = []
        one_rm_progression = []

        best_weight = {"value": Decimal("0"), "date": None}
        best_volume = {"value": Decimal("0"), "date": None}
        best_1rm = {"value": Decimal("0"), "date": None}

        for session_date in sorted(sessions_data.keys()):
            sets = sessions_data[session_date]
            date_str = str(session_date)

            max_weight = Decimal("0")
            top_weight_reps = 0
            session_volume = Decimal("0")
            max_1rm = Decimal("0")

            for s in sets:
                w = s.weight_kg or Decimal("0")
                if w > max_weight:
                    max_weight = w
                    top_weight_reps = s.reps
                elif w == max_weight and s.reps > top_weight_reps:
                    top_weight_reps = s.reps

                set_volume = w * s.reps
                session_volume += set_volume

                if w > 0 and s.reps > 0:
                    orm = estimate_one_rep_max(w, s.reps)
                    if orm > max_1rm:
                        max_1rm = orm

            weight_progression.append({"date": date_str, "max_weight_kg": str(max_weight)})
            rep_progression.append({"date": date_str, "reps_at_top_weight": top_weight_reps})
            volume_progression.append({"date": date_str, "total_volume_kg": str(session_volume.quantize(Decimal("0.01")))})
            one_rm_progression.append({"date": date_str, "estimated_1rm_kg": str(max_1rm)})

            if max_weight > best_weight["value"]:
                best_weight = {"value": max_weight, "date": date_str}
            if session_volume > best_volume["value"]:
                best_volume = {"value": session_volume, "date": date_str}
            if max_1rm > best_1rm["value"]:
                best_1rm = {"value": max_1rm, "date": date_str}

        personal_records = {
            "best_weight": {"value_kg": str(best_weight["value"]), "date": best_weight["date"]},
            "best_single_session_volume": {"value_kg": str(best_volume["value"].quantize(Decimal("0.01"))), "date": best_volume["date"]},
            "best_estimated_1rm": {"value_kg": str(best_1rm["value"]), "date": best_1rm["date"]},
        }

        return Response({
            "exercise": {"id": str(exercise.id), "name": exercise.name},
            "period": {"start": str(start), "end": str(end)},
            "weight_progression": weight_progression,
            "rep_progression": rep_progression,
            "volume_progression": volume_progression,
            "one_rm_progression": one_rm_progression,
            "personal_records": personal_records,
        })


class ConsistencyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start, end = _parse_period(request)
        today = date.today()

        # Workouts in period
        period_sessions = WorkoutSession.objects.filter(
            user=request.user,
            workout_date__gte=start,
            workout_date__lte=end,
        )
        total_workouts = period_sessions.count()

        # Workouts this calendar week (Monday=1)
        week_start = today - timedelta(days=today.weekday())
        workouts_this_week = WorkoutSession.objects.filter(
            user=request.user,
            workout_date__gte=week_start,
            workout_date__lte=today,
        ).count()

        # Workouts this calendar month
        month_start = today.replace(day=1)
        workouts_this_month = WorkoutSession.objects.filter(
            user=request.user,
            workout_date__gte=month_start,
            workout_date__lte=today,
        ).count()

        # Current streak: consecutive ISO weeks with >= 1 workout (going backwards from current)
        all_workout_weeks = (
            WorkoutSession.objects.filter(user=request.user)
            .annotate(week_start=TruncWeek("workout_date"))
            .values_list("week_start", flat=True)
            .distinct()
            .order_by("-week_start")
        )
        week_set = {w for w in all_workout_weeks}

        streak = 0
        check_week = today - timedelta(days=today.weekday())  # current Monday
        while check_week in week_set:
            streak += 1
            check_week -= timedelta(weeks=1)

        # Average workouts per week in period
        days_in_period = max((end - start).days, 1)
        weeks_in_period = max(days_in_period / 7, 1)
        avg_per_week = round(total_workouts / weeks_in_period, 1)

        # Weekly breakdown for charting
        weekly_counts = (
            period_sessions
            .annotate(week_start=TruncWeek("workout_date"))
            .values("week_start")
            .annotate(count=Count("id"))
            .order_by("week_start")
        )

        return Response({
            "period": {"start": str(start), "end": str(end)},
            "workouts_this_week": workouts_this_week,
            "workouts_this_month": workouts_this_month,
            "total_workouts": total_workouts,
            "current_streak_weeks": streak,
            "avg_workouts_per_week": avg_per_week,
            "weekly_breakdown": [
                {"week": str(w["week_start"]), "count": w["count"]}
                for w in weekly_counts
            ],
        })


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        thirty_days_ago = today - timedelta(days=30)
        month_start = today.replace(day=1)

        # --- Body weight ---
        recent_weight = (
            WorkoutSession.objects.filter(
                user=request.user,
                body_weight_kg__isnull=False,
            )
            .order_by("-workout_date")
            .values_list("body_weight_kg", flat=True)
            .first()
        )

        weight_30d_ago = (
            WorkoutSession.objects.filter(
                user=request.user,
                body_weight_kg__isnull=False,
                workout_date__lte=thirty_days_ago,
            )
            .order_by("-workout_date")
            .values_list("body_weight_kg", flat=True)
            .first()
        )

        weight_change_30d = None
        if recent_weight and weight_30d_ago:
            weight_change_30d = str((recent_weight - weight_30d_ago).quantize(Decimal("0.01")))

        # --- Workout count this month ---
        workouts_this_month = WorkoutSession.objects.filter(
            user=request.user,
            workout_date__gte=month_start,
            workout_date__lte=today,
        ).count()

        # --- Weight trend (daily points, last 30 days) ---
        weight_trend = list(
            WorkoutSession.objects.filter(
                user=request.user,
                workout_date__gte=thirty_days_ago,
                body_weight_kg__isnull=False,
            )
            .order_by("workout_date")
            .values("workout_date", "body_weight_kg")
        )

        # --- Workout frequency (weekly counts, last 12 weeks) ---
        twelve_weeks_ago = today - timedelta(weeks=12)
        frequency = list(
            WorkoutSession.objects.filter(
                user=request.user,
                workout_date__gte=twelve_weeks_ago,
            )
            .annotate(week_start=TruncWeek("workout_date"))
            .values("week_start")
            .annotate(count=Count("id"))
            .order_by("week_start")
        )

        # --- Strongest lift (highest estimated 1RM across all exercises, all time) ---
        working_sets = (
            ExerciseSet.objects.filter(
                workout_exercise__workout_session__user=request.user,
                weight_kg__isnull=False,
                weight_kg__gt=0,
                reps__gt=0,
            )
            .exclude(set_type="warmup")
            .select_related("workout_exercise__exercise")
        )

        strongest_lift = None
        max_1rm = Decimal("0")
        for s in working_sets.only(
            "weight_kg", "reps", "set_type",
            "workout_exercise__exercise__id", "workout_exercise__exercise__name",
        ):
            orm = estimate_one_rep_max(s.weight_kg, s.reps)
            if orm > max_1rm:
                max_1rm = orm
                strongest_lift = {
                    "exercise_id": str(s.workout_exercise.exercise.id),
                    "exercise_name": s.workout_exercise.exercise.name,
                    "estimated_1rm_kg": str(orm),
                }

        # --- Latest PR: most recent "best" set by 1RM per exercise ---
        latest_pr = None
        recent_working = (
            ExerciseSet.objects.filter(
                workout_exercise__workout_session__user=request.user,
                weight_kg__isnull=False,
                weight_kg__gt=0,
                reps__gt=0,
            )
            .exclude(set_type="warmup")
            .select_related(
                "workout_exercise__exercise",
                "workout_exercise__workout_session",
            )
            .order_by("-workout_exercise__workout_session__workout_date")
        )

        exercise_best_1rm: dict[str, Decimal] = {}
        for s in recent_working.only(
            "weight_kg", "reps", "set_type",
            "workout_exercise__exercise__id", "workout_exercise__exercise__name",
            "workout_exercise__workout_session__workout_date",
        ):
            ex_id = str(s.workout_exercise.exercise.id)
            orm = estimate_one_rep_max(s.weight_kg, s.reps)
            prev_best = exercise_best_1rm.get(ex_id, Decimal("0"))
            if orm > prev_best:
                exercise_best_1rm[ex_id] = orm
                if latest_pr is None or (
                    s.workout_exercise.workout_session.workout_date >
                    date.fromisoformat(latest_pr["date"])
                ):
                    latest_pr = {
                        "exercise_name": s.workout_exercise.exercise.name,
                        "estimated_1rm_kg": str(orm),
                        "weight_kg": str(s.weight_kg),
                        "reps": s.reps,
                        "date": str(s.workout_exercise.workout_session.workout_date),
                    }

        # --- Top 5 exercises by recent activity ---
        top_exercises = (
            WorkoutExercise.objects.filter(
                workout_session__user=request.user,
                workout_session__workout_date__gte=thirty_days_ago,
            )
            .values("exercise__id", "exercise__name")
            .annotate(session_count=Count("workout_session", distinct=True))
            .order_by("-session_count")[:5]
        )

        top_5 = []
        for tex in top_exercises:
            ex_id = tex["exercise__id"]
            recent_max = (
                ExerciseSet.objects.filter(
                    workout_exercise__exercise_id=ex_id,
                    workout_exercise__workout_session__user=request.user,
                    weight_kg__isnull=False,
                )
                .exclude(set_type="warmup")
                .order_by("-workout_exercise__workout_session__workout_date")
                .values_list("weight_kg", flat=True)
                .first()
            )
            top_5.append({
                "exercise_id": str(ex_id),
                "exercise_name": tex["exercise__name"],
                "session_count_30d": tex["session_count"],
                "recent_max_weight_kg": str(recent_max) if recent_max else None,
            })

        return Response({
            "current_weight_kg": str(recent_weight) if recent_weight else None,
            "weight_change_30d_kg": weight_change_30d,
            "workouts_this_month": workouts_this_month,
            "strongest_lift": strongest_lift,
            "latest_pr": latest_pr,
            "weight_trend": [
                {"date": str(w["workout_date"]), "weight_kg": str(w["body_weight_kg"])}
                for w in weight_trend
            ],
            "workout_frequency": [
                {"week": str(w["week_start"]), "count": w["count"]}
                for w in frequency
            ],
            "top_exercises": top_5,
        })
