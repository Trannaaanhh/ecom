```mermaid
---
title: Class Diagram - User Service
---
classDiagram
    class User {
        +int id PK
        +string username
        +string email
        +string password_hash
        +string first_name
        +string last_name
        +string phone
        +string avatar_url
        +int role_id FK
        +boolean is_active
        +boolean is_verified
        +datetime last_login
        +datetime created_at
        +datetime updated_at
    }
    
    class Role {
        +int id PK
        +string name
        +string description
        +string code
        +boolean is_staff
        +boolean is_customer
        +boolean is_active
        +datetime created_at
    }
    
    class Address {
        +int id PK
        +int user_id FK
        +string recipient_name
        +string phone
        +string address_line1
        +string address_line2
        +string city
        +string state
        +string postal_code
        +string country
        +boolean is_default
        +datetime created_at
        +datetime updated_at
    }
    
    User --> Role : Association (1..1)
    User --> Address : Composition (0..*)
```

### Database Mapping (PostgreSQL)

**Table: users**
- `id` (PK) - Auto increment
- `username`, `email`, `password_hash` - Credentials
- `first_name`, `last_name`, `phone` - Personal info
- `avatar_url` - Profile image URL
- `role_id` (FK) - Reference to roles
- `is_active`, `is_verified` - Status flags
- `last_login` - Last login timestamp
- `created_at`, `updated_at` - Timestamps

**Table: roles**
- `id` (PK), `name`, `description`, `code` - Role info
- `is_staff`, `is_customer`, `is_active` - Role flags
- `created_at`

**Table: addresses**
- `id` (PK), `user_id` (FK)
- `recipient_name`, `phone`, `address_line1`, `address_line2`
- `city`, `state`, `postal_code`, `country`
- `is_default` - Default shipping address
- Timestamps

**Relationships:**
- User → Role: Many-to-One (*:1)
- User → Address: One-to-Many (1:*)