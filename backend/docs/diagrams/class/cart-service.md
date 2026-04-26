```mermaid
---
title: Class Diagram - Cart Service
---
classDiagram
    class Cart {
        +int id PK
        +int user_id FK
        +string session_id
        +decimal subtotal
        +decimal tax_amount
        +decimal shipping_amount
        +decimal discount_amount
        +decimal total_amount
        +string status
        +string coupon_code
        +datetime created_at
        +datetime updated_at
    }
    
    class CartItem {
        +int id PK
        +int cart_id FK
        +int product_id FK
        +string product_name
        +string product_image
        +int quantity
        +decimal unit_price
        +decimal discount_amount
        +decimal subtotal
        +datetime created_at
        +datetime updated_at
    }
    
    class Coupon {
        +int id PK
        +string code
        +string description
        +string discount_type
        +decimal discount_value
        +decimal min_order_amount
        +decimal max_discount_amount
        +datetime valid_from
        +datetime valid_until
        +boolean is_active
        +int usage_limit
        +int usage_count
    }
    
    Cart --> CartItem : Composition (1..*)
    Cart --> Coupon : Association (0..1)
```

### Database Mapping (PostgreSQL)

**Table: carts**
- `id` (PK), `user_id` (FK), `session_id` - Cart identification
- `subtotal`, `tax_amount`, `shipping_amount`, `discount_amount`, `total_amount` - Money fields
- `status` - active, checked_out, expired
- `coupon_code` - Applied coupon
- Timestamps

**Table: cart_items**
- `id` (PK), `cart_id` (FK), `product_id` (FK) - References
- `product_name`, `product_image` - Denormalized product info
- `quantity`, `unit_price`, `discount_amount`, `subtotal` - Item details
- Timestamps

**Table: coupons**
- `id` (PK), `code` - Unique coupon code
- `description`, `discount_type` - percentage/fixed
- `discount_value` - Discount amount or percentage
- `min_order_amount`, `max_discount_amount` - Conditions
- `valid_from`, `valid_until` - Validity period
- `is_active`, `usage_limit`, `usage_count` - Usage tracking

**Relationships:**
- Cart → CartItem: One-to-Many (1:*)
- Cart → Coupon: Optional One-to-One (0:1)