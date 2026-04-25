```mermaid
---
title: Class Diagram - Return Service
---
classDiagram
    class ReturnRequest {
        +int id PK
        +int order_id FK
        +int user_id FK
        +string return_number
        +string reason
        +string reason_detail
        +text description
        +string status
        +decimal refund_amount
        +decimal refund_shipping
        +string refund_method
        +boolean is_partial
        +string pickup_address
        +datetime pickup_date
        +datetime request_date
        +datetime approved_at
        +datetime picked_up_at
        +datetime received_at
        +datetime processed_at
        +datetime refunded_at
        +datetime created_at
        +datetime updated_at
    }
    
    class ReturnItem {
        +int id PK
        +int return_request_id FK
        +int order_item_id FK
        +int product_id FK
        +int quantity
        +string condition
        +string return_reason
        +decimal refund_amount
    }
    
    class ReturnStatus {
        +int id PK
        +int return_request_id FK
        +string status
        +string notes
        +string updated_by
        +datetime created_at
    }
    
    ReturnRequest --> ReturnItem : Composition (1..*)
    ReturnRequest --> ReturnStatus : Composition (0..*)
```

### Database Mapping (PostgreSQL)

**Table: return_requests**
- `id` (PK), `order_id` (FK), `user_id` (FK)
- `return_number` - Unique return number (e.g., RTN-2024-001)
- `reason` - Main reason (defective, wrong_item, not_as_described)
- `reason_detail` - Detailed reason
- `description` - Additional description
- `status` - pending, approved, picked_up, received, processing, refunded, rejected
- `refund_amount`, `refund_shipping` - Refund amounts
- `refund_method` - original_payment, bank_transfer
- `is_partial` - Partial return flag
- `pickup_address`, `pickup_date` - Pickup scheduling
- Status timestamps: request_date, approved_at, picked_up_at, received_at, processed_at, refunded_at
- Timestamps

**Table: return_items**
- `id` (PK), `return_request_id` (FK), `order_item_id` (FK), `product_id` (FK)
- `quantity`, `condition` - Item condition at return
- `return_reason`, `refund_amount`

**Table: return_statuses**
- `id` (PK), `return_request_id` (FK)
- `status`, `notes` - Status history
- `updated_by`, `created_at`

**Relationships:**
- ReturnRequest → ReturnItem: One-to-Many (1:*)
- ReturnRequest → ReturnStatus: One-to-Many (0:*)