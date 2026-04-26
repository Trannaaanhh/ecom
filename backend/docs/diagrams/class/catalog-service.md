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
        +string icon
        +int parent_id FK
        +int display_order
        +boolean is_featured
        +datetime created_at
        +datetime updated_at
    }
    
    class Product {
        +int id PK
        +string name
        +string description
        +decimal price
        +decimal discounted_price
        +string sku
        +int category_id FK
        +string image_url
        +text images
        +text short_description
        +decimal weight
        +text dimensions
        +boolean is_active
        +boolean is_featured
        +int stock_quantity
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
        +string format
        +string genre
        +decimal weight
    }
    
    class Electronics {
        +int id PK
        +int product_id FK
        +string brand
        +string model
        +string warranty_period
        +text specifications
        +string manufacturer
        +string power_consumption
        +string voltage
    }
    
    class Fashion {
        +int id PK
        +int product_id FK
        +string brand
        +string size
        +string color
        +string material
        +string gender
        +string style
        +text care_instructions
    }
    
    Product <|-- Book : Inheritance
    Product <|-- Electronics : Inheritance
    Product <|-- Fashion : Inheritance
    Product --> Category : Association (1..1)
    Category --> Category : Self-Association (1..*)
```

### Database Mapping (MySQL)

**Table: categories**
- `id` (PK) - Auto increment
- `name` - Category name
- `description` - Category description
- `slug` - URL-friendly slug
- `icon` - Category icon
- `parent_id` (FK) - Self-reference to parent category
- `display_order` - Sort order
- `is_featured` - Featured flag
- `created_at`, `updated_at` - Timestamps

**Table: products**
- `id` (PK) - Auto increment
- `name`, `description` - Product info
- `price`, `discounted_price` - Pricing
- `sku` - Stock keeping unit
- `category_id` (FK) - Reference to categories
- `image_url`, `images` - Images (JSON array)
- `short_description`, `weight`, `dimensions` - Product details
- `is_active`, `is_featured` - Status flags
- `stock_quantity` - Initial stock
- Timestamps

**Table: books** (1:1 with products)
- `id` (PK), `product_id` (FK)
- Author, publisher, publication_year, pages, isbn, language, format, genre, weight

**Table: electronics** (1:1 with products)
- `id` (PK), `product_id` (FK)
- Brand, model, warranty_period, specifications, manufacturer, power_consumption, voltage

**Table: fashion** (1:1 with products)
- `id` (PK), `product_id` (FK)
- Brand, size, color, material, gender, style, care_instructions

**Relationships:**
- Product → Category: Many-to-One (*:1)
- Category → Category: Self-association (*:1)
- Product → Book/Electronics/Fashion: One-to-One (1:1)