# Workout Analytics Platform

A workout analytics web application for serious lifters. Log workouts with detailed set metadata and track strength progression, body weight trends, training consistency, nutrition, and AI-generated workout plans.

## Architecture

```
backend/          Python/Django REST API + PostgreSQL
frontend/         React 18 + TypeScript + Tailwind CSS
```

### Fitness Intelligence Engine

Modular intelligence system integrated into the existing Django architecture:

| Module | Endpoint prefix | Description |
|---|---|---|
| Goal Estimation | `/api/goal/` | Mifflin-St Jeor BMR/TDEE, calorie targets, timeline projection |
| Nutrition | `/api/food/` | USDA FoodData Central search, detail, meal logging |
| Workout Generation | `/api/workout/` | API Ninjas exercise catalog + program generation |
| Intelligence | `/api/intelligence/` | Muscle anatomy mapping, progress analytics |

Backend structure per app:

```
apps/intelligence/
  integrations/     USDA + API Ninjas clients (retry, caching)
  services/           Goal engine, workout generator, progress analytics
  repositories/       Food log + workout plan persistence
  utils/              Cache helpers, muscle mapping
```

### Frontend Layered Structure (React Native Portable)

```
src/
  api/          Pure HTTP functions (no React, no DOM) — portable
  hooks/        React Query hooks wrapping api/ — portable
  lib/          Pure business logic (units, 1RM, formatters) — portable
  types/        TypeScript interfaces mirroring the API — portable
  components/   Web UI with Tailwind — rewritten for RN
  pages/        Web routes/layouts — rewritten for RN
  context/      Auth context — mostly portable
```

When building the React Native app, copy `api/`, `hooks/`, `lib/`, `types/` verbatim and only rebuild `components/` and `pages/`.

## Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 16+

## Local Setup

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt  # or install from pyproject.toml

# Copy and edit environment
cp .env.example .env
# Edit .env with your DATABASE_URL and SECRET_KEY

# Run migrations
python manage.py migrate

# Seed global exercises
python manage.py seed_exercises

# Seed muscle mapping reference data
python manage.py seed_muscle_mapping

# Create demo data (optional — generates 3 months of workouts)
python manage.py create_demo_data

# Create a superuser for Django admin
python manage.py createsuperuser

# Start dev server
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at http://localhost:5173, the backend at http://localhost:8000.

## Running Tests

```bash
# Backend (from backend/)
python -m pytest tests/ -v

# Frontend (from frontend/)
npx vitest run
```

## API Documentation

Auto-generated Swagger UI at http://localhost:8000/api/docs/ (via drf-spectacular).

## Key Design Decisions

- **All weights stored in kg internally** — converted to user's unit preference at display time only
- **Unit snapshot per set/session** — records what the user entered so history stays accurate even if they change preference
- **UUID primary keys** everywhere — avoids enumerable IDs, mobile/sync-friendly
- **Epley formula for 1RM** — isolated behind `estimateOneRepMax()` for easy swap
- **Nested write** — full workout creation in one POST request
- **SimpleJWT** auth with email login — no email verification (out of scope for MVP)

## Environment Variables

See `backend/.env.example` for all required variables.

| Variable | Description |
|---|---|
| SECRET_KEY | Django secret key |
| DEBUG | Debug mode (True/False) |
| DATABASE_URL | PostgreSQL connection string |
| CORS_ALLOWED_ORIGINS | Frontend origin(s) |
| DJANGO_SETTINGS_MODULE | Settings module (config.settings.dev) |
| USDA_API_KEY | [USDA FoodData Central](https://fdc.nal.usda.gov/api-guide.html) API key |
| API_NINJAS_KEY | [API Ninjas](https://api-ninjas.com/api/exercises) API key |

## Fitness Intelligence API

| Method | Path | Description |
|---|---|---|
| POST | `/api/goal/estimate/` | Calculate BMR, TDEE, calorie target, macros, timeline |
| GET | `/api/food/search/?q=` | Search USDA foods |
| GET | `/api/food/{fdc_id}/` | Food nutrient detail |
| GET/POST | `/api/food/log/` | Daily food log (GET) / log food (POST) |
| GET | `/api/intelligence/exercise-catalog/?muscle=` | API Ninjas exercise discovery |
| POST | `/api/workout/generate/` | Generate workout plan |
| GET | `/api/workout/today/` | Today's scheduled workout |
| GET | `/api/intelligence/progress/` | Combined fitness progress analytics |
