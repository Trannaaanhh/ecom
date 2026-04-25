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
        +datetime start_date
        +datetime end_date
        +string status
        +datetime created_at
    }
    
    class Notification {
        +int id PK
        +int user_id FK
        +string title
        +string message
        +string channel
        +string status
        +datetime sent_at
    }
    
    class Recipient {
        +int id PK
        +int campaign_id FK
        +int user_id FK
        +string status
    }
    
    Campaign --> Recipient : Composition (1..*)
    Notification --> User : Association (1..1)
    Recipient --> User : Association (1..1)
    Recipient --> Campaign : Association (1..1)
```

```mermaid
---
title: Database Schema - Marketing & Notification Service (PostgreSQL)
---
erDiagram
    CAMPAIGN {
        int id PK
        string name
        string description
        string type
        datetime start_date
        datetime end_date
        string status
        datetime created_at
    }
    
    NOTIFICATION {
        int id PK
        int user_id FK
        string title
        string message
        string channel
        string status
        datetime sent_at
    }
    
    RECIPIENT {
        int id PK
        int campaign_id FK
        int user_id FK
        string status
    }
    
    CAMPAIGN ||--o{ RECIPIENT : "1:*"
    NOTIFICATION }o--|| USER : "*:1"
    RECIPIENT }o--|| USER : "*:1"
    RECIPIENT }o--|| CAMPAIGN : "*:1"