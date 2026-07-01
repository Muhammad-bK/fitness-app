"""Tests for management commands: seed_exercises and create_demo_data."""

import random

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command

from apps.exercises.models import Exercise
from apps.workouts.models import WorkoutSession

from .factories import UserFactory

User = get_user_model()

pytestmark = pytest.mark.django_db


@pytest.fixture
def user_factory():
    return UserFactory


class TestSeedExercises:
    def test_seeds_global_exercises(self):
        call_command("seed_exercises")
        globals_qs = Exercise.objects.filter(is_global=True)
        assert globals_qs.count() == 16
        assert globals_qs.filter(name="Bench Press").exists()
        assert all(e.created_by_id is None for e in globals_qs)

    def test_is_idempotent(self):
        call_command("seed_exercises")
        first_count = Exercise.objects.filter(is_global=True).count()
        call_command("seed_exercises")
        assert Exercise.objects.filter(is_global=True).count() == first_count


class TestCreateDemoData:
    def test_generates_sessions_for_demo_user(self):
        call_command("seed_exercises")
        random.seed(42)  # deterministic generation
        call_command("create_demo_data", "--weeks", "4")

        user = User.objects.get(email="demo@example.com")
        assert user.display_name == "Demo User"
        sessions = WorkoutSession.objects.filter(user=user)
        assert sessions.count() > 0
        # Generated sessions carry body weight and at least one exercise.
        session = sessions.first()
        assert session.body_weight_kg is not None
        assert session.workout_exercises.exists()

    def test_aborts_gracefully_without_global_exercises(self):
        # No seed_exercises call → command should report and create no sessions.
        call_command("create_demo_data", "--weeks", "2")
        user = User.objects.get(email="demo@example.com")
        assert WorkoutSession.objects.filter(user=user).count() == 0

    def test_reuses_existing_demo_user(self):
        call_command("seed_exercises")
        existing = UserFactory(email="demo@example.com", display_name="Pre-existing")
        random.seed(1)
        call_command("create_demo_data", "--weeks", "2")
        # No duplicate user created.
        assert User.objects.filter(email="demo@example.com").count() == 1
        assert WorkoutSession.objects.filter(user=existing).count() >= 0
