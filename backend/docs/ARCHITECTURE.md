# Architecture and DDD Guide

This document defines the intended architecture for Ecommerge and anchors it to the code that already exists. It should be used as the reference for bounded-context decisions, service interactions, and integration patterns.

## 1. Architecture stance

Ecommerge is designed as a DDD-oriented microservice platform.

Primary rules:

- user-facing flows should prefer synchronous requests through the gateway
- cross-context propagation should prefer asynchronous domain events
- each service owns its own model and persistence concerns
- downstream contexts should not leak upstream models directly without translation

## 2. Current architecture vs target architecture

### Current architecture in code

- One Django project per service
- Nginx path-based API gateway
- PostgreSQL for most services
- MySQL reserved for catalog
- Neo4j and optional Kafka in AI
- Several services still expose scaffold endpoints
- Some synchronous service-to-service calls already exist for AI-assisted flows

### Target architecture

- bounded contexts expressed through stable aggregates and domain services
- gateway-first synchronous APIs for storefront and staff interactions
- Kafka-based event choreography for inventory, shipping, notification, search indexing, and AI enrichment
- explicit anti-corruption layers for Search and AI

## 3. Bounded context map

### Core contexts

#### Catalog

Owns:

- product master data
- categories
- product attributes
- merchandising metadata

Current implementation:

- demo dataset powering listing and detail flows
- gateway routes under `/api/products/` and `/api/categories/`

Target integration:

- upstream for Search, Inventory, AI, and Marketing
- emits `ProductCreated`, `ProductUpdated`, `ProductDeleted`

#### Inventory

Owns:

- stock levels
- reservations
- availability
- low-stock signals

Current implementation:

- service boundary exists
- business logic is not implemented yet

Target integration:

- downstream of Catalog for product references
- downstream of Order for reservation and deduction flows
- upstream for availability views and stock alerts

#### Order

Owns:

- order aggregate
- order lifecycle
- order line items
- fulfillment readiness

Current implementation:

- admin summary endpoint and stub order list

Target integration:

- downstream of Cart in checkout
- upstream of Payment, Shipping, After-Sales, Marketing, and AI
- emits `OrderCreated`, `OrderConfirmed`, `OrderShipped`, `OrderDelivered`, `OrderCanceled`

#### Payment

Owns:

- payment intent
- transaction state
- payment decisioning
- refund workflow

Current implementation:

- checkout validation
- synchronous call to AI fraud scoring
- demo payment response

Target integration:

- synchronous during checkout for immediate user feedback
- optional event-driven settlement and reconciliation later

#### Shipping

Owns:

- shipment creation
- tracking
- carrier allocation
- delivery state

Current implementation:

- service boundary only

Target integration:

- downstream of Order
- emits shipping progress events for notifications and after-sales

#### After-Sales

Owns:

- returns
- reviews
- return eligibility
- review eligibility

Current implementation:

- one combined `return-review-service`
- returns and reviews exposed as separate paths
- only scaffold responses today

Target integration:

- downstream of Order and Shipping
- should evolve as one bounded context with separate subdomains if needed

### Supporting contexts

#### User

Owns:

- identity
- authentication
- roles
- staff/customer access boundaries

Current implementation:

- customer login endpoint
- staff login endpoint
- demo tokens

Target integration:

- upstream identity provider for all user-facing services

#### Search

Owns:

- query model
- ranking model
- search document representation

Current implementation:

- local fallback search
- synchronous AI reranking call

Target integration:

- downstream consumer of Catalog and Inventory events
- Elasticsearch-backed indexing in the `full` profile

#### Marketing and Notification

Owns:

- promotions
- outbound messaging
- campaign triggers
- notification channel orchestration

Current implementation:

- service boundary only

Target integration:

- downstream of Order, Catalog, User, and Shipping events

### Specialty context

#### AI and Intelligence

Owns:

- personalized recommendation logic
- graph-assisted similarity
- reranking
- fraud scoring
- demand forecasting
- customer chat augmentation

Current implementation:

- the most complete cross-context service in the repo
- reads and translates product and user behavior into its own model
- stores graph relationships in Neo4j
- can consume Kafka events when enabled

Target integration:

- downstream of Catalog, Order, Inventory, User, and Search
- protected by anti-corruption layers to avoid leaking external domain models into AI internals

