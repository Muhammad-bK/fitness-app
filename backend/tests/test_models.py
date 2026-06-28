"""Unit tests for model behaviour: managers, signals, and __str__ representations."""

from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model

from apps.accounts.models import (
    Equipment,
    MuscleGroup,
    UserEquipment,
    UserProfile,
    UserTargetMuscleGroup,
)

from .factories import (
    EquipmentFactory,
    ExerciseFactory,
    ExerciseSetFactory,
    MuscleGroupFactory,
    UserFactory,
    WorkoutExerciseFactory,
    WorkoutSessionFactory,
)

User = get_user_model()

pytestmark = pytest.mark.django_db


@pytest.fixture
def user_factory():
    return UserFactory


class TestUserManager:
    def test_create_user_sets_password_and_normalizes_email(self):
        user = User.objects.create_user(email="Mixed@Example.COM", password="secret123")
        # normalize_email lowercases the domain portion.
        assert user.email == "Mixed@example.com"
        assert user.check_password("secret123") is True
        assert user.is_staff is False
        assert user.is_superuser is False

    def test_create_user_without_email_raises(self):
        with pytest.raises(ValueError):
            User.objects.create_user(email="", password="secret123")

    def test_create_superuser_flags(self):
        admin = User.objects.create_superuser(email="admin@test.com", password="secret123")
        assert admin.is_staff is True
        assert admin.is_superuser is True


class TestUserProfileSignal:
    def test_profile_created_on_user_creation(self):
        user = UserFactory()
        assert UserProfile.objects.filter(user=user).exists()
        assert user.profile is not None

    def test_profile_not_duplicated_on_save(self):
        user = UserFactory()
        user.display_name = "Renamed"
        user.save()
        assert UserProfile.objects.filter(user=user).count() == 1


class TestStrRepresentations:
    def test_user_str_prefers_display_name(self):
        user = UserFactory(display_name="Jane Lifter", email="jane@test.com")
        assert str(user) == "Jane Lifter"

    def test_user_str_falls_back_to_email(self):
        user = UserFactory(display_name="", email="noname@test.com")
        assert str(user) == "noname@test.com"

    def test_exercise_str(self):
        ex = ExerciseFactory(name="Bench Press")
        assert str(ex) == "Bench Press"

    def test_workout_session_str(self):
        session = WorkoutSessionFactory(session_name="Push Day", workout_date="2026-06-20")
        assert "Push Day" in str(session)
        assert "2026-06-20" in str(session)

    def test_workout_exercise_str(self):
        ex = ExerciseFactory(name="Squat")
        we = WorkoutExerciseFactory(exercise=ex, order_in_session=2)
        assert str(we) == "Squat (#2)"

    def test_exercise_set_str_with_weight(self):
        s = ExerciseSetFactory(set_number=1, weight_kg=Decimal("80.00"), reps=8)
        assert str(s) == "Set 1: 80.00kg × 8"

    def test_exercise_set_str_bodyweight(self):
        s = ExerciseSetFactory(set_number=3, weight_kg=None, reps=12)
        assert str(s) == "Set 3: BW × 12"

    def test_equipment_str(self):
        eq = EquipmentFactory(name="Barbell")
        assert str(eq) == "Barbell"

    def test_muscle_group_str(self):
        mg = MuscleGroupFactory(name="Chest")
        assert str(mg) == "Chest"

    def test_user_profile_str(self):
        user = UserFactory(email="profile@test.com")
        assert str(user.profile) == "profile@test.com profile"

    def test_user_equipment_str(self):
        user = UserFactory(email="ue@test.com")
        eq = EquipmentFactory(name="Kettlebell")
        link = UserEquipment.objects.create(profile=user.profile, equipment=eq)
        assert str(link) == "ue@test.com — Kettlebell"

    def test_user_target_muscle_group_str(self):
        user = UserFactory(email="tmg@test.com")
        mg = MuscleGroupFactory(name="Back")
        link = UserTargetMuscleGroup.objects.create(profile=user.profile, muscle_group=mg)
        assert str(link) == "tmg@test.com — Back"


class TestProfileRelations:
    def test_equipment_unique_per_profile(self):
        user = UserFactory()
        eq = EquipmentFactory()
        UserEquipment.objects.create(profile=user.profile, equipment=eq)
        with pytest.raises(Exception):
            UserEquipment.objects.create(profile=user.profile, equipment=eq)

    def test_profile_cascade_deletes_with_user(self):
        user = UserFactory()
        profile_id = user.profile.id
        user.delete()
        assert not UserProfile.objects.filter(id=profile_id).exists()

    def test_global_models_have_default_ordering(self):
        EquipmentFactory(name="Zebra Bar")
        EquipmentFactory(name="Alpha Bar")
        names = list(Equipment.objects.values_list("name", flat=True))
        assert names == sorted(names)

        MuscleGroupFactory(name="Zeta")
        MuscleGroupFactory(name="Alpha")
        mg_names = list(MuscleGroup.objects.values_list("name", flat=True))
        assert mg_names == sorted(mg_names)
