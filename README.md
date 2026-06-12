# Ecommerge

Ecommerge is a microservice-based e-commerce platform with a Django backend, an Nginx API gateway, and a React + Vite frontend. The repository is organized around DDD-style bounded contexts and is prepared for both synchronous request flows and asynchronous event-driven integration.

## Current scope

The repository currently contains:

- A containerized backend stack with 10+ Django services.
- An API gateway on `http://localhost:8080`.
- Two React frontends: customer (port 5175) and staff (port 5174).
- A working AI service for recommendation, reranking, chat, fraud scoring, and demand forecast.
- Staff order management with CRUD (create/read/update/delete) + toast notifications.
- Demo/stub endpoints for several non-AI services while domain models are still being built out.

## Repository layout

- `frontend/`: React + Vite application (shared between customer + staff modes).
- `backend/`: Django microservices, gateway, Docker Compose, backend docs.
- `backend/docs/`: architecture, API, environment, and project-level documentation.
- `training-data/`: LSTM artifact mounted into the AI service.

## Quick start

Run everything (backend + both frontends):

```bash
cd backend
docker compose --profile ui up --build -d
```

> **Note for Windows (Docker Desktop):** If port 5173 is occupied by `com.docker.backend`, the customer frontend auto-assigns port 5175. The `--profile ui` flag starts both customer and staff frontend containers.

Core services only (no frontends):

```bash
cd backend
docker compose up --build -d
```

With scaffold services (inventory, cart, shipping, return-review, marketing):

```bash
cd backend
docker compose --profile scaffold up --build -d
```

Full stack with Kafka + Elasticsearch:

```bash
cd backend
docker compose --profile full --profile scaffold --profile ui up --build -d
```

## Main URLs

| Service | URL | Port |
|---------|-----|------|
| API Gateway | http://localhost:8080 | 8080 |
| Customer Frontend | http://localhost:5175 | 5175 |
| Staff Frontend | http://localhost:5174 | 5174 |
| Gateway Health | http://localhost:8080/health | — |
| PostgreSQL | localhost:5432 | 5432 |
| MySQL | localhost:3306 | 3306 |
| Redis | localhost:6379 | 6379 |
| Neo4j Browser | http://localhost:7474 | 7474 |

## Staff Features

- **Dashboard**: KPIs, recent orders, AI control panel (recommendation, forecast, fraud monitor).
- **Order Management**: Add, edit status/notes, delete orders with toast notifications.
- **Customer login**: `customer@demo.com` / `123456` (via gateway `/api/users/customer/login/`).
- **Staff login**: username `staff` / password `staffpass123` (via gateway `/api/users/staff/login/`).

## Documentation

- [Backend run guide](backend/README.md)
- [Documentation index](backend/docs/README.md)
- [Project overview](backend/docs/PROJECT_OVERVIEW.md)
- [Architecture and DDD guide](backend/docs/ARCHITECTURE.md)
- [API reference](backend/docs/API_REFERENCE.md)
- [Environment guide](backend/docs/ENVIRONMENT.md)

## Notes on implementation maturity

- `catalog-service`, `payment-service`, `order-service`, `search-service`, `user-service`, and `ai-service` already back active frontend flows.
- `order-service` now has a database model (Order) with full CRUD API backed by PostgreSQL.
- Several other services still expose scaffold or placeholder responses.
- Kafka, Elasticsearch, and Neo4j are wired into the local platform, but only AI currently contains concrete graph and event-consumer logic.
