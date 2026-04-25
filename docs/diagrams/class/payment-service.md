```mermaid
---
title: Class Diagram - Payment Service
---
classDiagram
    class Payment {
        +int id PK
        +int order_id FK
        +int user_id FK
        +decimal amount
        +decimal amount_paid
        +decimal refunded_amount
        +string currency
        +string payment_method
        +string payment_provider
        +string status
        +string transaction_id
        +string gateway_response
        +string failure_reason
        +datetime payment_date
        +datetime expires_at
        +datetime created_at
        +datetime updated_at
    }
    
    class Transaction {
        +int id PK
        +int payment_id FK
        +string transaction_type
        +decimal amount
        +string status
        +string transaction_ref
        +text gateway_request
        +text gateway_response
        +string error_code
        +string error_message
        +datetime created_at
    }
    
    class Refund {
        +int id PK
        +int payment_id FK
        +int order_id FK
        +int user_id FK
        +decimal amount
        +string reason
        +string status
        +string transaction_id
        +datetime processed_at
        +datetime created_at
    }
    
    Payment --> Transaction : Composition (0..*)
    Payment --> Refund : Composition (0..*)
```

### Database Mapping (PostgreSQL)

**Table: payments**
- `id` (PK), `order_id` (FK), `user_id` (FK) - References
- `amount` - Total payment amount
- `amount_paid` - Actually paid amount
- `refunded_amount` - Refunded amount
- `currency` - Currency code (VND, USD)
- `payment_method` - cod, credit_card, bank_transfer, momo
- `payment_provider` - vnpay, stripe, paypal
- `status` - pending, completed, failed, refunded, expired
- `transaction_id` - Provider transaction ID
- `gateway_response` - Provider response (JSON/text)
- `failure_reason` - Failure message
- `payment_date`, `expires_at` - Payment timing
- Timestamps

**Table: transactions**
- `id` (PK), `payment_id` (FK)
- `transaction_type` - authorization, capture, refund
- `amount`, `status`
- `transaction_ref` - Reference from provider
- `gateway_request`, `gateway_response`
- `error_code`, `error_message`

**Table: refunds**
- `id` (PK), `payment_id` (FK), `order_id` (FK), `user_id` (FK)
- `amount`, `reason`, `status`
- `transaction_id`, `processed_at`

**Relationships:**
- Payment → Transaction: One-to-Many (0:*)
- Payment → Refund: One-to-Many (0:*)