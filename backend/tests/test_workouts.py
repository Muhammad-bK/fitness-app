import pytest
from decimal import Decimal
from rest_framework import status

from apps.workouts.models import WorkoutSession, ExerciseSet

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
def global_exercise():
    return ExerciseFactory(is_global=True, name="Bench Press")


class TestWorkoutCreate:
    URL = "/api/workouts/"

    def test_create_full_workout(self, authenticated_client, global_exercise):
        """Nested write: create a session with exercises and sets in one POST."""
        payload = {
            "session_name": "Push Day",
            "workout_date": "2026-06-20",
            "body_weight": 78.2,
            "body_weight_unit": "kg",
            "exercises": [
                {
                    "exercise_id": str(global_exercise.id),
                    "order_in_session": 1,
                    "sets": [
                        {"set_number": 1, "set_type": "warmup", "weight": 40, "weight_unit": "kg", "reps": 10},
                        {"set_number": 2, "set_type": "working", "weight": 80, "weight_unit": "kg", "reps": 8},
                    ],
                }
            ],
        }
        resp = authenticated_client.post(self.URL, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["session_name"] == "Push Day"
        assert len(resp.data["workout_exercises"]) == 1
        assert len(resp.data["workout_exercises"][0]["sets"]) == 2

    def test_weight_conversion_lbs_to_kg(self, authenticated_client, global_exercise):
        """Weight entered in lbs is stored as kg internally."""
        payload = {
            "session_name": "Test",
            "workout_date": "2026-06-20",
            "exercises": [
                {
                    "exercise_id": str(global_exercise.id),
                    "order_in_session": 1,
                    "sets": [
                        {"set_number": 1, "set_type": "working", "weight": 176, "weight_unit": "lbs", "reps": 5},
                    ],
                }
            ],
        }
        resp = authenticated_client.post(self.URL, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED

        stored_set = ExerciseSet.objects.first()
        # 176 lbs ≈ 79.83 kg
        assert stored_set.weight_kg == Decimal("79.83")
        assert stored_set.weight_unit == "lbs"

    def test_body_weight_conversion(self, authenticated_client, global_exercise):
        payload = {
            "session_name": "Test",
            "workout_date": "2026-06-20",
            "body_weight": 172,
            "body_weight_unit": "lbs",
            "exercises": [
                {
                    "exercise_id": str(global_exercise.id),
                    "order_in_session": 1,
                    "sets": [
                        {"set_number": 1, "set_type": "working", "reps": 10},
                    ],
                }
            ],
        }
        resp = authenticated_client.post(self.URL, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        session = WorkoutSession.objects.get(id=resp.data["id"])
        # 172 lbs ≈ 78.02 kg
        assert session.body_weight_kg == Decimal("78.02")
        assert session.body_weight_unit == "lbs"

    def test_missing_exercises_rejected(self, authenticated_client):
        payload = {
            "session_name": "Bad",
            "workout_date": "2026-06-20",
            "exercises": [],
        }
        resp = authenticated_client.post(self.URL, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_unauthenticated_rejected(self, api_client, global_exercise):
        payload = {
            "session_name": "No Auth",
            "workout_date": "2026-06-20",
            "exercises": [
                {
                    "exercise_id": str(global_exercise.id),
                    "order_in_session": 1,
                    "sets": [{"set_number": 1, "reps": 5}],
                }
            ],
        }
        resp = api_client.post(self.URL, payload, format="json")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


class TestWorkoutList:
    URL = "/api/workouts/"

    def test_list_own_workouts(self, authenticated_client):
        WorkoutSessionFactory(user=authenticated_client.user, session_name="Mine")
        other = UserFactory()
        WorkoutSessionFactory(user=other, session_name="Theirs")

        resp = authenticated_client.get(self.URL)
        assert resp.status_code == status.HTTP_200_OK
        names = [w["session_name"] for w in resp.data["results"]]
        assert "Mine" in names
        assert "Theirs" not in names

    def test_date_range_filter(self, authenticated_client):
        WorkoutSessionFactory(user=authenticated_client.user, workout_date="2026-01-15")
        WorkoutSessionFactory(user=authenticated_client.user, workout_date="2026-06-15")
        resp = authenticated_client.get(self.URL, {"start": "2026-06-01", "end": "2026-06-30"})
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["results"]) == 1


class TestWorkoutDetail:
    def test_get_detail_with_nested_data(self, authenticated_client, global_exercise):
        session = WorkoutSessionFactory(user=authenticated_client.user)
        we = WorkoutExerciseFactory(workout_session=session, exercise=global_exercise)
        ExerciseSetFactory(workout_exercise=we, set_number=1, weight_kg=Decimal("80"), reps=8)
        ExerciseSetFactory(workout_exercise=we, set_number=2, weight_kg=Decimal("80"), reps=6)

        resp = authenticated_client.get(f"/api/workouts/{session.id}/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["workout_exercises"]) == 1
        assert len(resp.data["workout_exercises"][0]["sets"]) == 2

    def test_delete_cascades(self, authenticated_client, global_exercise):
        session = WorkoutSessionFactory(user=authenticated_client.user)
        we = WorkoutExerciseFactory(workout_session=session, exercise=global_exercise)
        ExerciseSetFactory(workout_exercise=we)

        resp = authenticated_client.delete(f"/api/workouts/{session.id}/")
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert not WorkoutSession.objects.filter(id=session.id).exists()
        assert not ExerciseSet.objects.filter(workout_exercise=we).exists()


class TestUserDataIsolation:
    """Critical test: user A cannot read or modify user B's data."""

    def test_cannot_read_other_users_workout(self, api_client):
        user_a = UserFactory()
        user_b = UserFactory()
        session = WorkoutSessionFactory(user=user_b, session_name="B's Session")

        api_client.force_authenticate(user=user_a)
        resp = api_client.get(f"/api/workouts/{session.id}/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_cannot_delete_other_users_workout(self, api_client):
        user_a = UserFactory()
        user_b = UserFactory()
        session = WorkoutSessionFactory(user=user_b)

        api_client.force_authenticate(user=user_a)
        resp = api_client.delete(f"/api/workouts/{session.id}/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        assert WorkoutSession.objects.filter(id=session.id).exists()

    def test_cannot_read_other_users_custom_exercise(self, api_client):
        user_a = UserFactory()
        user_b = UserFactory()
        ex = ExerciseFactory(is_global=False, created_by=user_b, name="B's Custom")

        api_client.force_authenticate(user=user_a)
        resp = api_client.get(f"/api/exercises/{ex.id}/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND
