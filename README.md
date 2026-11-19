# NexvorDEV Flask Boilerplate

A modular Flask API starter for Vercel Functions and traditional WSGI hosting, with PostgreSQL support.

## Features

- Flask application factory and modular blueprints
- SQLAlchemy models and Flask-Migrate (Alembic)
- PostgreSQL through psycopg 3
- SQLite fallback for local development
- JSON error responses and health endpoints
- CRUD API for database-backed items
- Pytest, Ruff, and GitHub Actions CI

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

Set `DATABASE_URL` in your environment or `.env`. Without it, the app uses a local SQLite database at `instance/app.db`. SQLite is intended for local development only; use managed PostgreSQL for deployed environments. Never commit real credentials.

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

Generated migration files must be committed to Git. Review each generated migration before applying it to production.

## API endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Application health |
| GET | `/api/db/health` | Database connectivity |
| GET | `/api/data` | Original sample collection |
| GET | `/api/items/<id>` | Original sample item |
| GET | `/api/v1/items` | List database items |
| POST | `/api/v1/items` | Create an item |
| GET | `/api/v1/items/<id>` | Fetch a database item |
| PATCH | `/api/v1/items/<id>` | Update an item |
| DELETE | `/api/v1/items/<id>` | Delete an item |

Create an item:

```bash
curl -X POST http://127.0.0.1:5000/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Example","value":100}'
```

## Tests and linting

```bash
uv run pytest
uv run ruff check .
```

Tests use an isolated in-memory SQLite database. They do not require a running PostgreSQL server.

## Deploying to Vercel

The WSGI entry point remains `main:app`. Configure `DATABASE_URL` and `SECRET_KEY` as Vercel environment variables, using a managed PostgreSQL provider. Apply reviewed migrations as a deployment/release step; do not run schema creation automatically at application startup.

## Project structure

```text
app/
  __init__.py
  config.py
  extensions.py
  models/
    __init__.py
    item.py
  errors.py
  web.py
endpoints/
  routes.py
tests/
  conftest.py
  test_api.py
  test_database.py
main.py
pyproject.toml
```
