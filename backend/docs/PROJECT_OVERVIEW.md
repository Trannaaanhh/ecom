# Ecommerge Project Overview

This document gives a detailed, practical overview of the Ecommerge repository: what the system is, how the backend is split, which services exist, how traffic flows through the gateway, and how to run the project locally.

## 1. Project Summary

Ecommerge is a full-stack e-commerce platform built with a microservice backend and a Vite + React frontend.

The repository is organized around three main concerns:

- Customer-facing storefront and checkout flows.
- Staff/admin operational tools.
- AI-assisted services for recommendations, chat, search support, and future intelligence features.

The backend is container-first and can run in a lightweight local mode or a fuller infrastructure mode with Kafka, Zookeeper, Elasticsearch, and Neo4j.

## 2. High-Level Architecture

The system uses an API gateway in front of multiple Django services.

Request flow:

1. The frontend sends requests to the gateway.
2. The gateway routes each request to the correct service.
3. Each service handles its own domain logic and data access.
4. Shared infrastructure services provide persistence, caching, eventing, and graph storage.

Core backend services are isolated by domain so they can evolve independently.

## 3. Top-Level Repository Layout

- `frontend/`: React + Vite application.
- `backend/`: Django microservices, gateway config, Docker orchestration, and backend docs.
- `backend/api-gateway/nginx-gateway/`: Nginx reverse proxy configuration.
- `backend/services/`: individual Django services.
- `backend/docs/`: architecture and project documentation.

## 4. Backend Service Map

### 4.1 User Service

Purpose:

- Authentication and user access flows.
- Customer and staff login endpoints.

Relevant routes:

- `POST /api/users/customer/login/`
- `POST /api/users/staff/login/`
- `GET /health`

Local port:

- `8001`

### 4.2 Catalog Service

Purpose:

- Product and category management.
- Source of truth for catalog browsing data.

Gateway routes:

- `GET/POST /api/products/`
- `GET/POST /api/categories/`

Local port:

- `8002`

### 4.3 Inventory Service

Purpose:

- Stock and inventory availability.
- Supports product availability checks.

Gateway route:

- `/api/inventory/`

Local port:

- `8003`

### 4.4 Search Service

Purpose:

- Search and ranking support.
- Used when the frontend needs search-specific APIs.

Gateway route:

- `/api/search/`

Local port:

- `8004`

### 4.5 Cart Service

Purpose:

- Customer cart state and cart mutations.

Gateway route:

- `/api/cart/`

Local port:

- `8005`

### 4.6 Order Service

Purpose:

- Order creation and order lifecycle handling.

Gateway route:

- `/api/orders/`

Local port:

- `8006`

### 4.7 Payment Service

Purpose:

- Checkout and payment-related flows.

Gateway route:

- `/api/payments/`

Local port:

- `8007`

Checkout endpoint mentioned in backend docs:

- `POST /api/payments/checkout/`

### 4.8 Shipping Service

Purpose:

- Shipment and delivery tracking support.

Gateway route:

- `/api/shipping/`

Local port:

- `8008`

### 4.9 Return / Review Service

Purpose:

- Returns and product review workflows.

Gateway routes:

- `/api/returns/`
- `/api/reviews/`

Local port:

- `8009`

### 4.10 Marketing Notification Service

Purpose:

- Notifications and marketing messaging.

Gateway routes:

- `/api/marketing/`
- `/api/notifications/`

Local port:

- `8010`

### 4.11 AI Service

Purpose:

- Recommendation APIs.
- AI chat endpoint.
- Future graph/LLM/Kafka-driven intelligence flows.

Gateway route:

- `/api/ai/`

Local port:

- `8011`

Direct routes currently exposed by the service:

- `GET /health`
- `GET /api/ai/recommendations/<user_id>/`
- `POST /api/ai/chat/`

## 5. Shared Infrastructure

The compose stack includes the following shared components:

