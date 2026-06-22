from rest_framework.permissions import BasePermission, SAFE_METHODS


class ExercisePermission(BasePermission):
    """Users can read all exercises but only modify their own custom exercises."""

    def has_object_permission(self, request, view, obj) -> bool:
        if request.method in SAFE_METHODS:
            return True
        if obj.is_global:
            return False
        return obj.created_by == request.user