## 4. Communication patterns

### Synchronous

Use synchronous APIs for:

- login
- product browsing
- product detail
- checkout
- staff dashboard
- real-time AI recommendation and chat

Current synchronous flows already implemented:

- frontend -> gateway -> service
- catalog -> ai
- search -> ai
- payment -> ai

### Asynchronous

Use Kafka events for:

- catalog changes to Search and AI
- order lifecycle propagation
- stock updates
- marketing triggers
- graph enrichment and model updates

Current evented code already exists in AI for:

- `user_activity`
- `order_created`

## 5. Anti-corruption layers

ACLs are required in two important places.

### Search ACL

Search should translate catalog entities into search documents rather than reusing catalog DTOs directly.

Minimum target document shape:

- `product_id`
- `name`
- `category`
- `availability`
- `price`
- `attributes`
- `ranking_features`

### AI ACL

AI should translate cross-context data into its own graph and recommendation model.

Examples already visible in code:

- user behavior events normalized into `SEARCHED`, `VIEWED`, `ADDED_TO_CART`, `BOUGHT`
- product/category data translated into graph nodes and category relationships
- fallback product catalog materialized as AI-owned records

## 6. Data ownership

The following ownership rules should remain stable.

- Catalog owns product master data.
- User owns identity.
- Order owns order state and lifecycle.
- Payment owns transaction state.
- Shipping owns shipment state.
- After-Sales owns return and review state.
- Search owns search index documents.
- AI owns recommendation and graph representations.

Cross-context references should be identifier-based, not shared mutable models.

## 7. Event topology

Recommended event topology for the platform:

### Catalog events

- `ProductCreated`
- `ProductUpdated`
- `ProductDeleted`

Consumers:

- Search reindexing
- AI graph sync
- Marketing promotion triggers

### Order events

- `OrderCreated`
- `OrderConfirmed`
- `OrderShipped`
- `OrderDelivered`
- `OrderCanceled`

Consumers:

- Payment
- Inventory
- Shipping
- Marketing/Notification
- After-Sales
- AI

### Inventory events

- `StockReserved`
- `StockReleased`
- `StockLow`
- `OutOfStock`
- `StockRestocked`

Consumers:

- Catalog
- Search
- Marketing

### User activity events

- `UserViewedProduct`
- `UserSearched`
- `UserAddedToCart`
- `UserPurchased`

Current code equivalent:

- `user_activity` topic handled by AI consumer

## 8. AI architecture

The current AI engine combines multiple strategies into a single scoring pipeline.

### Recommendation pipeline

- graph candidate generation from Neo4j
- behavior scoring from local events or graph history
- optional LSTM artifact contribution
- query similarity scoring
- popularity scoring
- category bonus
- weighted final score

Current model label:

- `hybrid-lstm-graph-rag-v1`

### Search reranking pipeline

- query relevance
- user behavior
- popularity
- category affinity

Current model label:

- `search-rerank-v1`

### Fraud scoring pipeline

- amount-based risk
- explicit risk flags
- user history penalty/relief

Current model label:

- `fraud-rule-graph-v1`

### Forecast pipeline

- popularity-derived baseline
- naive seasonal adjustment

Current model label:

- `forecast-naive-v1`

### Chat pipeline

- build recommendation-backed context
- use Gemini if configured
- otherwise use deterministic fallback reply

Current model labels:

- `gemini-1.5-flash-latest`
- `hybrid-rag-fallback-v1`

## 9. Security and operational constraints

Current code is development-oriented, so these gaps should be treated explicitly:

- demo secret fallbacks exist in Django settings
- auth tokens are placeholders
- gateway does not enforce auth
- service-to-service calls are not authenticated
- input validation is still thin outside checkout

The architecture should move toward:

- token validation owned by User context
- least-privilege service access
- event contracts with schema versioning
- explicit audit points on payment, order, and AI-sensitive actions

## 10. Architecture decisions for future work

When implementing new features:

1. decide the owning bounded context first
2. keep user-facing orchestration synchronous where latency matters
3. publish domain events for downstream propagation
4. translate cross-context data through ACLs
5. avoid moving business logic into gateway or frontend state as a substitute for domain services

This architecture is only healthy if service boundaries continue to reflect business ownership, not just deployment convenience.
