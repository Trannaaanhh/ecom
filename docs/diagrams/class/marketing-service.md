```mermaid
---
title: Class Diagram - Marketing & Notification Service
---
classDiagram
    class Campaign {
        +int id PK
        +string name
        +string description
        +string type
        +string target_audience
        +string discount_type
        +decimal discount_value
        +decimal min_order_amount
        +decimal max_discount_amount
        +int max_uses
        +int usage_count
        +datetime start_date
        +datetime end_date
        +string status
        +boolean is_featured
        +string image_url
        +datetime created_at
        +datetime updated_at
    }
    
    class Notification {
        +int id PK
        +int user_id FK
        +string type
        +string title
        +string message
        +string channel
        +string priority
        +string status
        +string action_url
        +string image_url
        +datetime sent_at
        +datetime read_at
        +datetime created_at
    }
    
    class Recipient {
        +int id PK
        +int campaign_id FK
        +int user_id FK
        +string status
        +string reason_excluded
        +datetime sent_at
        +datetime clicked_at
    }
    
    class Subscriber {
        +int id PK
        +string email
        +string phone
        +boolean is_subscribed
        +string subscription_type
        +datetime subscribed_at
        +datetime unsubscribed_at
    }
    
    Campaign --> Recipient : Composition (1..*)
```

### Database Mapping (PostgreSQL)

**Table: campaigns**
- `id` (PK)
- `name`, `description`, `type` - Campaign info (promotion, flash_sale, newsletter)
- `target_audience` - all, new_customer, vip, etc.
- `discount_type` - percentage, fixed
- `discount_value` - Discount amount/percentage
- `min_order_amount`, `max_discount_amount` - Conditions
- `max_uses`, `usage_count` - Usage tracking
- `start_date`, `end_date` - Campaign period
- `status` - draft, active, paused, ended
- `is_featured`, `image_url`
- Timestamps

**Table: notifications**
- `id` (PK), `user_id` (FK)
- `type` - order, payment, system, promotion
- `title`, `message` - Content
- `channel` - email, sms, push, in_app
- `priority` - low, normal, high
- `status` - pending, sent, read
- `action_url` - Click action URL
- `image_url`
- `sent_at`, `read_at`, `created_at`

**Table: recipients**
- `id` (PK), `campaign_id` (FK), `user_id` (FK)
- `status` - pending, sent, clicked, failed
- `reason_excluded` - Exclusion reason
- `sent_at`, `clicked_at`

**Table: subscribers**
- `id` (PK)
- `email`, `phone` - Contact info
- `is_subscribed` - Subscription status
- `subscription_type` - newsletter, sms, all
- `subscribed_at`, `unsubscribed_at`

**Relationships:**
- Campaign → Recipient: One-to-Many (1:*)