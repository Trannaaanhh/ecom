```mermaid
---
title: Class Diagram - Cart Service
---
classDiagram
    class Cart {
        +int id PK
        +int user_id FK
        +string session_id
        +decimal total_amount
        +string status
        +datetime created_at
        +datetime updated_at
    }
    
    class CartItem {
        +int id PK
        +int cart_id FK
        +int product_id FK
        +int quantity
        +decimal unit_price
        +decimal subtotal
        +datetime created_at
    }
    
    Cart --> CartItem : Composition (1..*)
    Cart --> User : Association (1..1)
    CartItem --> Product : Association (1..1)
```

```mermaid
---
title: Database Schema - Cart Service (PostgreSQL)
---
erDiagram
    CART {
        int id PK
        int user_id FK
        string session_id
        decimal total_amount
        string status
        datetime created_at
        datetime updated_at
    }
    
    CART_ITEM {
        int id PK
        int cart_id FK
        int product_id FK
        int quantity
        decimal unit_price
        decimal subtotal
        datetime created_at
    }
    
    CART ||--o{ CART_ITEM : "1:*"
    CART }o--|| USER : "*:1"
    CART_ITEM }o--|| PRODUCT : "*:1"