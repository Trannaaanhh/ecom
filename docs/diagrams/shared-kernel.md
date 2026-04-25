```mermaid
---
title: Shared Kernel - Catalog & Inventory
---
flowchart TB
    subgraph Catalog_Context["CATALOG CONTEXT"]
        direction TB
        CAT_DB[(MySQL)]
        CAT_SVC[Catalog Service]
        CAT_SVC --> CAT_DB
        CAT_API["GET /api/products"]
        CAT_SVC --> CAT_API
    end
    
    subgraph Inventory_Context["INVENTORY CONTEXT"]
        direction TB
        INV_DB[(PostgreSQL)]
        INV_SVC[Inventory Service]
        INV_SVC --> INV_DB
        INV_API["GET /api/inventory"]
        INV_SVC --> INV_API
    end
    
    subgraph Kafka["Kafka"]
        KAFKA[Event Bus]
    end
    
    subgraph Sync["Sync"]
        REST[REST API]
    end
    
    subgraph ACL["ACL"]
        ACL[ACL Adapter]
    end
    
    CATALOG_Context -->|ProductCreated| KAFKA
    CATALOG_Context -->|ProductUpdated| KAFKA
    CATALOG_Context -->|ProductDeleted| KAFKA
    KAFKA --> INVENTORY_Context
    
    CATALOG_Context -.-> REST
    REST -.-> INVENTORY_Context
    
    INV_SVC -.-> ACL
    ACL -.-> CAT_SVC
    
    SHARED[("Shared Kernel Product ID")]
    CAT_SVC --- SHARED
    INV_SVC --- SHARED
    
    classDef primary fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef downstream fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef kafka fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef acl fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef shared fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    
    class Catalog_Context,CAT_SVC,CAT_API primary
    class Inventory_Context,INV_SVC,INV_API downstream
    class KAFKA kafka
    class ACL ac