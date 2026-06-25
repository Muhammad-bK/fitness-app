import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserManager(BaseUserManager):
    def create_user(self, email: str, password: str | None = None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class UnitPreference(models.TextChoices):
        KG = "kg", "Kilograms"
        LBS = "lbs", "Pounds"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=150, blank=True, null=True)
    unit_preference = models.CharField(
        max_length=3,
        choices=UnitPreference.choices,
        default=UnitPreference.KG,
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_onboarded = models.BooleanField(default=False)
    onboarding_step = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "users"

    def __str__(self) -> str:
        return self.display_name or self.email


class Equipment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class MuscleGroup(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class UserProfile(models.Model):
    class BiologicalSex(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        OTHER = "other", "Other"

    class BodyType(models.TextChoices):
        LEAN = "lean", "Lean"
        ATHLETIC = "athletic", "Athletic"
        BULKY = "bulky", "Bulky"
        SOFT = "soft", "Soft"

    class GoalType(models.TextChoices):
        LOSE_WEIGHT = "lose_weight", "Lose weight"
        BUILD_MUSCLE = "build_muscle", "Build muscle"
        MAINTAIN_WEIGHT = "maintain_weight", "Maintain weight"
        IMPROVE_FITNESS = "improve_fitness", "Improve fitness"

    class GymType(models.TextChoices):
        HOME = "home", "Home"
        COMMERCIAL = "commercial", "Commercial"
        HYBRID = "hybrid", "Hybrid"
        NO_GYM = "no_gym", "No gym"

    class ExperienceLevel(models.TextChoices):
        BEGINNER = "beginner", "Beginner"
        INTERMEDIATE = "intermediate", "Intermediate"
        ADVANCED = "advanced", "Advanced"

    class PlanSource(models.TextChoices):
        APP_GENERATED = "app_generated", "App Generated Plan"
        BUILD_MY_OWN = "build_my_own", "Build My Own Plan"

    user = models.OneToOneField(User, related_name="profile", on_delete=models.CASCADE)
    date_of_birth = models.DateField(blank=True, null=True)
    biological_sex = models.CharField(
        max_length=10,
        choices=BiologicalSex.choices,
        blank=True,
        null=True,
    )
    height = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    current_weight = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    target_weight = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    current_body_type = models.CharField(
        max_length=20,
        choices=BodyType.choices,
        blank=True,
        null=True,
    )
    target_body_type = models.CharField(
        max_length=20,
        choices=BodyType.choices,
        blank=True,
        null=True,
    )
    goal_type = models.CharField(
        max_length=20,
        choices=GoalType.choices,
        blank=True,
        null=True,
    )
    weekly_change_rate = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True)
    workout_days_per_week = models.PositiveSmallIntegerField(blank=True, null=True)
    session_length_minutes = models.PositiveSmallIntegerField(blank=True, null=True)
    gym_type = models.CharField(
        max_length=20,
        choices=GymType.choices,
        blank=True,
        null=True,
    )
    experience_level = models.CharField(
        max_length=20,
        choices=ExperienceLevel.choices,
        blank=True,
        null=True,
    )
    plan_source = models.CharField(
        max_length=20,
        choices=PlanSource.choices,
        blank=True,
        null=True,
    )
    equipment = models.ManyToManyField(
        Equipment,
        through="UserEquipment",
        related_name="profiles",
        blank=True,
    )
    target_muscle_groups = models.ManyToManyField(
        MuscleGroup,
        through="UserTargetMuscleGroup",
        related_name="profiles",
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_profiles"

    def __str__(self) -> str:
        return f"{self.user.email} profile"


class UserEquipment(models.Model):
    profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("profile", "equipment")
        db_table = "user_equipment"

    def __str__(self) -> str:
        return f"{self.profile.user.email} — {self.equipment.name}"


class UserTargetMuscleGroup(models.Model):
    profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    muscle_group = models.ForeignKey(MuscleGroup, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("profile", "muscle_group")
        db_table = "user_target_muscle_groups"

    def __str__(self) -> str:
        return f"{self.profile.user.email} — {self.muscle_group.name}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