- PostgreSQL: primary relational storage for many services.
- MySQL: used by the catalog service.
- Redis: caching and temporary state.
- Neo4j: graph storage for AI and relationship-driven features.
- Kafka and Zookeeper: event streaming, enabled through the `full` profile.
- Elasticsearch: search infrastructure, also enabled through the `full` profile.

### Database Mapping

- PostgreSQL: user, inventory, search, cart, order, payment, shipping, return/review, marketing, AI.
- MySQL: catalog.
- Neo4j: AI graph-backed features.

## 5.1 Domain-Driven Design Context Map

This section describes the Bounded Contexts, their relationships, and communication patterns using Domain-Driven Design (DDD) principles. Understanding these relationships is essential for evolving the system coherently.

### 5.1.1 Bounded Contexts and Core Domains

The current architecture is organized primarily by technical decomposition (per-service isolation). The following is a mapping to DDD Bounded Contexts by actual business domain:

#### **Core Domain: Catalog & Inventory**

- **Catalog Bounded Context**: Product definitions, categories, attributes.
  - Ubiquitous Language: Product, Category, ProductAttribute, Specification.
  - Database: MySQL.
  - Exposed through: `/api/products/`, `/api/categories/`.

- **Inventory Bounded Context**: Stock availability, reservations, fulfillment capacity.
  - Ubiquitous Language: Stock, Reservation, AvailabilityCheck, StockLevel.
  - Database: PostgreSQL.
  - Exposed through: `/api/inventory/`.

