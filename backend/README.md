# Backend + Fullstack Run Guide

This folder contains the Django microservices backend and Docker orchestration for Ecommerge.

## Quick Start (lightweight default)
1. Go to backend folder:
	 - `cd backend`
2. Start backend stack (without Kafka/Zookeeper/Elasticsearch):
	 - `docker compose up --build -d`
3. Gateway URL:
	 - `http://localhost:8080`

Default mode is optimized for local development speed and lower resource usage.

## Run Frontend + Backend Together (Docker)
Use `ui` profile to include frontend container:

- `docker compose --profile ui up --build -d`

Frontend URL:
- `http://localhost:5173`

## Run Full Infra (Kafka/Zookeeper/Elasticsearch)
Use `full` profile when testing event/search infrastructure:

- `docker compose --profile full up --build -d`

Run everything (backend + frontend + full infra):

- `docker compose --profile ui --profile full up --build -d`

## Useful Commands
- Check containers:
	- `docker compose ps`
- Follow logs:
	- `docker compose logs -f`
- Stop and remove:
	- `docker compose down`

## Frontend Login Split (Customer/Staff)
From `frontend` folder, run separate local login apps:

- Customer login (`localhost:5173`):
	- `npm run dev:customer`
- Staff login (`localhost:5174`):
	- `npm run dev:staff`
- Optional role selector page (`localhost:5173/select`):
	- `npm run dev:portal`

Auth APIs used:
- `POST /api/users/customer/login/`
- `POST /api/users/staff/login/`

Backend service for both customer and staff auth:
- `backend/services/user-service`
- Customer login handler: `api/users/customer/login/`
- Staff login handler: `api/users/staff/login/`

Checkout API with customer info:
- `POST /api/payments/checkout/`

## Health Checks
- Gateway: `http://localhost:8080/health`
- Service direct: `http://localhost:<port>/health`
