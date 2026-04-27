# Ecommerge Project Overview

This document describes the repository as it exists today: services, runtime model, frontend/backend integration, and the gap between architectural intent and implemented business logic.

## 1. Platform summary

Ecommerge is a full-stack e-commerce platform composed of:

- Django microservices behind an Nginx API gateway
- a React + Vite frontend
- PostgreSQL, MySQL, Redis, and Neo4j
- optional Kafka and Elasticsearch infrastructure in the `full` profile

The project follows a DDD-oriented service split. The codebase already reflects the target bounded contexts in deployment structure, even though several services still expose demo or scaffold responses.

## 2. Current implementation snapshot

The current codebase is best understood as a hybrid of:

- real platform wiring
- active UI flows
- AI-backed recommendation features
- placeholder domain services

### Working flows already present

- Customer login through `user-service`
- Staff login through `user-service`
- Product listing, detail, featured, trending, and category browsing through `catalog-service`
- Cart page loading through `cart-service` plus frontend local cart storage
- Checkout request validation and AI fraud scoring through `payment-service`
- Staff dashboard summary through `order-service`
- AI recommendation, similar products, reranking, fraud score, forecast, and chat through `ai-service`

### Placeholder/scaffold areas

- Inventory
- Shipping
- Return/review
- Marketing/notification
- most CRUD or persistence-heavy workflows across services

That distinction matters for every design and implementation decision: docs must separate current behavior from target behavior.

## 3. Top-level repository layout

- `README.md`: repository-level summary and quick start
- `backend/README.md`: backend run guide
- `backend/docs/`: canonical backend docs
- `backend/api-gateway/nginx-gateway/`: gateway configuration
- `backend/services/`: Django microservices
- `frontend/`: React + Vite UI
- `training-data/`: mounted LSTM model artifact for AI

## 4. Runtime architecture

### Request flow

1. Browser sends requests to the frontend or directly to the gateway during debugging.
2. Frontend proxies `/api/*` to the gateway.
3. Gateway routes requests to the responsible Django service.
4. Services return JSON responses directly.
5. Some services call other services synchronously over HTTP inside the Docker network.

### Current synchronous integrations in code

- `catalog-service -> ai-service` for homepage recommendation fallback integration
- `search-service -> ai-service` for reranking
- `payment-service -> ai-service` for fraud scoring
- frontend -> gateway -> all active services

### Current asynchronous integration in code

- `ai-service` contains a Kafka consumer for `user_activity` and `order_created`
- Kafka itself only starts when the `full` profile is enabled

## 5. Service map

### User service

- Port: `8001`
- Role: authentication entry points for customer and staff
- Current status: active demo endpoints used by frontend login pages

### Catalog service

- Port: `8002`
- Role: product and category browsing
- Current status: active demo catalog powering homepage, listing, and detail pages
- Data style: in-memory demo product dataset, not persistent catalog storage yet

### Inventory service

- Port: `8003`
- Role: stock domain boundary
- Current status: scaffold only

### Search service

- Port: `8004`
- Role: search domain boundary and AI reranking integration
- Current status: stub search plus AI reranking endpoint

### Cart service

- Port: `8005`
- Role: cart domain boundary
- Current status: scaffold response for backend cart plus active frontend local cart state

### Order service

- Port: `8006`
- Role: order domain boundary
- Current status: scaffold order list plus active admin summary endpoint

### Payment service

- Port: `8007`
- Role: checkout and payment orchestration
- Current status: validates checkout payload, calls AI fraud score, returns demo payment result

### Shipping service

- Port: `8008`
- Role: shipment domain boundary
- Current status: scaffold only

### Return-review service

- Port: `8009`
- Role: after-sales domain boundary for returns and reviews
- Current status: scaffold only

### Marketing-notification service

- Port: `8010`
- Role: engagement, campaign, and notification boundary
- Current status: scaffold only

### AI service

