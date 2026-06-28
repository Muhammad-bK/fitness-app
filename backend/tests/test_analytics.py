"""
Analytics endpoint tests with hand-computed fixtures.

Fixture layout (user has 3 sessions over 3 weeks):
  Session 1: 2026-06-01 (Mon, week 23), body_weight=80.00 kg
    Bench Press: warmup 40kg×10, working 80kg×8, working 80kg×6
  Session 2: 2026-06-08 (Mon, week 24), body_weight=80.50 kg
    Bench Press: warmup 40kg×10, working 85kg×5, working 82.5kg×7
  Session 3: 2026-06-15 (Mon, week 25), body_weight=81.00 kg
    Squat: working 100kg×5, working 100kg×5

Hand-computed expected values (Epley: 1RM = w × (1 + r/30)):
  Bench S1: 80×(1+8/30) = 80×1.2667 = 101.33, 80×(1+6/30) = 80×1.2 = 96.00 → max 1RM = 101.33
  Bench S2: 85×(1+5/30) = 85×1.1667 = 99.17, 82.5×(1+7/30) = 82.5×1.2333 = 101.75 → max 1RM = 101.75
  Squat S3: 100×(1+5/30) = 100×1.1667 = 116.67

  Bench PRs: best weight=85kg (S2), best volume S1=80×8+80×6=1120, S2=85×5+82.5×7=1002.5 → best=1120
  Bench best 1RM: 101.75 (S2)
"""

from datetime import date, timedelta
from decimal import Decimal

import pytest
from rest_framework import status

from .factories import (
    ExerciseFactory,
    ExerciseSetFactory,
    UserFactory,
    WorkoutExerciseFactory,
    WorkoutSessionFactory,
)

pytestmark = pytest.mark.django_db


@pytest.fixture
def user_factory():
    return UserFactory


@pytest.fixture
def analytics_data(authenticated_client):
    """Create the 3-session fixture described in the module docstring."""
    user = authenticated_client.user
    bench = ExerciseFactory(name="Bench Press", muscle_group="chest", is_global=True)
    squat = ExerciseFactory(name="Squat", muscle_group="quads", is_global=True)

    # Session 1: 2026-06-01
    s1 = WorkoutSessionFactory(
        user=user,
        workout_date=date(2026, 6, 1),
        body_weight_kg=Decimal("80.00"),
        body_weight_unit="kg",
    )
    we1 = WorkoutExerciseFactory(workout_session=s1, exercise=bench, order_in_session=1)
    ExerciseSetFactory(workout_exercise=we1, set_number=1, set_type="warmup", weight_kg=Decimal("40.00"), reps=10)
    ExerciseSetFactory(workout_exercise=we1, set_number=2, set_type="working", weight_kg=Decimal("80.00"), reps=8)
    ExerciseSetFactory(workout_exercise=we1, set_number=3, set_type="working", weight_kg=Decimal("80.00"), reps=6)

    # Session 2: 2026-06-08
    s2 = WorkoutSessionFactory(
        user=user,
        workout_date=date(2026, 6, 8),
        body_weight_kg=Decimal("80.50"),
        body_weight_unit="kg",
    )
    we2 = WorkoutExerciseFactory(workout_session=s2, exercise=bench, order_in_session=1)
    ExerciseSetFactory(workout_exercise=we2, set_number=1, set_type="warmup", weight_kg=Decimal("40.00"), reps=10)
    ExerciseSetFactory(workout_exercise=we2, set_number=2, set_type="working", weight_kg=Decimal("85.00"), reps=5)
    ExerciseSetFactory(workout_exercise=we2, set_number=3, set_type="working", weight_kg=Decimal("82.50"), reps=7)

    # Session 3: 2026-06-15
    s3 = WorkoutSessionFactory(
        user=user,
        workout_date=date(2026, 6, 15),
        body_weight_kg=Decimal("81.00"),
        body_weight_unit="kg",
    )
    we3 = WorkoutExerciseFactory(workout_session=s3, exercise=squat, order_in_session=1)
    ExerciseSetFactory(workout_exercise=we3, set_number=1, set_type="working", weight_kg=Decimal("100.00"), reps=5)
    ExerciseSetFactory(workout_exercise=we3, set_number=2, set_type="working", weight_kg=Decimal("100.00"), reps=5)

    return {"bench": bench, "squat": squat, "sessions": [s1, s2, s3]}


