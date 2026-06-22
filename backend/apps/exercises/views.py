from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Exercise
from .permissions import ExercisePermission
from .serializers import ExerciseSerializer


class ExerciseViewSet(viewsets.ModelViewSet):
    """
    CRUD for exercises. Lists global exercises plus the user's own customs.
    Only custom (non-global) exercises owned by the user can be modified or deleted.
    """

    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated, ExercisePermission]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Exercise.objects.none()
        qs = Exercise.objects.filter(Q(is_global=True) | Q(created_by=user))

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(name__icontains=search)

        muscle_group = self.request.query_params.get("muscle_group")
        if muscle_group:
            qs = qs.filter(muscle_group__iexact=muscle_group)

        return qs
