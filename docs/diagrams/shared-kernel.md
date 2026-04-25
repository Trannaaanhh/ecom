```mermaid
---
title: Shared Kernel - Catalog & Inventory
---
flowchart TB
    subgraph Catalog_Context["📦 CATALOG CONTEXT"]
        direction TB
        CAT_DB[(MySQL)]
        CAT_SVC[Catalog Service]
        CAT_SVC --> CAT_DB
        CAT_API["GET /api/products/<br/>GET /api/categories/"]
        CAT_SVC --> CAT_API
    end
    
    subgraph Inventory_Context["📦 INVENTORY CONTEXT"]
        direction TB
        INV_DB[(PostgreSQL)]
        INV_SVC[Inventory Service]
        INV_SVC --> INV_DB
        INV_API["GET /api/inventory/"]
        INV_SVC --> INV_API
    end
    
    subgraph Kafka["�_ Kafka"]
        KAFKA[Event Bus]
    end
    
    subgraph Sync["🔄 Synchronous"]
        REST[REST API]
    end
    
    subgraph ACL["🛡️ Anti-Corruption Layer"]
        ACL[ACL Adapter]
    end
    
    %% Primary relationship: SHARED KERNEL
    CATALOG_Context -->|1. ProductCreated<br/>2. ProductUpdated<br/>3. ProductDeleted| KAFKA
    KAFKA -->|Events| INVENTORY_Context
    
    %% Alternative Sync
    CATALOG_Context -.-> REST
    REST -.->|GET /api/products/{id}| INVENTORY_Context
    
    %% ACL
    INV_SVC -.-> ACL
    ACL -.-> CAT_SVC
    
    %% Shared element
    SHARED[("Shared Kernel<br/>Product ID")]
    CAT_SVC --- SHARED
    INV_SVC --- SHARED
    
    %% Legend
    subgraph Legend["📋 Legend"]
        L1[Sync REST]
        L2[Event-driven]
        L3[ACL]
        L4[Shared Model]
    end
    
    classDef primary fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef downstream fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef kafka fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef acl fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef shared fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    
    class CATALOG_Context, CAT_SVC, CAT_API primary
    class INVENTORY_Context, INV_SVC, INV_API downstream
    class KAFKA kafka
    class ACL, ACL_INV acl