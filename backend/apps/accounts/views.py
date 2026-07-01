from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Equipment, MuscleGroup, UserProfile
from .serializers import (
    EquipmentSerializer,
    MuscleGroupSerializer,
    OnboardingCompleteProfileSerializer,
    RegisterSerializer,
    UserProfileSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Create a new user account and return JWT tokens."""

    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LogoutView(APIView):
    """Blacklist the refresh token to log the user out."""

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": {"code": "validation_error", "message": "Refresh token is required.", "details": {}}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response(
                {
                    "error": {
                        "code": "invalid_token",
                        "message": "Token is invalid or already blacklisted.",
                        "details": {},
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)


class MeView(generics.RetrieveUpdateAPIView):
    """Retrieve or update the authenticated user's profile."""

    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class OnboardingStateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_profile(self):
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

    def get(self, request):
        profile = self._get_profile()
        return Response(
            {
                "is_onboarded": request.user.is_onboarded,
                "onboarding_step": request.user.onboarding_step,
                "profile": UserProfileSerializer(profile).data,
            }
        )

    def patch(self, request):
        profile = self._get_profile()
        payload = request.data.get("profile", request.data)
        serializer = UserProfileSerializer(instance=profile, data=payload, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        onboarding_step = request.data.get("onboarding_step")
        if onboarding_step is not None:
            request.user.onboarding_step = onboarding_step
            request.user.save(update_fields=["onboarding_step"])

        return Response(
            {
                "is_onboarded": request.user.is_onboarded,
                "onboarding_step": request.user.onboarding_step,
                "profile": UserProfileSerializer(profile).data,
            }
        )


class OnboardingCompleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_profile(self):
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

    def post(self, request):
        profile = self._get_profile()
        payload = request.data.get("profile", request.data)
        serializer = OnboardingCompleteProfileSerializer(instance=profile, data=payload)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        request.user.is_onboarded = True
        request.user.onboarding_step = 4
        request.user.save(update_fields=["is_onboarded", "onboarding_step"])

        return Response(
            {
                "is_onboarded": request.user.is_onboarded,
                "onboarding_step": request.user.onboarding_step,
                "profile": UserProfileSerializer(profile).data,
            }
        )


class OnboardingOptionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        equipment = Equipment.objects.all()
        muscle_groups = MuscleGroup.objects.all()
        return Response(
            {
                "equipment": EquipmentSerializer(equipment, many=True).data,
                "muscle_groups": MuscleGroupSerializer(muscle_groups, many=True).data,
            }
        )
