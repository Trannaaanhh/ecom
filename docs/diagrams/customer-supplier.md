```mermaid
---
title: Customer-Supplier - Shopping & Checkout Flow
---
flowchart TB
    subgraph Customer["Customer"]
        USER[User]
    end
    
    subgraph Shopping_Domain["SHOPPING CHECKOUT"]
        direction LR
        CART[Cart Context] 
        ORDER[Order Context]
        PAYMENT[Payment Context]
    end
    
    subgraph Fulfillment["FULFILLMENT"]
        direction LR
        SHIPPING[Shipping Context]
        INVENTORY[Inventory Context]
    end
    
    subgraph Marketing["MARKETING"]
        direction LR
        MKT[Marketing Context]
        NOTIF[Notification Context]
    end
    
    subgraph Events["Kafka"]
        KAFKA[Event Bus]
    end
    
    USER -->|Browse| CART
    USER -->|Add to Cart| CART
    CART -->|Checkout| ORDER
    
    ORDER -->|Process Payment| PAYMENT
    ORDER -->|Reserve Stock| INVENTORY
    ORDER -->|Create Shipment| SHIPPING
    ORDER -->|Notify| MKT
    
    PAYMENT -->|Send Confirmation| NOTIF
    SHIPPING -->|Send Tracking| NOTIF
    
    ORDER -.->|OrderConfirmed| KAFKA
    KAFKA -->|Reserve Stock| INVENTORY
    KAFKA -->|Create Shipment| SHIPPING
    KAFKA -->|Order Confirmed| MKT
    KAFKA -->|Order Confirmed| NOTIF
    
    classDef customer fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef supplier fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef downstream fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef events fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    
    class CART,USER customer
    class ORDER supplier
    class PAYMENT,SHIPPING,INVENTORY downstream
    class MKT,NOTIF downstream
    class KAFKA events