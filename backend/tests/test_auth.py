import pytest
from django.contrib.auth import get_user_model
from rest_framework import status

from .factories import UserFactory

User = get_user_model()

pytestmark = pytest.mark.django_db


@pytest.fixture
def user_factory():
    return UserFactory


class TestRegister:
    URL = "/api/auth/register/"

    def test_register_success(self, api_client):
        resp = api_client.post(
            self.URL,
            {
                "email": "new@example.com",
                "password": "strongpass1",
            },
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert "tokens" in resp.data
        assert resp.data["tokens"]["access"]
        assert resp.data["tokens"]["refresh"]
        assert resp.data["user"]["email"] == "new@example.com"

    def test_register_duplicate_email(self, api_client):
        UserFactory(email="dupe@test.com")
        resp = api_client.post(
            self.URL,
            {
                "email": "dupe@test.com",
                "password": "strongpass1",
            },
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_short_password(self, api_client):
        resp = api_client.post(
            self.URL,
            {
                "email": "short@test.com",
                "password": "abc",
            },
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


class TestLogin:
    URL = "/api/auth/login/"

    def test_login_success(self, api_client):
        UserFactory(email="login@test.com", password="testpass123")
        resp = api_client.post(
            self.URL,
            {
                "email": "login@test.com",
                "password": "testpass123",
            },
        )
        assert resp.status_code == status.HTTP_200_OK
        assert "access" in resp.data
        assert "refresh" in resp.data

    def test_login_wrong_password(self, api_client):
        UserFactory(email="wrong@test.com", password="testpass123")
        resp = api_client.post(
            self.URL,
            {
                "email": "wrong@test.com",
                "password": "wrongpass",
            },
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


class TestLogout:
    URL = "/api/auth/logout/"

    def test_logout_blacklists_refresh(self, api_client):
        UserFactory(email="logout@test.com", password="testpass123")
        login_resp = api_client.post(
            "/api/auth/login/",
            {
                "email": "logout@test.com",
                "password": "testpass123",
            },
        )
        refresh = login_resp.data["refresh"]
        access = login_resp.data["access"]
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        resp = api_client.post(self.URL, {"refresh": refresh})
        assert resp.status_code == status.HTTP_205_RESET_CONTENT

        # Refresh token should now be blacklisted
        resp = api_client.post("/api/auth/refresh/", {"refresh": refresh})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout_missing_token(self, authenticated_client):
        resp = authenticated_client.post(self.URL, {})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


class TestMe:
    URL = "/api/auth/me/"

    def test_me_authenticated(self, authenticated_client):
        resp = authenticated_client.get(self.URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["email"] == authenticated_client.user.email

    def test_me_unauthenticated(self, api_client):
        resp = api_client.get(self.URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_profile(self, authenticated_client):
        resp = authenticated_client.patch(
            self.URL,
            {
                "display_name": "New Name",
                "unit_preference": "lbs",
            },
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["display_name"] == "New Name"
        assert resp.data["unit_preference"] == "lbs"
