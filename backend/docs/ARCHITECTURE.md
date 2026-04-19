# Architecture Notes

This document captures the phase-2 architecture quality criteria used to evaluate four key areas:

- Deep Learning (2.0 points)
- Knowledge Base Graph (2.0 points)
- RAG (2.0 points)
- Ecommerce Integration (1.0 point)

The target quality gate is at least 6.5/7.0.

## 1) Deep Learning (Target >= 1.8/2.0)

### 1.1 Model Stack
- Recommendation:
	- Neural CF (GMF + MLP) for collaborative signals.
	- Content encoder for product semantics.
	- Hybrid score: `score = alpha*cf + beta*cb + gamma*popularity`.
- Forecasting:
	- Time-series forecasting API with confidence output.
- Fraud:
	- Real-time risk scoring endpoint with low-latency target.

### 1.2 Data and Split Policy
- Temporal split is mandatory to avoid leakage:
	- Train: historical window T0..Tn-2
	- Validation: Tn-1
	- Test: Tn
- Implicit feedback weights:
	- view=0.1, add_to_cart=0.5, purchase=1.0, negative skip=-0.1

### 1.3 Offline Metrics and Thresholds
- Recommendation:
	- NDCG@10 >= 0.34
	- Recall@20 >= 0.42
	- MAP@10 >= 0.22
- Fraud:
	- AUC >= 0.93
	- Recall@FPR<=2% >= 0.78
- Forecast:
	- WAPE <= 18%
	- P50 pinball loss <= baseline by 10%

### 1.4 Online Metrics and Serving Gates
- p95 latency:
	- recommend <= 100ms
	- rerank <= 80ms
	- fraud <= 50ms
	- forecast <= 500ms
- Error rate < 1% over 5-minute windows.

### 1.5 Fallback Strategy
- If recommendation model fails: return popularity by category.
- If fraud model fails: assign medium risk and require step-up verification.
- If forecast model fails: use seasonal naive baseline.

## 2) Knowledge Base Graph (Target >= 1.7/2.0)

### 2.1 Graph Schema
- Nodes:
	- Product, Category, Brand, Attribute, AttributeValue
- Edges:
	- `Product -> belongs_to -> Category`
	- `Product -> compatible_with -> Product`
	- `Product -> frequently_bought_with -> Product`
	- `Brand -> manufactures -> Product`
	- `Product -> has_attribute -> AttributeValue`

### 2.2 Source of Truth and Sync
- Source of truth:
	- Catalog DB for product/category/attribute data.
	- Order events for co-purchase relationships.
- Sync modes:
	- Nightly full rebuild.
	- Incremental updates from product/order Kafka events.

### 2.3 Governance and Versioning
- Graph version tag: `graph_version=YYYYMMDD.N`.
- Every node/edge keeps `source`, `updated_at`, `confidence` metadata.
- Low-confidence edges (`confidence < 0.6`) are excluded from serving.

### 2.4 Quality Checks
- Broken edge ratio < 0.5%.
- Orphan product ratio < 0.2%.
- Sync lag (event -> graph visible) p95 < 5 minutes.

## 3) RAG (Target >= 1.8/2.0)

### 3.1 Pipeline
- Query understanding:
	- intent classification + entity extraction.
- Query expansion:
	- generate 3 semantically equivalent variants.
- Hybrid retrieval:
	- dense retrieval + BM25 sparse retrieval.
- Re-rank:
	- cross-encoder top-k rerank.
- Generation:
	- LLM with context block and citation constraints.
- Post-processing:
	- PII redaction + policy filters + response formatting.

### 3.2 Retrieval and Answer Policies
- Retrieve top-20 candidates, rerank to top-5 context chunks.
- Each chunk includes:
	- `source_id`, `doc_type`, `updated_at`, `trust_level`.
- Mandatory citation requirement:
	- at least 1 cited source for policy/product answers.

### 3.3 Guardrails
- Role-based data exposure:
	- public users cannot receive internal pricing or sensitive order internals.
- Policy deny-list:
	- no raw credentials, tokens, private addresses, internal fraud rules.

### 3.4 Evaluation Set and Targets
- Evaluate by intent buckets:
	- product_inquiry, policy_question, order_status, complaint, general_chat.
- Targets:
	- groundedness >= 0.85
	- faithfulness >= 0.88
	- answer_relevancy >= 0.82
	- hallucination rate <= 3%

### 3.5 Empty Retrieval Fallback
- If no relevant chunk above threshold:
	- return safe answer template with escalation path.

## 4) Ecommerce Integration (Target >= 0.9/1.0)

### 4.1 Integration Matrix
- Homepage -> `POST /api/products/recommend/{user_id}`
- Product detail -> `POST /api/ai/recommend/similar/`
- Search -> `POST /api/ai/search/rerank/`
- Checkout -> `POST /api/ai/fraud/score/`
- Admin/Staff -> `GET /api/ai/forecast/{product_id}/`
- Chat widget -> `POST /api/ai/chat/`

### 4.2 API Contract Versioning
- Internal AI endpoints support version header:
	- `X-Model-Version`, `X-Feature-Version`
- Breaking changes require new path or explicit version bump.

### 4.3 SLO and Alerting
- SLO:
	- Availability >= 99.9%
	- p99 latency <= 200ms for online scoring endpoints
	- error rate <= 1%
- Alert triggers:
	- p99 latency > 200ms for 10 min
	- error rate > 1% for 5 min
	- data drift score > threshold

### 4.4 Rollback Runbook
- Champion/challenger release policy:
	- 90% champion / 10% challenger
- Auto-rollback conditions:
	- conversion drop > 3% relative
	- CTR drop > 5% relative
	- error spike above SLO
- Rollback action:
	- route 100% traffic to champion.

## 5) Acceptance Checklist (6.5+ Gate)

Project is considered >= 6.5/7 when all conditions below are true:

- DL: temporal split + offline thresholds + fallback are documented and used.
- KB Graph: schema + sync + governance + quality checks are documented.
- RAG: hybrid retrieval + rerank + guardrails + eval targets are documented.
- Ecom integration: endpoint map + SLO + rollback runbook are documented.

Current status in this repository:

- Endpoint integration exists for recommend/similar/rerank/fraud/forecast/chat.
- Frontend uses recommendation and staff AI control panel.
- AI architecture quality criteria and runbook are now documented in this file.
