# accounts

User authentication and profile management. This is the custom user model and all auth endpoints (register, login, logout, profile).

## Files

### models.py
Custom `User` model using `AbstractBaseUser` + `PermissionsMixin` with email as the login identifier (no username).

- **User**: UUID primary key, email (unique), display_name, unit_preference (kg/lbs), is_active, is_staff, created_at, updated_at.
- **UserManager**: Custom manager with `create_user()` and `create_superuser()`.
- DB table: `users`
- Referenced by: `AUTH_USER_MODEL = "accounts.User"` in `backend/config/settings/base.py`.
- Foreign-keyed by: `Exercise.created_by` (exercises app), `WorkoutSession.user` (workouts app).

### serializers.py
- **RegisterSerializer**: Validates email uniqueness (case-insensitive), enforces min password length of 8, creates user via `UserManager.create_user()`.
- **UserSerializer**: ModelSerializer for reading/updating profile fields (display_name, unit_preference). Email and id are read-only.
- Depends on: `models.py` (User model).

### views.py
- **RegisterView** (`POST /api/auth/register/`): Creates user, returns JWT tokens (access + refresh) and user data. AllowAny permission.
- **LogoutView** (`POST /api/auth/logout/`): Takes a refresh token, blacklists it via SimpleJWT's token blacklist. Requires authentication.
- **MeView** (`GET/PATCH /api/auth/me/`): Retrieve or update the authenticated user's profile.
- Depends on: `serializers.py`, `rest_framework_simplejwt.tokens.RefreshToken`.

### urls.py
Registers 5 endpoints under `/api/auth/` (configured in `backend/config/urls.py`):
| Path | View | Method |
|------|------|--------|
| `register/` | RegisterView | POST |
| `login/` | TokenObtainPairView (SimpleJWT) | POST |
| `refresh/` | TokenRefreshView (SimpleJWT) | POST |
| `logout/` | LogoutView | POST |
| `me/` | MeView | GET, PATCH |

### exceptions.py
Custom DRF exception handler (`custom_exception_handler`) that wraps all error responses in a consistent JSON envelope:
```json
{
  "error": {
    "code": "validation_error",
    "message": "Human-readable message",
    "details": { "field": ["error1", "error2"] }
  }
}
```
Registered globally in `REST_FRAMEWORK["EXCEPTION_HANDLER"]` in `backend/config/settings/base.py`.

### admin.py
Django admin registration for User with custom fieldsets, search, and filtering. Uses `UserAdmin` from `django.contrib.auth.admin`.

### apps.py
Standard Django app config. App name: `apps.accounts`.

## Key Behaviors
- All weights in the system are stored in kg; `unit_preference` on User determines display conversion.
- JWT access tokens expire in 30 minutes, refresh tokens in 7 days (configured in `backend/config/settings/base.py`).
- Refresh tokens are rotated and blacklisted after use.
