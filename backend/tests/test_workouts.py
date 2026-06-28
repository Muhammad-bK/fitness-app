from decimal import Decimal

import pytest
from rest_framework import status

from apps.workouts.models import ExerciseSet, WorkoutSession

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


class TestWorkoutValidation:
    URL = "/api/workouts/"

    def test_weight_without_unit_rejected(self, authenticated_client, global_exercise):
        payload = {
            "session_name": "Bad set",
            "workout_date": "2026-06-20",
            "exercises": [
                {
                    "exercise_id": str(global_exercise.id),
                    "order_in_session": 1,
                    "sets": [{"set_number": 1, "set_type": "working", "weight": 80, "reps": 5}],
                }
            ],
        }
        resp = authenticated_client.post(self.URL, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_body_weight_without_unit_rejected(self, authenticated_client, global_exercise):
        payload = {
            "session_name": "Bad bw",
            "workout_date": "2026-06-20",
            "body_weight": 80,
            "exercises": [
                {
                    "exercise_id": str(global_exercise.id),
                    "order_in_session": 1,
                    "sets": [{"set_number": 1, "set_type": "working", "reps": 5}],
                }
            ],
        }
        resp = authenticated_client.post(self.URL, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_exercise_with_no_sets_rejected(self, authenticated_client, global_exercise):
        payload = {
            "session_name": "No sets",
            "workout_date": "2026-06-20",
            "exercises": [{"exercise_id": str(global_exercise.id), "order_in_session": 1, "sets": []}],
        }
        resp = authenticated_client.post(self.URL, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_inaccessible_exercise_rejected(self, authenticated_client):
        """Referencing another user's custom exercise is rejected."""
        other = UserFactory()
        foreign = ExerciseFactory(is_global=False, created_by=other, name="Foreign")
        payload = {
            "session_name": "Sneaky",
            "workout_date": "2026-06-20",
            "exercises": [
                {
                    "exercise_id": str(foreign.id),
                    "order_in_session": 1,
                    "sets": [{"set_number": 1, "set_type": "working", "weight": 50, "weight_unit": "kg", "reps": 5}],
                }
            ],
        }
        resp = authenticated_client.post(self.URL, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_bodyweight_set_without_weight_allowed(self, authenticated_client, global_exercise):
        """A set with no weight (pure bodyweight) is valid."""
        payload = {
            "session_name": "BW",
            "workout_date": "2026-06-20",
            "exercises": [
                {
                    "exercise_id": str(global_exercise.id),
                    "order_in_session": 1,
                    "sets": [{"set_number": 1, "set_type": "working", "reps": 12}],
                }
            ],
        }
        resp = authenticated_client.post(self.URL, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        stored_set = ExerciseSet.objects.first()
        assert stored_set.weight_kg is None
        assert stored_set.reps == 12


class TestWorkoutUpdate:
    """PUT replaces the whole workout (replace strategy on nested exercises/sets)."""

    def _build_session(self, user, global_exercise):
        session = WorkoutSessionFactory(user=user, session_name="Original")
        we = WorkoutExerciseFactory(workout_session=session, exercise=global_exercise)
        ExerciseSetFactory(workout_exercise=we, set_number=1, weight_kg=Decimal("60"), reps=10)
        ExerciseSetFactory(workout_exercise=we, set_number=2, weight_kg=Decimal("60"), reps=8)
        return session

    def test_update_replaces_exercises_and_sets(self, authenticated_client, global_exercise):
        session = self._build_session(authenticated_client.user, global_exercise)
        payload = {
            "session_name": "Updated Push",
            "workout_date": "2026-06-21",
            "exercises": [
                {
                    "exercise_id": str(global_exercise.id),
                    "order_in_session": 1,
                    "sets": [{"set_number": 1, "set_type": "working", "weight": 90, "weight_unit": "kg", "reps": 5}],
                }
            ],
        }
        resp = authenticated_client.put(f"/api/workouts/{session.id}/", payload, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["session_name"] == "Updated Push"
        # Old two sets replaced with one new set.
        assert ExerciseSet.objects.filter(workout_exercise__workout_session=session).count() == 1
        new_set = ExerciseSet.objects.get(workout_exercise__workout_session=session)
        assert new_set.weight_kg == Decimal("90.00")
        assert new_set.reps == 5

    def test_update_converts_lbs_to_kg(self, authenticated_client, global_exercise):
        session = self._build_session(authenticated_client.user, global_exercise)
        payload = {
            "session_name": "Lbs update",
            "workout_date": "2026-06-21",
            "exercises": [
                {
                    "exercise_id": str(global_exercise.id),
                    "order_in_session": 1,
                    "sets": [{"set_number": 1, "set_type": "working", "weight": 176, "weight_unit": "lbs", "reps": 3}],
                }
            ],
        }
        resp = authenticated_client.put(f"/api/workouts/{session.id}/", payload, format="json")
        assert resp.status_code == status.HTTP_200_OK
        new_set = ExerciseSet.objects.get(workout_exercise__workout_session=session)
        # 176 lbs ≈ 79.83 kg
        assert new_set.weight_kg == Decimal("79.83")

    def test_update_rejects_inaccessible_exercise(self, authenticated_client, global_exercise):
        session = self._build_session(authenticated_client.user, global_exercise)
        other = UserFactory()
        foreign = ExerciseFactory(is_global=False, created_by=other, name="Foreign")
        payload = {
            "session_name": "Bad",
            "workout_date": "2026-06-21",
            "exercises": [
                {
                    "exercise_id": str(foreign.id),
                    "order_in_session": 1,
                    "sets": [{"set_number": 1, "set_type": "working", "weight": 50, "weight_unit": "kg", "reps": 5}],
                }
            ],
        }
        resp = authenticated_client.put(f"/api/workouts/{session.id}/", payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_update_other_users_workout(self, api_client, global_exercise):
        owner = UserFactory()
        session = WorkoutSessionFactory(user=owner, session_name="Owner's")
        attacker = UserFactory()
        api_client.force_authenticate(user=attacker)
        payload = {
            "session_name": "Hijacked",
            "workout_date": "2026-06-21",
            "exercises": [
                {
                    "exercise_id": str(global_exercise.id),
                    "order_in_session": 1,
                    "sets": [{"set_number": 1, "set_type": "working", "weight": 50, "weight_unit": "kg", "reps": 5}],
                }
            ],
        }
        resp = api_client.put(f"/api/workouts/{session.id}/", payload, format="json")
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        session.refresh_from_db()
        assert session.session_name == "Owner's"


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
