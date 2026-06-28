from decimal import Decimal

import factory
from django.contrib.auth import get_user_model

from apps.accounts.models import Equipment, MuscleGroup
from apps.exercises.models import Exercise
from apps.workouts.models import ExerciseSet, WorkoutExercise, WorkoutSession

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@test.com")
    display_name = factory.Faker("first_name")
    unit_preference = "kg"

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        password = kwargs.pop("password", "testpass123")
        user = super()._create(model_class, *args, **kwargs)
        user.set_password(password)
        user.save()
        return user


class EquipmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Equipment

    name = factory.Sequence(lambda n: f"Equipment {n}")


class MuscleGroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = MuscleGroup

    name = factory.Sequence(lambda n: f"Muscle Group {n}")


class ExerciseFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Exercise

    name = factory.Sequence(lambda n: f"Exercise {n}")
    muscle_group = "chest"
    category = "barbell"
    is_global = True
    created_by = None


class WorkoutSessionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = WorkoutSession

    user = factory.SubFactory(UserFactory)
    session_name = "Test Workout"
    workout_date = factory.Faker("date_object")
    body_weight_kg = factory.LazyFunction(lambda: Decimal("78.50"))
    body_weight_unit = "kg"


class WorkoutExerciseFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = WorkoutExercise

    workout_session = factory.SubFactory(WorkoutSessionFactory)
    exercise = factory.SubFactory(ExerciseFactory)
    order_in_session = 1


class ExerciseSetFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ExerciseSet

    workout_exercise = factory.SubFactory(WorkoutExerciseFactory)
    set_number = 1
    set_type = "working"
    weight_kg = factory.LazyFunction(lambda: Decimal("80.00"))
    weight_unit = "kg"
    reps = 8
