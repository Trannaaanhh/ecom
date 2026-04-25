```mermaid
---
title: Class Diagram - Shipping Service
---
classDiagram
    class Shipment {
        +int id PK
        +int order_id FK
        +int user_id FK
        +string tracking_number
        +string carrier
        +string service_type
        +string status
        +text shipping_address
        +text recipient_name
        +string recipient_phone
        +string recipient_email
        +int weight
        +text dimensions
        +int shipping_cost
        +datetime shipped_at
        +datetime estimated_delivery
        +datetime delivered_at
        +datetime created_at
        +datetime updated_at
    }
    
    class Tracking {
        +int id PK
        +int shipment_id FK
        +string location
        +string status
        +string description
        +string signed_by
        +string delivery_proof_url
        +datetime timestamp
    }
    
    class ShippingRate {
        +int id PK
        +string carrier
        +string service_type
        +decimal base_rate
        +decimal per_kg_rate
        +int estimated_days
        +boolean is_active
        +datetime created_at
    }
    
    Shipment --> Tracking : Composition (0..*)
```

### Database Mapping (PostgreSQL)

**Table: shipments**
- `id` (PK), `order_id` (FK), `user_id` (FK)
- `tracking_number` - Tracking number (e.g., VNPOST123456)
- `carrier` - ghn, ghtk, viettel, jntf
- `service_type` - express, standard, economy
- `status` - pending, shipped, in_transit, delivered, failed
- `shipping_address` - Full shipping address
- `recipient_name`, `recipient_phone`, `recipient_email`
- `weight` (grams), `dimensions` (JSON)
- `shipping_cost` - Shipping fee
- `shipped_at`, `estimated_delivery`, `delivered_at` - Timing
- Timestamps

**Table: trackings**
- `id` (PK), `shipment_id` (FK)
- `location` - Current location
- `status`, `description`
- `signed_by` - Who signed for delivery
- `delivery_proof_url` - Proof image URL
- `timestamp`

**Table: shipping_rates**
- `id` (PK)
- `carrier`, `service_type` - Rate identification
- `base_rate`, `per_kg_rate` - Rate calculation
- `estimated_days` - Delivery days
- `is_active`, `created_at`

**Relationships:**
- Shipment → Tracking: One-to-Many (0:*)
- Shipment ↔ Order: Many-to-One
- Shipment → ShippingRate: Optional One-to-One