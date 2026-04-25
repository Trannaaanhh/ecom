```mermaid
---
title: Class Diagram - Payment Service
---
classDiagram
    class Payment {
        +int id PK
        +int order_id FK
        +decimal amount
        +string payment_method
        +string status
        +string transaction_id
        +datetime payment_date
        +datetime created_at
    }
    
    class Transaction {
        +int id PK
        +int payment_id FK
        +string transaction_type
        +decimal amount
        +string status
        +text gateway_response
        +datetime created_at
    }
    
    Payment --> Transaction : Composition (0..*)
    Payment --> Order : Association (1..1)
```

```mermaid
---
title: Database Schema - Payment Service (PostgreSQL)
---
erDiagram
    PAYMENT {
        int id PK
        int order_id FK
        decimal amount
        string payment_method
        string status
        string transaction_id
        datetime payment_date
        datetime created_at
    }
    
    TRANSACTION {
        int id PK
        int payment_id FK
        string transaction_type
        decimal amount
        string status
        text gateway_response
        datetime created_at
    }
    
    PAYMENT ||--o{ TRANSACTION : "0:*"
    PAYMENT }o--|| ORDER : "*:1"