- Port: `8011`
- Role: recommendation, reranking, chat, fraud scoring, forecast, graph integration
- Current status: most advanced backend service in the repository
- Infrastructure: PostgreSQL config, Neo4j integration, optional Kafka, optional Gemini API, mounted LSTM artifact

## 6. Gateway surface

The Nginx gateway listens on `8080` and exposes:

- `/health`
- `/api/health/<service>/` style health proxies
- `/api/users/`
- `/api/products/`
- `/api/categories/`
- `/api/inventory/`
- `/api/search/`
- `/api/cart/`
- `/api/orders/`
- `/api/payments/`
- `/api/shipping/`
- `/api/returns/`
- `/api/reviews/`
- `/api/marketing/`
- `/api/notifications/`
- `/api/ai/`

Gateway routing is static and path-based. There is no centralized auth, rate limit, or request enrichment at the gateway yet.

## 7. Data and infrastructure map

### Datastores

- PostgreSQL: default relational store for most services
- MySQL: catalog-service database target
- Redis: available for shared cache / volatile state
- Neo4j: used by AI graph workflows

### Optional infrastructure

- Kafka + Zookeeper: event-driven integration, only in `full` profile
- Elasticsearch: search infrastructure placeholder, only in `full` profile

### Important implementation nuance

Compose provisions databases for the whole platform, but most services do not yet persist business entities. A service being connected to a database does not mean the domain model is implemented.

## 8. Frontend overview

The frontend is a single React codebase with runtime role modes:

- customer mode
- staff mode
- portal mode

### Route map

- `/`: role-dependent landing page
- `/select`
- `/login/customer`
- `/login/staff`
- `/staff/dashboard`
- `/home`
- `/products`
- `/product/:id`
- `/ai`
- `/cart`
- `/account`
- `/admin`

### Frontend integration style

- direct fetch calls to gateway-backed endpoints
- localStorage-backed customer session
- localStorage-backed cart state
- dedicated client wrapper for AI APIs in `frontend/src/app/lib/ai-api.ts`

## 9. AI implementation summary

The AI service is the richest part of the backend and already combines multiple strategies:

- graph-based candidate generation from Neo4j
- behavior scoring from user actions
- optional LSTM artifact loading from `training-data/`
- query-text similarity for retrieval/reranking
- rule-based fraud scoring
- naive forecast baseline
- Gemini-backed chat when `GEMINI_API_KEY` is configured
- deterministic fallback chat when Gemini is unavailable

The AI service also contains a Kafka consumer for:

- `user_activity`
- `order_created`

Those events are used to populate and enrich the graph model.

## 10. Development profiles

### Default profile

Use when you want fast local startup:

- all core services
- postgres, mysql, redis, neo4j
- no kafka, zookeeper, elasticsearch

### `full` profile

Use when you want event/search infrastructure:

- kafka
- zookeeper
- elasticsearch

### `ui` profile

Use when you want frontend inside the backend Compose stack.

## 11. Risks and current gaps

- Several services expose placeholder JSON rather than real aggregates, repositories, and workflows.
- There is no unified contract package for cross-service DTOs or domain events.
- Security is still development-grade: default secret fallbacks, permissive hosts, demo tokens.
- Observability and service-to-service tracing are not implemented.
- Search, inventory, shipping, after-sales, and marketing are domain placeholders rather than production-ready modules.
- Some hardcoded demo text and product data indicate the repository is still in a demonstration/prototyping phase.

## 12. Recommended next milestones

1. Convert scaffold services into real domain modules one bounded context at a time.
2. Introduce explicit event contracts for Kafka topics.
3. Replace in-memory demo data with persistent aggregates and repositories.
4. Add authentication and authorization boundaries that match the target microservice architecture.
5. Add contract tests for gateway routing and service APIs.

## 13. Related docs

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [API_REFERENCE.md](API_REFERENCE.md)
- [ENVIRONMENT.md](ENVIRONMENT.md)
