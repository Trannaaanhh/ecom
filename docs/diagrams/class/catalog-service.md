```mermaid
---
title: Class Diagram - Catalog Service
---
classDiagram
    class Category {
        +int id PK
        +string name
        +string description
        +string slug
        +int parent_id FK
        +datetime created_at
        +datetime updated_at
    }
    
    class Product {
        +int id PK
        +string name
        +string description
        +decimal price
        +string sku
        +int category_id FK
        +string image_url
        +boolean is_active
        +datetime created_at
        +datetime updated_at
    }
    
    class Book {
        +int id PK
        +int product_id FK
        +string author
        +string publisher
        +int publication_year
        +int pages
        +string isbn
        +string language
    }
    
    class Electronics {
        +int id PK
        +int product_id FK
        +string brand
        +string model
        +string warranty_period
        +text specifications
        +string manufacturer
    }
    
    class Fashion {
        +int id PK
        +int product_id FK
        +string brand
        +string size
        +string color
        +string material
        +string gender
    }
    
    Product <|-- Book : Inheritance
    Product <|-- Electronics : Inheritance
    Product <|-- Fashion : Inheritance
    Product --> Category : Association (1..1)
    Category --> Category : Self-Association (1..*)
```

```mermaid
---
title: Database Schema - Catalog Service (MySQL)
---
erDiagram
    CATEGORY {
        int id PK
        string name
        string description
        string slug
        int parent_id FK
        datetime created_at
        datetime updated_at
    }
    
    PRODUCT {
        int id PK
        string name
        string description
        decimal price
        string sku
        int category_id FK
        string image_url
        boolean is_active
        datetime created_at
        datetime updated_at
    }
    
    BOOK {
        int id PK
        int product_id FK
        string author
        string publisher
        int publication_year
        int pages
        string isbn
        string language
    }
    
    ELECTRONICS {
        int id PK
        int product_id FK
        string brand
        string model
        string warranty_period
        text specifications
        string manufacturer
    }
    
    FASHION {
        int id PK
        int product_id FK
        string brand
        string size
        string color
        string material
        string gender
    }
    
    PRODUCT ||--o{ BOOK : "1:1"
    PRODUCT ||--o{ ELECTRONICS : "1:1"
    PRODUCT ||--o{ FASHION : "1:1"
    PRODUCT }o--|| CATEGORY : "*:1"
    CATEGORY }o--|| CATEGORY : "*:1"