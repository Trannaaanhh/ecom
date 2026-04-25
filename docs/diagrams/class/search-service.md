```mermaid
---
title: Class Diagram - Search Service
---
classDiagram
    class SearchQuery {
        +int id PK
        +int user_id FK
        +string query_text
        +string search_type
        +int results_count
        +int filters_applied
        +string sort_by
        +string page
        +string sort_order
        +datetime created_at
    }
    
    class SearchResult {
        +int id PK
        +int query_id FK
        +int product_id FK
        +decimal score
        +int rank
        +string highlight
    }
    
    class SearchFilter {
        +int id PK
        +int query_id FK
        +string filter_type
        +string filter_name
        +string filter_value
        +string filter_value_to
        +int min_value
        +int max_value
    }
    
    class Synonym {
        +int id PK
        +string term
        +string synonyms
        +boolean is_active
        +datetime created_at
    }
    
    SearchQuery --> SearchResult : Composition (1..*)
    SearchQuery --> SearchFilter : Composition (0..*)
```

### Database Mapping (PostgreSQL + Elasticsearch)

**Table: search_queries**
- `id` (PK), `user_id` (FK) - Query identification
- `query_text` - Search text
- `search_type` - product, category, all
- `results_count` - Number of results
- `filters_applied` - Number of filters
- `sort_by` - relevance, price, new
- `page`, `sort_order` - Pagination
- `created_at`

**Table: search_results**
- `id` (PK), `query_id` (FK), `product_id` (FK)
- `score` - Elasticsearch score
- `rank` - Display rank
- `highlight` - Highlighted text

**Table: search_filters**
- `id` (PK), `query_id` (FK)
- `filter_type` - price, category, brand
- `filter_name`, `filter_value`, `filter_value_to`
- `min_value`, `max_value` - Range filters

**Table: synonyms**
- `id` (PK)
- `term` - Original term
- `synonyms` - Comma-separated synonyms
- `is_active`, `created_at`

**Note:** Facet data is stored in Elasticsearch, not PostgreSQL.

**Relationships:**
- SearchQuery → SearchResult: One-to-Many (1:*)
- SearchQuery → SearchFilter: One-to-Many (0:*)