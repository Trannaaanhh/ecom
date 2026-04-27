# Environment Guide

This document describes ports, profiles, environment variables, and infrastructure assumptions for local development.

## 1. Compose profiles

### Default

Starts:

- gateway
- postgres
- mysql
- redis
- neo4j
- all backend services

### `full`

Adds:

- zookeeper
- kafka
- elasticsearch

### `ui`

Adds:

- frontend container

## 2. Port map

- `8080`: gateway
- `5432`: PostgreSQL
- `3306`: MySQL
- `6379`: Redis
- `7474`: Neo4j browser
- `7687`: Neo4j Bolt
- `8001`: user-service
- `8002`: catalog-service
- `8003`: inventory-service
- `8004`: search-service
- `8005`: cart-service
- `8006`: order-service
- `8007`: payment-service
- `8008`: shipping-service
- `8009`: return-review-service
- `8010`: marketing-notification-service
- `8011`: ai-service
- `2181`: Zookeeper, `full` profile only
- `9092`: Kafka, `full` profile only
- `9200`: Elasticsearch, `full` profile only
- `5173`: frontend in Docker or customer/portal Vite mode
- `5174`: staff Vite mode

## 3. Required backend environment variables

Compose expects a backend `.env` file for at least:

```env
POSTGRES_DB=ecommerge
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

MYSQL_DATABASE=catalog
MYSQL_USER=mysqluser
MYSQL_PASSWORD=mysqlpass
MYSQL_ROOT_PASSWORD=rootpass
```

Recommended shared Django settings:

```env
SECRET_KEY=change-me
DEBUG=1
ALLOWED_HOSTS=*
```

## 4. Service database variables

Most Django services read:

- `DB_ENGINE`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

Compose injects these per service. Outside Compose, each service can also run with local defaults from its `settings.py`, but those defaults are only suitable for development.

## 5. AI-specific variables

`ai-service` supports additional configuration:

```env
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=testpassword
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
GEMINI_API_KEY=
LSTM_MODEL_PATH=/app/training-data/lstm_ecom_trained_full.pth
```

Notes:

- `GEMINI_API_KEY` is optional. Without it, AI chat uses fallback logic.
- `LSTM_MODEL_PATH` points to the mounted model artifact from `../training-data`.
- Kafka only exists when `--profile full` is enabled.

## 6. Frontend environment variables

Frontend uses:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Behavior by runtime:

- local Vite dev defaults to `http://localhost:8080`
- frontend Docker container in backend Compose uses `http://gateway:8080`
- standalone frontend Docker Compose defaults to `http://host.docker.internal:8080`

## 7. External dependencies and fallbacks

### Neo4j

AI works without a populated graph, but recommendation quality falls back to local/demo catalog logic.

### Kafka

AI consumer startup is tolerant of missing Kafka dependencies. It simply skips background consumer startup when Kafka libraries or graph dependencies are unavailable.

### Gemini

Chat does not hard-fail if Gemini is missing. It falls back to deterministic response generation.

### Torch/LSTM artifact

If PyTorch or the artifact is missing, AI recommendation still runs using graph, popularity, and behavior fallback scoring.

## 8. Security note for local environments

Current defaults are development-grade:

- permissive `ALLOWED_HOSTS`
- default `SECRET_KEY` fallback
- demo credentials/tokens in user flows
- hardcoded Neo4j credentials in Compose

Do not reuse these settings for staging or production.