class TestBodyWeight:
    URL = "/api/analytics/bodyweight/"

    def test_returns_daily_series_and_smoothed(self, authenticated_client, analytics_data):
        resp = authenticated_client.get(self.URL, {"start": "2026-06-01", "end": "2026-06-30"})
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["daily"]) == 3
        assert resp.data["daily"][0]["weight_kg"] == "80.00"
        assert resp.data["daily"][2]["weight_kg"] == "81.00"
        assert resp.data["current_weight_kg"] == "81.00"
        assert resp.data["net_change_kg"] == "1.00"
        assert len(resp.data["smoothed_weekly"]) >= 1

    def test_period_filtering(self, authenticated_client, analytics_data):
        resp = authenticated_client.get(self.URL, {"start": "2026-06-05", "end": "2026-06-10"})
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["daily"]) == 1
        assert resp.data["daily"][0]["date"] == "2026-06-08"

    def test_unauthenticated(self, api_client):
        resp = api_client.get(self.URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


class TestExerciseAnalytics:
    def _url(self, exercise_id):
        return f"/api/analytics/exercise/{exercise_id}/"

    def test_weight_and_1rm_progression(self, authenticated_client, analytics_data):
        bench_id = analytics_data["bench"].id
        resp = authenticated_client.get(self._url(bench_id), {"start": "2026-06-01", "end": "2026-06-30"})
        assert resp.status_code == status.HTTP_200_OK

        # 2 sessions had bench press (warmups excluded from results)
        assert len(resp.data["weight_progression"]) == 2
        assert resp.data["weight_progression"][0]["max_weight_kg"] == "80.00"
        assert resp.data["weight_progression"][1]["max_weight_kg"] == "85.00"

        # 1RM: S1 max = 101.33, S2 max = 101.75
        assert resp.data["one_rm_progression"][0]["estimated_1rm_kg"] == "101.33"
        assert resp.data["one_rm_progression"][1]["estimated_1rm_kg"] == "101.75"

    def test_volume_progression(self, authenticated_client, analytics_data):
        bench_id = analytics_data["bench"].id
        resp = authenticated_client.get(self._url(bench_id), {"start": "2026-06-01", "end": "2026-06-30"})

        # S1 volume: 80×8 + 80×6 = 640 + 480 = 1120
        assert resp.data["volume_progression"][0]["total_volume_kg"] == "1120.00"
        # S2 volume: 85×5 + 82.5×7 = 425 + 577.5 = 1002.50
        assert resp.data["volume_progression"][1]["total_volume_kg"] == "1002.50"

    def test_personal_records(self, authenticated_client, analytics_data):
        bench_id = analytics_data["bench"].id
        resp = authenticated_client.get(self._url(bench_id), {"start": "2026-06-01", "end": "2026-06-30"})
        pr = resp.data["personal_records"]

        assert pr["best_weight"]["value_kg"] == "85.00"
        assert pr["best_weight"]["date"] == "2026-06-08"
        assert pr["best_single_session_volume"]["value_kg"] == "1120.00"
        assert pr["best_single_session_volume"]["date"] == "2026-06-01"
        assert pr["best_estimated_1rm"]["value_kg"] == "101.75"
        assert pr["best_estimated_1rm"]["date"] == "2026-06-08"

    def test_warmup_excluded(self, authenticated_client, analytics_data):
        """Warmup sets (40kg) should not appear in max weight or volume."""
        bench_id = analytics_data["bench"].id
        resp = authenticated_client.get(self._url(bench_id), {"start": "2026-06-01", "end": "2026-06-30"})
        for point in resp.data["weight_progression"]:
            assert Decimal(point["max_weight_kg"]) >= Decimal("80")

    def test_rep_at_top_weight(self, authenticated_client, analytics_data):
        bench_id = analytics_data["bench"].id
        resp = authenticated_client.get(self._url(bench_id), {"start": "2026-06-01", "end": "2026-06-30"})
        # S1: top weight 80kg, best reps at that weight = 8
        assert resp.data["rep_progression"][0]["reps_at_top_weight"] == 8
        # S2: top weight 85kg, reps = 5
        assert resp.data["rep_progression"][1]["reps_at_top_weight"] == 5

    def test_exercise_not_found(self, authenticated_client):
        import uuid

        resp = authenticated_client.get(f"/api/analytics/exercise/{uuid.uuid4()}/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_user_isolation(self, authenticated_client, analytics_data):
        """Another user's exercises shouldn't appear."""
        other = UserFactory()
        other_session = WorkoutSessionFactory(user=other, workout_date=date(2026, 6, 10))
        we = WorkoutExerciseFactory(
            workout_session=other_session,
            exercise=analytics_data["bench"],
        )
        ExerciseSetFactory(workout_exercise=we, weight_kg=Decimal("200.00"), reps=1)

        bench_id = analytics_data["bench"].id
        resp = authenticated_client.get(self._url(bench_id), {"start": "2026-06-01", "end": "2026-06-30"})
        # Should still only have 2 data points (our user), not the other user's 200kg
        assert len(resp.data["weight_progression"]) == 2
        for point in resp.data["weight_progression"]:
            assert Decimal(point["max_weight_kg"]) < Decimal("200")


class TestConsistency:
    URL = "/api/analytics/consistency/"

    def test_totals_and_averages(self, authenticated_client, analytics_data):
        resp = authenticated_client.get(self.URL, {"start": "2026-06-01", "end": "2026-06-30"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["total_workouts"] == 3
        assert len(resp.data["weekly_breakdown"]) >= 1

    def test_streak_calculation(self, authenticated_client, analytics_data):
        """Streak is consecutive ISO weeks with ≥1 workout going back from current week."""
        resp = authenticated_client.get(self.URL)
        # Streak depends on current date vs fixture dates — just verify it's a non-negative int
        assert isinstance(resp.data["current_streak_weeks"], int)
        assert resp.data["current_streak_weeks"] >= 0

    def test_unauthenticated(self, api_client):
        resp = api_client.get(self.URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


class TestDashboard:
    URL = "/api/analytics/dashboard/"

    def test_returns_all_sections(self, authenticated_client, analytics_data):
        resp = authenticated_client.get(self.URL)
        assert resp.status_code == status.HTTP_200_OK
        data = resp.data

        assert data["current_weight_kg"] is not None
        assert "workouts_this_month" in data
        assert "weight_trend" in data
        assert "workout_frequency" in data
        assert "top_exercises" in data
        assert isinstance(data["top_exercises"], list)

    def test_strongest_lift(self, authenticated_client, analytics_data):
        resp = authenticated_client.get(self.URL)
        sl = resp.data["strongest_lift"]
        assert sl is not None
        # Squat 100kg×5 → 1RM = 116.67, which beats bench 101.75
        assert sl["exercise_name"] == "Squat"
        assert sl["estimated_1rm_kg"] == "116.67"

    def test_unauthenticated(self, api_client):
        resp = api_client.get(self.URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_empty_data(self, authenticated_client):
        """Dashboard should not crash with zero workouts."""
        resp = authenticated_client.get(self.URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["current_weight_kg"] is None
        assert resp.data["workouts_this_month"] == 0

    def test_query_count(self, authenticated_client, analytics_data, django_assert_max_num_queries):
        with django_assert_max_num_queries(25):
            authenticated_client.get(self.URL)


class TestPeriodParsing:
    """Exercise _parse_period via the consistency endpoint's returned period."""

    URL = "/api/analytics/consistency/"

    def test_default_period_is_last_30_days(self, authenticated_client):
        resp = authenticated_client.get(self.URL)
        today = date.today()
        assert resp.data["period"]["end"] == str(today)
        assert resp.data["period"]["start"] == str(today - timedelta(days=30))

    def test_week_period(self, authenticated_client):
        resp = authenticated_client.get(self.URL, {"period": "week"})
        today = date.today()
        assert resp.data["period"]["start"] == str(today - timedelta(days=7))

    def test_year_period(self, authenticated_client):
        resp = authenticated_client.get(self.URL, {"period": "year"})
        today = date.today()
        assert resp.data["period"]["start"] == str(today - timedelta(days=365))

    def test_all_period(self, authenticated_client):
        resp = authenticated_client.get(self.URL, {"period": "all"})
        assert resp.data["period"]["start"] == "2000-01-01"

    def test_explicit_start_end_override_period(self, authenticated_client):
        resp = authenticated_client.get(self.URL, {"period": "week", "start": "2026-01-01", "end": "2026-03-31"})
        assert resp.data["period"]["start"] == "2026-01-01"
        assert resp.data["period"]["end"] == "2026-03-31"


class TestDashboardRecentData:
    """Time-robust dashboard checks using data anchored at today()."""

    URL = "/api/analytics/dashboard/"

    @pytest.fixture
    def recent_data(self, authenticated_client):
        user = authenticated_client.user
        bench = ExerciseFactory(name="Bench Press", muscle_group="chest", is_global=True)
        session = WorkoutSessionFactory(
            user=user,
            workout_date=date.today(),
            body_weight_kg=Decimal("80.00"),
            body_weight_unit="kg",
        )
        we = WorkoutExerciseFactory(workout_session=session, exercise=bench, order_in_session=1)
        ExerciseSetFactory(workout_exercise=we, set_number=1, set_type="warmup", weight_kg=Decimal("40.00"), reps=10)
        ExerciseSetFactory(workout_exercise=we, set_number=2, set_type="working", weight_kg=Decimal("100.00"), reps=5)
        return {"bench": bench}

    def test_latest_pr_excludes_warmups(self, authenticated_client, recent_data):
        resp = authenticated_client.get(self.URL)
        pr = resp.data["latest_pr"]
        assert pr is not None
        assert pr["exercise_name"] == "Bench Press"
        # Best working set was 100kg×5, not the 40kg warmup.
        assert pr["weight_kg"] == "100.00"
        assert pr["reps"] == 5

    def test_top_exercises_counts_recent_sessions(self, authenticated_client, recent_data):
        resp = authenticated_client.get(self.URL)
        top = resp.data["top_exercises"]
        assert len(top) >= 1
        bench_entry = next(e for e in top if e["exercise_name"] == "Bench Press")
        assert bench_entry["session_count_30d"] == 1
        # Recent max weight ignores warmups.
        assert bench_entry["recent_max_weight_kg"] == "100.00"
