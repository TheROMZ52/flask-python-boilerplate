# NexvorDEV Flask Boilerplate

A modular Flask API starter designed for Vercel Functions and traditional WSGI hosting.

## Features

- Flask application factory for clean configuration and testing
- Modular API and web blueprints
- JSON error responses for HTTP and unexpected errors
- UTC timestamps and a health-check endpoint
- Pytest test suite and Ruff linting
- GitHub Actions quality checks
- Vercel-compatible WSGI entry point (`main:app`)

## Requirements

- Python 3.10+
- [uv](https://docs.astral.sh/uv/) (recommended) or pip

## Local development

```bash
uv sync --group dev
uv run flask --app main run --debug
```

Or run with Gunicorn:

```bash
uv run gunicorn main:app
```

The application is available at `http://127.0.0.1:5000` when using Flask's development server.

## API endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Application health and current UTC timestamp |
| GET | `/api/data` | Sample collection |
| GET | `/api/items/<id>` | Fetch a sample item by ID |

Unknown routes and HTTP errors are returned as JSON.

## Configuration

Copy `.env.example` to `.env` and set a strong `SECRET_KEY` before adding session-based features. Never commit real secrets. Environment variables are read by the application runtime; load `.env` locally with your preferred environment manager if needed.

## Tests and linting

```bash
uv run pytest
uv run ruff check .
```

## Deploying to Vercel

The repository exports a top-level Flask instance from `main.py`, which Vercel can detect as the WSGI application. Connect the repository to Vercel and deploy with the default Python/Flask detection. No custom build command is required for this starter.

For local Vercel parity, install the Vercel CLI and run:

```bash
vercel dev
```

## Project structure

```text
app/
  __init__.py       # Application factory
  config.py         # Runtime configuration
  errors.py         # JSON error handlers
  web.py            # Web routes
  templates/
endpoints/
  __init__.py
  routes.py          # API routes
public/              # Static assets served by Vercel
tests/
.github/workflows/   # CI checks
main.py              # WSGI entry point
pyproject.toml       # Project and tool configuration
```
