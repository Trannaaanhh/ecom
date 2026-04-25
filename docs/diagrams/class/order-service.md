```mermaid
---
title: Class Diagram - Order Service
---
classDiagram
    class Order {
        +int id PK
        +int user_id FK
        +string order_number
        +string order_prefix
        +decimal subtotal
        +decimal tax_amount
        +decimal shipping_amount
        +decimal discount_amount
        +decimal total_amount
        +string status
        +string payment_status
        +text shipping_address
        +text billing_address
        +string shipping_method
        +string shipping_phone
        +text customer_note
        +datetime order_date
        +datetime confirmed_at
        +datetime cancelled_at
        +datetime shipped_at
        +datetime delivered_at
        +datetime created_at
        +datetime updated_at
    }
    
    class OrderItem {
        +int id PK
        +int order_id FK
        +int product_id FK
        +string product_name
        +string product_image
        +int quantity
        +decimal unit_price
        +decimal discount_amount
        +decimal subtotal
    }
    
    class OrderStatus {
        +int id PK
        +int order_id FK
        +string status
        +string notes
        +boolean is_system
        +datetime created_at
        +int created_by
    }
    
    Order --> OrderItem : Composition (1..*)
    Order --> OrderStatus : Composition (0..*)
```

### Database Mapping (PostgreSQL)

**Table: orders**
- `id` (PK), `user_id` (FK) - Order identification
- `order_number`, `order_prefix` - Unique order number (e.g., ORD-2024-001)
- `subtotal`, `tax_amount`, `shipping_amount`, `discount_amount`, `total_amount` - Money
- `status` - pending, confirmed, shipped, delivered, cancelled
- `payment_status` - pending, paid, failed, refunded
- `shipping_address`, `billing_address` - Full address (JSON/text)
- `shipping_method`, `shipping_phone` - Shipping details
- `customer_note` - Customer notes
- `order_date`, `confirmed_at`, `cancelled_at`, `shipped_at`, `delivered_at` - Status timestamps
- Timestamps

**Table: order_items**
- `id` (PK), `order_id` (FK), `product_id` (FK)
- `product_name`, `product_image` - Denormalized product info
- `quantity`, `unit_price`, `discount_amount`, `subtotal`

**Table: order_statuses**
- `id` (PK), `order_id` (FK)
- `status`, `notes` - Status history
- `is_system` - System update flag
- `created_at`, `created_by` - Who created the status

**Relationships:**
- Order → OrderItem: One-to-Many (1:*)
- Order → OrderStatus: One-to-Many (0:*)
- Order ↔ User: Many-to-One