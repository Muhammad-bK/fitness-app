"""
Workout session views with nested exercise/set support.
List view annotates exercise and set counts for efficiency.
"""

from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.response import Response

from .models import WorkoutSession
from .serializers import (
    WorkoutSessionListSerializer,
    WorkoutSessionReadSerializer,
    WorkoutSessionWriteSerializer,
)


class WorkoutSessionViewSet(viewsets.ModelViewSet):
    """
    CRUD for workout sessions. Supports nested creation of exercises and sets.
    All operations are scoped to the authenticated user.
    """

    def get_queryset(self):
        qs = WorkoutSession.objects.filter(user=self.request.user).order_by("-workout_date", "-created_at")

        if self.action == "list":
            qs = qs.annotate(
                exercise_count=Count("workout_exercises", distinct=True),
                set_count=Count("workout_exercises__sets", distinct=True),
            )
        else:
            qs = qs.prefetch_related(
                "workout_exercises__exercise",
                "workout_exercises__sets",
            )

        start = self.request.query_params.get("start")
        end = self.request.query_params.get("end")
        if start:
            qs = qs.filter(workout_date__gte=start)
        if end:
            qs = qs.filter(workout_date__lte=end)

        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return WorkoutSessionListSerializer
        if self.action in ("create", "update", "partial_update"):
            return WorkoutSessionWriteSerializer
        return WorkoutSessionReadSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = serializer.save()
        read_serializer = WorkoutSessionReadSerializer(
            session,
            context={"request": request},
        )
        # Re-fetch with prefetches for the read serializer
        session = WorkoutSession.objects.prefetch_related(
            "workout_exercises__exercise",
            "workout_exercises__sets",
        ).get(pk=session.pk)
        read_serializer = WorkoutSessionReadSerializer(session, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        session = serializer.save()
        session = WorkoutSession.objects.prefetch_related(
            "workout_exercises__exercise",
            "workout_exercises__sets",
        ).get(pk=session.pk)
        read_serializer = WorkoutSessionReadSerializer(session, context={"request": request})
        return Response(read_serializer.data)
