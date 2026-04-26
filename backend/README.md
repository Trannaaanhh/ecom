# Backend Run Guide

This directory contains the Django microservices backend, the Nginx API gateway, and the Docker Compose definitions used for local development.

## What this stack includes

- `gateway`: Nginx reverse proxy on port `8080`
- `postgres`: primary relational store for most services
- `mysql`: catalog database
- `redis`: shared cache / volatile store
- `neo4j`: graph store used by AI
- Optional `zookeeper`, `kafka`, `elasticsearch` in the `full` profile
- Optional `frontend` container in the `ui` profile

## Prerequisites

- Docker Desktop with Compose support
- Available local ports:
  `8080`, `5432`, `3306`, `6379`, `7474`, `7687`, and optionally `2181`, `9092`, `9200`, `5173`
- A backend `.env` file with database credentials and optional AI keys

Environment details are documented in [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

## Default local stack

Start the lightweight backend stack:

```bash
cd backend
docker compose up --build -d
```

This mode starts:

- gateway
- postgres
- mysql
- redis
- neo4j
- all Django services

It does not start:

- zookeeper
- kafka
- elasticsearch
- frontend container

Useful URLs:

- Gateway: `http://localhost:8080`
- Gateway health: `http://localhost:8080/health`
- Gateway AI health proxy: `http://localhost:8080/api/health/ai/`

## Full infrastructure profile

Start backend plus event/search infrastructure:

```bash
docker compose --profile full up --build -d
```

Use this when testing:

- Kafka consumer behavior in AI
- event-driven integration design
- Elasticsearch-dependent search evolution

## Frontend in the same compose stack

Start backend plus frontend:

```bash
docker compose --profile ui up --build -d
```

Start everything:

```bash
docker compose --profile ui --profile full up --build -d
```

Frontend URL:

- `http://localhost:5173`

Inside Docker, frontend proxies API calls to `http://gateway:8080`.

## Independent service mode

You can start only the pieces needed for a debugging session:

```bash
docker compose up --build -d gateway
docker compose up --build -d mysql catalog-service
docker compose up --build -d postgres redis neo4j ai-service
```

This is useful because the gateway does not hard-block on every upstream being available.

## Frontend local dev modes

When running frontend outside backend Compose:

```bash
cd frontend
npm install
npm run dev:customer
```

Other modes:

- `npm run dev:staff`
- `npm run dev:portal`

By default, Vite proxies `/api/*` to `VITE_API_BASE_URL`, which falls back to `http://localhost:8080`.

## Operational commands

Check container status:

```bash
docker compose ps
```

Follow logs:

```bash
docker compose logs -f
```

Stop the stack:

```bash
docker compose down
```

## Current implementation note

Not every service has full business logic yet. Several services still return scaffold responses intended to keep gateway routing, frontend wiring, and architecture development moving in parallel. The current status by service is documented in [docs/API_REFERENCE.md](docs/API_REFERENCE.md).
