```mermaid
---
title: Class Diagram - Search Service
---
classDiagram
    class SearchQuery {
        +int id PK
        +string query_text
        +int user_id FK
        +int results_count
        +datetime created_at
    }
    
    class SearchResult {
        +int id PK
        +int query_id FK
        +int product_id FK
        +float score
        +int rank
    }
    
    class Facet {
        +int id PK
        +string name
        +string value
        +int count
    }
    
    SearchQuery --> SearchResult : Composition (1..*)
    SearchResult --> Product : Association (1..1)
```

```mermaid
---
title: Database Schema - Search Service (PostgreSQL + Elasticsearch)
---
erDiagram
    SEARCH_QUERY {
        int id PK
        string query_text
        int user_id FK
        int results_count
        datetime created_at
    }
    
    SEARCH_RESULT {
        int id PK
        int query_id FK
        int product_id FK
        float score
        int rank
    }
    
    FACET {
        int id PK
        string name
        string value
        int count
    }
    
    SEARCH_QUERY ||--o{ SEARCH_RESULT : "1:*"
    SEARCH_RESULT }o--|| PRODUCT : "*:1"