**Relationship: SHARED KERNEL** (Product ID is shared; both contexts reference the same product entity key but maintain separate models):
  - **Shared Model**: Product ID as a common reference.
  - **Concern**: The Catalog service is upstream (owns Product master data). Inventory is downstream (depends on Catalog's product definitions). When Catalog adds a new product, Inventory must eventually know about it.
  - **Communication**: Synchronous REST calls from Inventory → Catalog to fetch product details, or event-based (Kafka `ProductCreated`, `ProductUpdated` events) in the full profile.
  - **Anti-Corruption Layer**: Inventory may need an ACL to translate Catalog's product schema to its own Stock domain model if the schemas diverge.

---

#### **Core Domain: Shopping & Checkout**

This domain spans multiple services currently treated as separate:

- **Cart Bounded Context**: Shopping cart state, line items, temporary holds.
  - Ubiquitous Language: Cart, CartItem, Quantity, CartTotal.
  - Database: PostgreSQL.
  - Exposed through: `/api/cart/`.

- **Order Bounded Context**: Order creation, order lifecycle (pending, confirmed, shipped, delivered).
  - Ubiquitous Language: Order, OrderItem, OrderStatus, OrderLine.
  - Database: PostgreSQL.
  - Exposed through: `/api/orders/`.

- **Payment Bounded Context**: Payment processing, transaction settlement, refunds.
  - Ubiquitous Language: Payment, Transaction, PaymentMethod, PaymentStatus.
  - Database: PostgreSQL.
  - Exposed through: `/api/payments/`.

**Relationships and Interactions**:
  - **Cart → Order**: CUSTOMER-SUPPLIER relationship. Cart is upstream (customer), Order is downstream (supplier). Checkout initiates a conversion: Cart becomes an Order.
    - Communication: Synchronous REST. Frontend converts cart to order by calling Order service.
    - Flow: `/api/cart/` → `/api/orders/checkout` → OrderService creates order from cart items.

  - **Order → Payment**: CUSTOMER-SUPPLIER relationship. Order is upstream (customer), Payment is downstream (supplier). Order requires payment processing.
    - Communication: Synchronous REST (checkout flow) or async via Kafka (`OrderCreated` event triggers payment workflow).
    - Flow: Payment service listens for order events and initiates payment collection.
    - **Conformist relationship possible**: If Payment adopts Order's domain model directly (e.g., uses Order ID, OrderItem definitions), Payment is Conformist.

  - **Order → Inventory**: CUSTOMER-SUPPLIER. Order is upstream; Inventory is downstream (must reduce stock).
    - Communication: Asynchronous event (Kafka `OrderConfirmed` → triggers inventory reservation/deduction).
    - Concern: Eventual consistency; inventory may temporarily show available when order is pending.

---

#### **Core Domain: Fulfillment & Logistics**

- **Shipping Bounded Context**: Shipment creation, tracking, delivery coordination.
  - Ubiquitous Language: Shipment, Tracking, DeliveryAddress, Carrier, TrackingNumber.
  - Database: PostgreSQL.
  - Exposed through: `/api/shipping/`.

**Relationships**:
  - **Order → Shipping**: CUSTOMER-SUPPLIER. Order is upstream (initiates shipment); Shipping is downstream.
    - Communication: Asynchronous event (`OrderConfirmed` or `OrderReadyForShipping` → Kafka event).
    - Flow: Shipping listens for events and creates shipments.

---

#### **Core Domain: Returns, Reviews & After-Sales**

Currently split into separate endpoints but logically related:

- **Return Bounded Context**: Return authorization, reverse logistics.
  - Ubiquitous Language: ReturnRequest, ReturnAuthorization, ReturnStatus, RefundStatus.
  - Database: PostgreSQL.

- **Review Bounded Context**: Product reviews, ratings, customer feedback.
  - Ubiquitous Language: Review, Rating, ReviewStatus, Moderation.
  - Database: PostgreSQL.

Exposed through: `/api/returns/`, `/api/reviews/`.

**Recommendation**: These should be consolidated into a single **"After-Sales Bounded Context"** because:
  - Both depend on Order and OrderItem (need to know what customer purchased).
  - Both are concerned with post-purchase customer satisfaction.
  - Reviews often tie to return decisions (customers review items they return).
  - Shared ubiquitous language: Purchase, CustomerSatisfaction, ReturnAndReview workflow.

**Relationships**:
  - **Order → After-Sales (Returns + Reviews)**: CUSTOMER-SUPPLIER. Order is upstream; After-Sales is downstream.
    - Communication: Asynchronous events (`OrderDelivered` → eligible for reviews; `OrderDelivered` + time window → eligible for returns).

---

#### **Supporting Domain: Search**

- **Search Bounded Context**: Full-text search, ranking, faceting (powered by Elasticsearch in full profile).
  - Ubiquitous Language: SearchQuery, SearchResult, Facet, Ranking.
  - Supports: `/api/search/`.

**Relationships**:
  - Reads from Catalog and Inventory; does not write to them.
  - Downstream consumer of Catalog data; should listen to Catalog events (`ProductCreated`, `ProductUpdated`) to reindex Elasticsearch.
  - **Communication**: Event-based (Kafka `ProductChanged` events trigger re-indexing).
  - **Anti-Corruption Layer**: Search maintains its own document schema in Elasticsearch; may differ from Catalog's relational schema.

---

#### **Supporting Domain: User & Authentication**

- **User Bounded Context**: Authentication, identity, roles, permissions.
  - Ubiquitous Language: User, Identity, Role, Permission, Credentials.
  - Database: PostgreSQL.
  - Exposed through: `/api/users/`.

**Relationships**:
  - Upstream for almost all services (every service depends on User for identity and authorization).
  - **Communication**: Synchronous REST (token validation) or JWT-based (services validate tokens locally).
  - No anti-corruption layer needed; identity is a cross-cutting concern.

---

#### **Supporting Domain: Marketing & Notifications**

- **Marketing Bounded Context**: Campaigns, messaging, promotions.
- **Notification Bounded Context**: Email, SMS, push notifications.
  - Ubiquitous Language: Campaign, Notification, Message, Recipient, Channel.
  - Database: PostgreSQL.
  - Exposed through: `/api/marketing/`, `/api/notifications/`.

**Recommendation**: Consider consolidating into a single **"Marketing & Engagement Bounded Context"** as they often work together.

**Relationships**:
  - Consumer of Order, User, and Catalog events (triggers notifications for order status, promotions based on purchases).
  - **Communication**: Asynchronous event-driven (Kafka `OrderConfirmed`, `OrderShipped`, `ProductLaunched` → trigger notifications).

---

#### **Specialty Domain: AI & Intelligence**

- **AI Bounded Context**: Recommendations, chat, personalization, future graph-based intelligence.
  - Ubiquitous Language: Recommendation, Conversation, PersonalizationProfile, GraphRelationship, Embedding.
  - Databases: PostgreSQL, Neo4j, Redis.
  - Exposed through: `/api/ai/`.

**Key Characteristics**:
  - Reads from multiple contexts: User (identity), Order (purchase history), Catalog (product inventory), Inventory (availability).
  - Uses Neo4j (graph) for relationship modeling alongside relational databases.
  - **Anti-Corruption Layers**: AI service maintains its own graph representation; translates Catalog products, Order history, and User profiles into graph vertices and edges.
    - Example ACL: When fetching product recommendations, AI translates Catalog's ProductDTO to its own GraphNode(product_type, attributes, embeddings).
  - **Communication**: Synchronous REST for real-time endpoints (`/recommendations`, `/chat`); async Kafka for background graph updates and model training.

---

### 5.1.2 Communication Patterns Summary

| Relationship | Upstream | Downstream | Communication | Consistency |
|---|---|---|---|---|
| Catalog ↔ Inventory | Catalog | Inventory | Events (Kafka) / Sync REST | Eventual |
| Cart → Order | Cart | Order | Sync REST | Strong |
| Order → Payment | Order | Payment | Sync REST / Events | Strong then Eventual |
| Order → Shipping | Order | Shipping | Events (Kafka) | Eventual |
| Order → Inventory | Order | Inventory | Events (Kafka) | Eventual |
| Catalog ↔ Search | Catalog | Search | Events (Kafka) | Eventual |
| AI ← Everything | User, Order, Catalog, Inventory | AI | Events / Sync REST | Eventual |
| Order → Marketing | Order, User | Marketing | Events (Kafka) | Eventual |

---

### 5.1.3 Current Issues and Recommendations

**1. Technical vs. Domain Decomposition**

Currently, the system is decomposed by deployment unit (one Django app per service). However, from a domain perspective:
- Return + Review should be a single After-Sales context.
- Marketing + Notification should be a single Engagement context.
- Cart + Order might eventually be a single "Shopping" context (currently split for scalability).

**Recommendation**: Update the README to clarify which services are:
- **Bounded Contexts** (e.g., Catalog, Inventory, Order, Payment, Shipping).
- **Sub-domains** (e.g., Return + Review = After-Sales domain).
- **Supporting services** (Search, Marketing, Notification).

---

**2. Shared Models**

- **Product ID** is shared between Catalog and Inventory but managed inconsistently.
  - Recommendation: Define a shared protocol or contract (e.g., `ProductRef { catalog_id: UUID, sku: String }`) and document in a shared README.

- **User ID** is referenced by all services but only User service owns identity.
  - Recommendation: Treat User as a foundation; other services never modify user data.

- **Order ID** is referenced by Payment, Shipping, After-Sales, and Marketing.
  - Recommendation: Define Order as the authoritative aggregate; others hold read-only references.

---

**3. Anti-Corruption Layers**

Currently not explicitly documented:
- **AI service** should have a clear ACL when translating Catalog/Order models to its graph representation.
- **Search service** should translate Catalog documents to Elasticsearch schemas with an explicit mapping layer.

**Recommendation**: Add a `shared/models/acl/` folder for ACL implementations if cross-context data flows are non-trivial.

---

**4. Event-Driven Topology**

The current setup supports Kafka (in `full` profile) but event flows are not documented.

**Recommendation**: Document the event schema and topology:
```
Catalog Events: ProductCreated, ProductUpdated, ProductDeleted
  → consumed by: Search (reindex), AI (graph update), Marketing (new product promotion)

Order Events: OrderCreated, OrderConfirmed, OrderShipped, OrderDelivered, OrderCanceled
  → consumed by: Payment (charge), Shipping (fulfill), Inventory (reserve/deduct), 
                Marketing (notify), AI (train), After-Sales (review window)

Inventory Events: StockLow, OutOfStock, StockRestocked
  → consumed by: Catalog (product status), Marketing (alert), Search (facet update)
```

---

## 6. API Gateway

The gateway is an Nginx reverse proxy exposed on port `8080`.

It provides a single entry point for the frontend and forwards requests to the correct backend service.

Notable gateway routes:

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

Health check:

- `GET http://localhost:8080/health`

## 7. Frontend Overview

The frontend is a React application built with Vite.

Key scripts:

- `npm run dev`: default customer experience on port `5173`.
- `npm run dev:customer`: customer mode on port `5173`.
- `npm run dev:staff`: staff mode on port `5174`.
- `npm run dev:portal`: role selection portal on port `5173`.
- `npm run build`: production build.

Main routes currently defined in the frontend:

- `/`: role-dependent entry page.
- `/select`: auth selector.
- `/login/customer`: customer login.
- `/login/staff`: staff login.
- `/staff/dashboard`: staff dashboard.
- `/home`: homepage.
- `/products`: product listing.
- `/product/:id`: product detail.
- `/cart`: shopping cart.
- `/admin`: admin dashboard.

The frontend talks to the gateway via `VITE_API_BASE_URL`.

## 8. Runtime Profiles

The backend compose file supports multiple runtime profiles.

### 8.1 Lightweight Default

Used for faster local development.

Includes:

- Gateway
- Core database services
- Redis
- Django services
- Neo4j

Command:

- `docker compose up --build -d`

### 8.2 Full Infrastructure Profile

Used when testing event-driven, graph, or search-oriented behavior.

Includes:

- Zookeeper
- Kafka
- Elasticsearch

Command:

- `docker compose --profile full up --build -d`

### 8.3 UI Profile

Used to run the frontend inside Docker with the backend stack.

Command:

- `docker compose --profile ui up --build -d`

## 9. Local Run Guide

### Backend Only

1. Change into the backend folder.
2. Start the compose stack.
3. Open the gateway at `http://localhost:8080`.

### Backend + Frontend

Run both stacks with Docker, or run the frontend separately with Vite while the backend runs in containers.

Useful URLs:

- Gateway: `http://localhost:8080`
- Frontend: `http://localhost:5173`

### Service Health Checks

- Gateway health: `http://localhost:8080/health`
- Service health: `http://localhost:<port>/health`

## 10. Data and Integration Notes

The current repository already contains several integration touchpoints that matter for onboarding:

- Customer and staff authentication are separated.
- AI endpoints are already exposed through the gateway.
- The frontend includes role-specific modes for customer, staff, and portal flows.
- The architecture is designed for growth into search, event streaming, and graph-backed AI features.

## 11. Practical Request Flow Examples

### 11.1 Customer Login

1. User opens the customer login page.
2. Frontend calls the user service through the gateway.
3. User service validates credentials.
4. The session or auth result is returned to the frontend.

### 11.2 Browse Products

1. Frontend loads product listing or homepage data.
2. Requests go to the gateway.
3. Gateway forwards them to catalog, inventory, and search services as needed.

### 11.3 Checkout

1. User adds items to cart.
2. Cart and order services coordinate purchase state.
3. Payment service handles checkout-related processing.
4. Shipping and notification services can follow up after the order is created.

### 11.4 AI Recommendation or Chat

1. Frontend calls the AI endpoint through the gateway.
2. AI service serves recommendations or chat responses.
3. Neo4j, Postgres, Redis, or future streaming sources can support the AI layer.

## 12. Documentation Index

- `README.md`: short project summary.
- `backend/README.md`: run instructions and environment usage.
- `backend/docs/ARCHITECTURE.md`: AI architecture and quality criteria.
- This file: repository-level project overview.

## 13. Current Scope

This repository currently provides the service skeletons, gateway wiring, Docker orchestration, and frontend routes needed for an e-commerce platform.

The next natural documentation additions would be:

- A service-by-service API reference.
- An environment variables reference.
- A development checklist for each service.
- A deployment and observability guide.