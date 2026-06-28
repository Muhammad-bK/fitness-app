import pytest
from rest_framework import status

from .factories import ExerciseFactory, UserFactory

pytestmark = pytest.mark.django_db


@pytest.fixture
def user_factory():
    return UserFactory


class TestExerciseList:
    URL = "/api/exercises/"

    def test_list_includes_global_and_user_custom(self, authenticated_client):
        ExerciseFactory(is_global=True, name="Global Bench")
        ExerciseFactory(is_global=False, created_by=authenticated_client.user, name="My Custom")
        other_user = UserFactory()
        ExerciseFactory(is_global=False, created_by=other_user, name="Other Custom")

        resp = authenticated_client.get(self.URL)
        assert resp.status_code == status.HTTP_200_OK
        names = [e["name"] for e in resp.data["results"]]
        assert "Global Bench" in names
        assert "My Custom" in names
        assert "Other Custom" not in names

    def test_search_filter(self, authenticated_client):
        ExerciseFactory(is_global=True, name="Bench Press")
        ExerciseFactory(is_global=True, name="Squat")
        resp = authenticated_client.get(self.URL, {"search": "bench"})
        assert resp.status_code == status.HTTP_200_OK
        assert all("Bench" in e["name"] for e in resp.data["results"])

    def test_muscle_group_filter(self, authenticated_client):
        ExerciseFactory(is_global=True, name="BP", muscle_group="chest")
        ExerciseFactory(is_global=True, name="SQ", muscle_group="quadriceps")
        resp = authenticated_client.get(self.URL, {"muscle_group": "chest"})
        names = [e["name"] for e in resp.data["results"]]
        assert "BP" in names
        assert "SQ" not in names

    def test_unauthenticated(self, api_client):
        resp = api_client.get(self.URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


class TestExerciseCreate:
    URL = "/api/exercises/"

    def test_create_custom_exercise(self, authenticated_client):
        resp = authenticated_client.post(
            self.URL,
            {
                "name": "Cable Fly",
                "muscle_group": "chest",
                "category": "cable",
            },
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["is_global"] is False
        assert str(resp.data["created_by"]) == str(authenticated_client.user.id)


class TestExercisePermissions:
    def test_cannot_edit_global_exercise(self, authenticated_client):
        ex = ExerciseFactory(is_global=True, name="Global")
        resp = authenticated_client.patch(f"/api/exercises/{ex.id}/", {"name": "Hacked"})
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_cannot_delete_global_exercise(self, authenticated_client):
        ex = ExerciseFactory(is_global=True, name="Global")
        resp = authenticated_client.delete(f"/api/exercises/{ex.id}/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_can_edit_own_custom(self, authenticated_client):
        ex = ExerciseFactory(is_global=False, created_by=authenticated_client.user, name="Mine")
        resp = authenticated_client.patch(f"/api/exercises/{ex.id}/", {"name": "Updated"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["name"] == "Updated"

    def test_cannot_edit_other_users_custom(self, authenticated_client):
        other = UserFactory()
        ex = ExerciseFactory(is_global=False, created_by=other, name="Others")
        resp = authenticated_client.patch(f"/api/exercises/{ex.id}/", {"name": "Hacked"})
        assert resp.status_code == status.HTTP_404_NOT_FOUND
