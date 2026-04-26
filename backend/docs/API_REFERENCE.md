# API Reference

This document catalogs the gateway-facing APIs that exist in the repository today. It distinguishes between active demo logic and scaffold endpoints.

## 1. Conventions

- All gateway examples assume base URL `http://localhost:8080`
- Most services expose a direct `/health` endpoint internally and a gateway proxy under `/api/health/<service>/`
- "Scaffold" means the endpoint exists but does not yet implement real domain persistence or workflow logic

## 2. Health endpoints

- `GET /health`
- `GET /api/health/gateway/`
- `GET /api/health/user/`
- `GET /api/health/catalog/`
- `GET /api/health/inventory/`
- `GET /api/health/search/`
- `GET /api/health/cart/`
- `GET /api/health/order/`
- `GET /api/health/payment/`
- `GET /api/health/shipping/`
- `GET /api/health/return-review/`
- `GET /api/health/marketing/`
- `GET /api/health/ai/`

## 3. User service

Status: partially implemented, actively used by frontend

### `POST /api/users/customer/login/`

Purpose:

- customer login

Request body:

```json
{
  "email": "customer@example.com",
  "password": "secret"
}
```

Response:

- demo token and basic user profile

### `POST /api/users/staff/login/`

Purpose:

- staff login

Request body:

```json
{
  "username": "admin",
  "password": "secret"
}
```

Response:

- demo token and basic staff profile

### `GET /api/users/`

Purpose:

- scaffold entry point

## 4. Catalog service

Status: active demo implementation, heavily used by frontend

### `GET /api/products/`

Query params:

- `category`
- `q`

Returns:

- filtered in-memory product list

### `GET /api/products/featured/`

Returns:

- featured subset of products

### `GET /api/products/trending/`

Returns:

- top-selling demo products

### `POST /api/products/recommend/<user_id>/`

Purpose:

- catalog-owned homepage recommendation endpoint with AI fallback/integration

Behavior:

- calls AI service recommendation endpoint
- falls back to local popularity results

### `POST /api/products/<product_id>/similar/`

Purpose:

- category-based local fallback similar products

### `GET /api/products/<product_id>/`

Returns:

- product detail with demo description and specs

### `GET /api/categories/`

Returns:

- category list with icon and count metadata

## 5. Inventory service

Status: scaffold

### `GET /api/inventory/`

Returns:

- service metadata only

## 6. Search service

Status: partial implementation

### `GET /api/search/`

Returns:

- scaffold metadata

### `POST /api/search/rerank/`

Purpose:

- local search candidate generation with AI reranking

Request body:

```json
{
  "user_id": "user-123",
  "query": "iphone",
  "preferred_category": "phone"
}
```

Behavior:

- builds local result set
- sends candidate IDs to AI service
- falls back to popularity sorting if AI is unavailable

## 7. Cart service

Status: scaffold, but visible in frontend flow

### `GET /api/cart/`

Returns:

- demo cart items
- demo summary
- backend warning text

Frontend nuance:

- the UI prefers localStorage cart state when available
- backend cart payload is primarily fallback/demo data right now

## 8. Order service

Status: partial implementation

### `GET /api/orders/`

Returns:

- demo recent orders

### `GET /api/orders/admin-summary/`

Returns:

- KPI summary
- recent order list

Used by:

- admin/staff dashboard views

## 9. Payment service

Status: partial implementation, active checkout path

### `GET /api/payments/`

Returns:

- scaffold metadata

### `POST /api/payments/checkout/`

Purpose:

- validate customer checkout payload
- call AI fraud scoring
- return demo payment result

Request body:

```json
{
  "amount": 1500000,
  "customer": {
    "name": "Nguyen Van A",
    "phone": "0901234567",
    "email": "customer@example.com",
    "address": "123 Ly Thuong Kiet",
    "note": "Call before delivery"
  },
  "user_id": "user-123",
  "risk_flags": ["new_device"]
}
```

Responses:

- `200`: demo payment success
- `202`: pending manual review when fraud requires review
- `400`: missing customer or amount data

## 10. Shipping service

Status: scaffold

### `GET /api/shipping/`

Returns:

- service metadata only

## 11. Return-review service

Status: scaffold

### `GET /api/returns/`

Returns:

- returns scaffold response

### `GET /api/reviews/`

Returns:

- reviews scaffold response

## 12. Marketing-notification service

Status: scaffold

### `GET /api/marketing/`

Returns:

- marketing scaffold response

### `GET /api/notifications/`

Returns:

- notifications scaffold response

## 13. AI service

Status: the most complete backend service in the repository

### `GET /api/ai/recommendations/<user_id>/`

Purpose:

- recommendation endpoint used by catalog integration

### `GET|POST /api/ai/recommend/`

Purpose:

- general recommendation endpoint used by frontend AI helper

Accepted fields:

- `user_id`
- `query`
- `behavior`
- `preferred_category`
- `limit`

### `POST /api/ai/recommend/similar/`

Request body:

```json
{
  "product_id": "1",
  "limit": 6
}
```

### `POST /api/ai/search/rerank/`

Accepted fields:

- `result_ids`
- `query`
- `user_id`
- `preferred_category`
- `limit`

### `POST /api/ai/fraud/score/`

Accepted fields:

- `amount`
- `user_id`
- `risk_flags`

### `GET /api/ai/forecast/<product_id>/?horizon=7`

Purpose:

- demand forecast

### `POST /api/ai/chat/`
### `POST /api/ai/chatbot/`

Purpose:

- customer-facing AI chat replies

Accepted fields:

- `user_id`
- `message`
- `behavior`

## 14. Frontend-to-API map

Active frontend dependencies:

- homepage: `/api/categories/`, `/api/products/trending/`, `/api/products/featured/`, `/api/products/`, `/api/ai/recommend/`
- product listing: `/api/products/`, `/api/categories/`
- product detail: `/api/products/<id>/`, `/api/ai/recommend/similar/`
- cart: `/api/cart/`, `/api/payments/checkout/`
- customer login: `/api/users/customer/login/`
- staff login: `/api/users/staff/login/`
- dashboards: `/api/orders/admin-summary/`
- AI experience: `/api/products/` and AI endpoints

## 15. Implementation status summary

- Active demo/business flow endpoints: user, catalog, order summary, payment checkout, AI
- Hybrid demo/scaffold endpoints: search, cart
- Pure scaffold endpoints: inventory, shipping, returns, reviews, marketing, notifications
