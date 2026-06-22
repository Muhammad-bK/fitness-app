# config

Django project configuration. Contains settings, root URL routing, and WSGI/ASGI entry points.

## Files

### settings/base.py
Shared settings for all environments. Key configurations:

- **Auth**: `AUTH_USER_MODEL = "accounts.User"` (custom user model from accounts app).
- **Database**: PostgreSQL via `DATABASE_URL` env var (default: `postgres://localhost:5432/workout_analytics`).
- **DRF**: JWT auth via SimpleJWT, page-based pagination (20 per page), custom exception handler from `apps.accounts.exceptions`.
- **SimpleJWT**: Access token = 30 min, refresh token = 7 days, tokens rotate and old ones get blacklisted.
- **CORS**: Origins loaded from `CORS_ALLOWED_ORIGINS` env var.
- **OpenAPI**: drf-spectacular configured with title "Workout Analytics API".
- **Installed apps**: rest_framework, rest_framework_simplejwt (with token_blacklist), corsheaders, drf_spectacular, and the 4 local apps (accounts, exercises, workouts, analytics).
- **Environment**: Uses `django-environ` to read `.env` file from `backend/.env`.

### settings/dev.py
Development overrides. Imports everything from base.py and sets `DEBUG = True`.

### settings/prod.py
Production overrides. Enables secure cookies and browser security headers. Note: currently has `DEBUG = True` (likely should be False in actual production).

### settings/__init__.py
Empty — the settings module is specified via `DJANGO_SETTINGS_MODULE` env var (defaults to `config.settings` in manage.py, which resolves to this package and loads `__init__.py` — typically you'd set it to `config.settings.dev` or `config.settings.prod`).

### urls.py
Root URL configuration. Maps all API routes:

| Prefix | App | Include path |
|--------|-----|--------------|
| `admin/` | Django admin | Built-in |
| `api/auth/` | accounts | `apps.accounts.urls` |
| `api/exercises/` | exercises | `apps.exercises.urls` |
| `api/workouts/` | workouts | `apps.workouts.urls` |
| `api/analytics/` | analytics | `apps.analytics.urls` |
| `api/schema/` | OpenAPI | drf-spectacular schema endpoint |
| `api/docs/` | Swagger UI | drf-spectacular Swagger view |

### wsgi.py
Standard WSGI entry point. Sets `DJANGO_SETTINGS_MODULE` to `config.settings`.

### asgi.py
Standard ASGI entry point. Sets `DJANGO_SETTINGS_MODULE` to `config.settings`.

## Environment Variables (from .env)
- `SECRET_KEY`: Django secret key
- `DEBUG`: Boolean
- `ALLOWED_HOSTS`: Comma-separated list
- `CORS_ALLOWED_ORIGINS`: Comma-separated list (e.g., `http://localhost:5173`)
- `DATABASE_URL`: PostgreSQL connection string

## manage.py (in backend/)
Standard Django CLI entry point. Defaults to `config.settings` as the settings module.
