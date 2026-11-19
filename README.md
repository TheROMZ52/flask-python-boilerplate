# NexvorDEV Flask Boilerplate

An API-first Flask foundation for production services. It supports Vercel Functions and traditional WSGI hosting, with PostgreSQL for persistent data and SQLite for local development and tests.

## Features

- Application factory with environment-aware configuration
- Versioned API blueprint structure under `/api/v1`
- Separate liveness and readiness health checks
- SQLAlchemy and Flask-Migrate (Alembic)
- PostgreSQL through psycopg 3
- SQLite for local development and isolated tests
- JSON error responses
- Legacy sample routes retained during the migration
- Pytest, Ruff, and GitHub Actions CI
- Writable instance directory on Vercel Functions

## Requirements

- Python 3.10+
- [uv](https://docs.astral.sh/uv/) (recommended)
- PostgreSQL for persistent production data

## Local setup

```bash
cp .env.example .env
uv sync --group dev
uv run flask --app main run --debug
```

Set `DATABASE_URL` in your environment or `.env`. Without it, the app uses SQLite at `instance/app.db`. SQLite is intended for local development and tests. Serverless filesystems are ephemeral, so use managed PostgreSQL for deployed environments. Never commit real credentials.

## API

### Health

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/health` | API identity and basic status |
| GET | `/api/v1/health/live` | Process liveness |
| GET | `/api/v1/health/ready` | Readiness, including database connectivity |

The readiness endpoint returns HTTP 503 when the database cannot be reached.

### Items

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/items` | List database items |
| POST | `/api/v1/items` | Create an item |
| GET | `/api/v1/items/<id>` | Fetch an item |
| PATCH | `/api/v1/items/<id>` | Update an item |
| DELETE | `/api/v1/items/<id>` | Delete an item |

Create an item:

```bash
curl -X POST http://127.0.0.1:5000/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Example","value":100}'
```

The original unversioned sample endpoints remain temporarily available for compatibility. New endpoints should be added under `app/api/v1/`.

## Database migrations

Initialize migrations once:

```bash
uv run flask --app main db init
uv run flask --app main db migrate -m "create initial tables"
uv run flask --app main db upgrade
```

After changing models, generate and review a migration, then apply it:

```bash
uv run flask --app main db migrate -m "describe schema change"
uv run flask --app main db upgrade
```

Commit generated migration files. Review every migration before applying it to production. Do not create or migrate database tables automatically during application startup.

## Tests and linting

```bash
uv run ruff check .
uv run pytest
```

Tests use an isolated in-memory SQLite database and do not require a running PostgreSQL server.

## Deploying to Vercel

The WSGI entry point is `main:app`. Configure `DATABASE_URL` and `SECRET_KEY` as Vercel environment variables. Use a managed PostgreSQL provider for persistent data.

Vercel's function filesystem is read-only outside its temporary directory. When `VERCEL=1`, the application uses `/tmp/nexvordev-instance` for the Flask instance path. Data written there is temporary and must not be used as a production database.

Apply reviewed database migrations as a deployment or release step. Do not run schema creation automatically at application startup.

## Project structure

```text
app/
  api/
    v1/
      health.py
  core/
    config.py
  factory.py
  extensions.py
  models/
  errors.py
  web.py
endpoints/
  routes.py
tests/
main.py
pyproject.toml
```
