# Ecommerge

Ecommerge is a microservice-based e-commerce system:

- Backend: Django microservices behind an Nginx API Gateway.
- Frontend: React + Vite.

## Run Backend Stack

```bash
cd backend
docker compose up --build -d
```

Gateway URL: http://localhost:8080

## Run Frontend As Separate Service

```bash
cd frontend
docker compose up --build -d
```

Frontend URL: http://localhost:5173

By default, frontend uses `VITE_API_BASE_URL=http://host.docker.internal:8080` so it can call the gateway running from backend stack.

## Run Fullstack In One Backend Compose

```bash
cd backend
docker compose --profile ui up --build -d
```

## Independent Service Mode

You can start each service independently for debugging:

```bash
cd backend
docker compose up --build -d gateway
docker compose up --build -d mysql catalog-service
docker compose up --build -d postgres redis neo4j ai-service
```
