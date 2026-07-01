"""
Tests for the onboarding endpoints:
  GET   /api/onboarding/          — current onboarding state + profile
  PATCH /api/onboarding/          — partial profile update + step bump
  POST  /api/onboarding/complete/ — finalize onboarding
  GET   /api/onboarding/options/  — equipment + muscle group reference lists
"""

import pytest
from rest_framework import status

from apps.accounts.models import UserProfile

from .factories import EquipmentFactory, MuscleGroupFactory, UserFactory

pytestmark = pytest.mark.django_db


@pytest.fixture
def user_factory():
    return UserFactory


class TestOnboardingState:
    URL = "/api/onboarding/"

    def test_get_returns_initial_state(self, authenticated_client):
        resp = authenticated_client.get(self.URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["is_onboarded"] is False
        assert resp.data["onboarding_step"] == 0
        # Profile is auto-created by the post_save signal on the user.
        assert "profile" in resp.data
        assert resp.data["profile"]["goal_type"] is None

    def test_get_unauthenticated(self, api_client):
        resp = api_client.get(self.URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_patch_updates_profile_fields(self, authenticated_client):
        resp = authenticated_client.patch(
            self.URL,
            {
                "profile": {
                    "biological_sex": "male",
                    "height": "180.00",
                    "current_weight": "82.50",
                    "goal_type": "build_muscle",
                },
                "onboarding_step": 1,
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["onboarding_step"] == 1
        assert resp.data["profile"]["goal_type"] == "build_muscle"

        profile = UserProfile.objects.get(user=authenticated_client.user)
        assert profile.height == pytest.approx(180.0)
        assert profile.goal_type == "build_muscle"

    def test_patch_accepts_flat_payload_without_profile_key(self, authenticated_client):
        resp = authenticated_client.patch(
            self.URL,
            {"experience_level": "advanced"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["profile"]["experience_level"] == "advanced"

    def test_patch_writes_equipment_and_muscle_groups(self, authenticated_client):
        eq1 = EquipmentFactory()
        eq2 = EquipmentFactory()
        mg = MuscleGroupFactory()

        resp = authenticated_client.patch(
            self.URL,
            {
                "profile": {
                    "equipment_ids": [str(eq1.id), str(eq2.id)],
                    "target_muscle_group_ids": [str(mg.id)],
                }
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        returned_equipment = {e["id"] for e in resp.data["profile"]["equipment"]}
        assert returned_equipment == {str(eq1.id), str(eq2.id)}
        assert [m["id"] for m in resp.data["profile"]["target_muscle_groups"]] == [str(mg.id)]

    def test_patch_invalid_choice_rejected(self, authenticated_client):
        resp = authenticated_client.patch(
            self.URL,
            {"profile": {"goal_type": "become_invincible"}},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_patch_unauthenticated(self, api_client):
        resp = api_client.patch(self.URL, {"experience_level": "beginner"}, format="json")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


class TestOnboardingComplete:
    URL = "/api/onboarding/complete/"

    def test_complete_marks_user_onboarded(self, authenticated_client):
        resp = authenticated_client.post(
            self.URL,
            {"profile": {"plan_source": "app_generated"}},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["is_onboarded"] is True
        assert resp.data["onboarding_step"] == 4

        user = authenticated_client.user
        user.refresh_from_db()
        assert user.is_onboarded is True
        assert user.onboarding_step == 4

    def test_complete_accepts_flat_payload(self, authenticated_client):
        resp = authenticated_client.post(
            self.URL,
            {"plan_source": "build_my_own"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["profile"]["plan_source"] == "build_my_own"

    def test_complete_requires_plan_source(self, authenticated_client):
        resp = authenticated_client.post(self.URL, {"profile": {}}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

        authenticated_client.user.refresh_from_db()
        assert authenticated_client.user.is_onboarded is False

    def test_complete_unauthenticated(self, api_client):
        resp = api_client.post(self.URL, {"plan_source": "app_generated"}, format="json")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


class TestOnboardingOptions:
    URL = "/api/onboarding/options/"

    def test_returns_equipment_and_muscle_groups(self, authenticated_client):
        EquipmentFactory(name="Barbell")
        EquipmentFactory(name="Dumbbells")
        MuscleGroupFactory(name="Chest")

        resp = authenticated_client.get(self.URL)
        assert resp.status_code == status.HTTP_200_OK
        equipment_names = {e["name"] for e in resp.data["equipment"]}
        assert {"Barbell", "Dumbbells"}.issubset(equipment_names)
        assert "Chest" in {m["name"] for m in resp.data["muscle_groups"]}

    def test_unauthenticated(self, api_client):
        resp = api_client.get(self.URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
