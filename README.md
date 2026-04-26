# Ecommerge

Ecommerge is a microservice-based e-commerce platform with a Django backend, an Nginx API gateway, and a React + Vite frontend. The repository is organized around DDD-style bounded contexts and is prepared for both synchronous request flows and asynchronous event-driven integration.

## Current scope

The repository currently contains:

- A containerized backend stack with 10+ Django services.
- An API gateway on `http://localhost:8080`.
- A React frontend with customer, staff, and portal modes.
- A working AI service for recommendation, reranking, chat, fraud scoring, and demand forecast.
- Demo/stub endpoints for several non-AI services while domain models are still being built out.

This is important for onboarding: the system architecture is broader than the amount of completed domain logic in the current codebase.

## Repository layout

- `frontend/`: React + Vite application.
- `backend/`: Django microservices, gateway, Docker Compose, backend docs.
- `backend/docs/`: architecture, API, environment, and project-level documentation.
- `train data/`: LSTM artifact mounted into the AI service.

## Quick start

Run backend:

```bash
cd backend
docker compose up --build -d
```

Run frontend separately:

```bash
cd frontend
docker compose up --build -d
```

Run backend + frontend from one Compose file:

```bash
cd backend
docker compose --profile ui up --build -d
```

## Main URLs

- Gateway: `http://localhost:8080`
- Frontend: `http://localhost:5173`
- Gateway health: `http://localhost:8080/health`

## Documentation

- [Backend run guide](backend/README.md)
- [Documentation index](backend/docs/README.md)
- [Project overview](backend/docs/PROJECT_OVERVIEW.md)
- [Architecture and DDD guide](backend/docs/ARCHITECTURE.md)
- [API reference](backend/docs/API_REFERENCE.md)
- [Environment guide](backend/docs/ENVIRONMENT.md)

## Notes on implementation maturity

- `catalog-service`, `payment-service`, `order-service`, `search-service`, `user-service`, and `ai-service` already back active frontend flows.
- Several other services still expose scaffold or placeholder responses.
- Kafka, Elasticsearch, and Neo4j are wired into the local platform, but only AI currently contains concrete graph and event-consumer logic.
