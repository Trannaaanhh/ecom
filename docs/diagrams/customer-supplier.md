```mermaid
---
title: Customer-Supplier - Shopping & Checkout Flow
---
flowchart TB
    subgraph Customer["👤 Customer"]
        USER[User]
    end
    
    subgraph Shopping_Domain["🛒 SHOPPING & CHECKOUT"]
        direction LR
        CART["🛒 Cart<br/>Context"] 
        ORDER["📋 Order<br/>Context"]
        PAYMENT["💳 Payment<br/>Context"]
    end
    
    subgraph Fulfillment["🚚 FULFILLMENT"]
        direction LR
        SHIPPING["🚚 Shipping<br/>Context"]
        INVENTORY["📦 Inventory<br/>Context"]
    end
    
    subgraph Marketing["📢 MARKETING & NOTIFICATIONS"]
        direction LR
        MKT["📢 Marketing<br/>Context"]
        NOTIF["🔔 Notification<br/>Context"]
    end
    
    subgraph Events["�_ Kafka Events"]
        KAFKA[Event Bus]
    end
    
    subgraph Sync["🔄 REST API"]
        REST[REST Calls]
    end
    
    %% Customer-Supplier relationships (Cart -> Order)
    USER -->|1. Browse| CART
    USER -->|2. Add to Cart| CART
    CART -->|3. Checkout| ORDER
    
    %% Customer-Supplier relationships (Order -> downstream)
    ORDER -->|4. Process Payment| PAYMENT
    ORDER -->|5. Reserve Stock| INVENTORY
    ORDER -->|6. Create Shipment| SHIPPING
    ORDER -->|7. Notify| MKT
    
    %% Downstream -> downstream
    PAYMENT -->|8. Send Confirmation| NOTIF
    SHIPPING -->|9. Send Tracking| NOTIF
    
    %% Event-driven alternatives
    ORDER -.->|OrderConfirmed| KAFKA
    KAFKA -->|Reserve Stock| INVENTORY
    KAFKA -->|Create Shipment| SHIPPING
    KAFKA -->|Order Confirmed| MKT
    KAFKA -->|Order Confirmed| NOTIF
    
    %% Annotations
    note1["Customer-Supplier Pattern:<br/>- Customer (upstream) requests service<br/>- Supplier (downstream) fulfills request<br/>- Order: Cart→Order→Payment,Shipping,Inventory"]
    
    classDef customer fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef supplier fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef downstream fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef events fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    
    class CART, USER customer
    class ORDER supplier
    class PAYMENT, SHIPPING, INVENTORY downstream
    class MKT, NOTIF downstream
    class KAFKA events