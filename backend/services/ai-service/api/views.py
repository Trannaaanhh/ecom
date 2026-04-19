import json
import time
from datetime import datetime

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view


# In-memory feature store to simulate Redis keys in local development.
FEATURE_STORE = {}

PRODUCTS = [
    {"id": 1, "name": "iPhone 15 Pro Max 256GB", "category": "phone", "sold": 1234, "price": 28990000},
    {"id": 2, "name": "MacBook Pro M3", "category": "laptop", "sold": 856, "price": 32990000},
    {"id": 3, "name": "Áo Polo cotton", "category": "men-fashion", "sold": 842, "price": 499000},
    {"id": 4, "name": "Váy công sở", "category": "women-fashion", "sold": 733, "price": 559000},
    {"id": 5, "name": "Máy giặt LG Inverter 10kg", "category": "home", "sold": 312, "price": 41990000},
    {"id": 6, "name": "Cà phê hạt Arabica 1kg", "category": "food", "sold": 1189, "price": 189000},
    {"id": 7, "name": "Sách Thiết kế hướng Domain (DDD)", "category": "books", "sold": 521, "price": 249000},
    {"id": 8, "name": "Vitamin C 1000mg hộp 60 viên", "category": "pharma", "sold": 612, "price": 159000},
    {"id": 9, "name": "Sơn nước Dulux 5L", "category": "building-materials", "sold": 421, "price": 1890000},
    {"id": 10, "name": "Máy bơm nước công nghiệp Ebara 5HP", "category": "industrial", "sold": 304, "price": 2490000},
]


def _now_ts():
    return int(time.time())


def _feature_set(key, value, ttl_seconds):
    FEATURE_STORE[key] = {
        "value": value,
        "expires_at": _now_ts() + ttl_seconds,
    }


def _feature_get(key, default=None):
    item = FEATURE_STORE.get(key)
    if not item:
        return default
    if item["expires_at"] <= _now_ts():
        FEATURE_STORE.pop(key, None)
        return default
    return item["value"]


def _norm_text(text):
    return str(text or "").strip().lower()


def _top_products(category=None, limit=4):
    items = PRODUCTS
    if category:
        items = [p for p in PRODUCTS if p["category"] == category]
    ranked = sorted(items, key=lambda x: x["sold"], reverse=True)
    return ranked[:limit]


def _content_based_candidates(viewed_product_ids, category=None, limit=4):
    viewed = set(viewed_product_ids or [])
    base = [p for p in PRODUCTS if p["id"] not in viewed]
    if category:
        same_category = [p for p in base if p["category"] == category]
        if same_category:
            base = same_category
    ranked = sorted(base, key=lambda x: x["sold"], reverse=True)
    return ranked[:limit]


def _build_cold_start_recommendations(user_id, payload):
    session_id = str(payload.get("session_id") or "")
    preferred_category = _norm_text(payload.get("preferred_category")) or None
    viewed_product_ids = payload.get("viewed_product_ids") or []
    events = payload.get("events") or []
    event_count = int(payload.get("event_count") or len(events) or len(viewed_product_ids))
    purchased = bool(payload.get("has_first_purchase"))

    if session_id:
        _feature_set(
            f"features:session:{session_id}",
            {
                "viewed_product_ids": viewed_product_ids,
                "event_count": event_count,
                "updated_at": datetime.utcnow().isoformat() + "Z",
            },
            ttl_seconds=30 * 60,
        )

    _feature_set(
        f"features:user:{user_id}",
        {
            "event_count": event_count,
            "viewed_product_ids": viewed_product_ids,
            "updated_at": datetime.utcnow().isoformat() + "Z",
        },
        ttl_seconds=2 * 60 * 60,
    )

    if purchased:
        stage = "post_first_purchase"
        weight = {"popularity": 0.3, "content": 0.3, "collaborative": 0.4}
        candidates = _content_based_candidates(viewed_product_ids, preferred_category, limit=6)
    elif event_count >= 4:
        stage = "early_profile"
        weight = {"popularity": 0.45, "content": 0.55, "collaborative": 0.0}
        candidates = _content_based_candidates(viewed_product_ids, preferred_category, limit=6)
    elif event_count >= 1:
        stage = "few_events"
        weight = {"popularity": 0.7, "content": 0.3, "collaborative": 0.0}
        candidates = _content_based_candidates(viewed_product_ids, preferred_category, limit=6)
    else:
        stage = "zero_history"
        weight = {"popularity": 1.0, "content": 0.0, "collaborative": 0.0}
        candidates = _top_products(preferred_category, limit=6)

    ranked_ids = [item["id"] for item in candidates]
    return {
        "user_id": user_id,
        "stage": stage,
        "weights": weight,
        "recommended_product_ids": ranked_ids,
    }

@api_view(['GET'])
def health(request):
    return JsonResponse({'status': 'ok', 'service': 'ai-service'})


@api_view(['GET'])
def service_stub(request):
    return JsonResponse({
        'service': 'ai-service',
        'domain': 'ai',
        'message': 'Scaffold ready. Implement domain logic in next phase.'
    })


@csrf_exempt
@api_view(['POST'])
def chat(request):
    payload = request.data if hasattr(request, 'data') else json.loads(request.body.decode('utf-8') or '{}')
    message = (payload.get('message') or '').strip()

    if not message:
        return JsonResponse({'detail': 'message is required'}, status=400)

    return JsonResponse({
        'reply': f"Mình đã nhận: '{message}'. Đây là phản hồi demo từ AI Service.",
        'intent': 'general_support',
    })


@csrf_exempt
@api_view(['POST'])
def recommend(request, user_id):
    payload = request.data if hasattr(request, 'data') else json.loads(request.body.decode('utf-8') or '{}')
    result = _build_cold_start_recommendations(str(user_id), payload)

    return JsonResponse({
        "model": "hybrid-cold-start-v1",
        **result,
    })


@csrf_exempt
@api_view(['POST'])
def recommend_similar(request):
    payload = request.data if hasattr(request, 'data') else json.loads(request.body.decode('utf-8') or '{}')
    product_id = int(payload.get("product_id") or 0)
    limit = int(payload.get("limit") or 4)
    seed = next((p for p in PRODUCTS if p["id"] == product_id), None)

    if not seed:
        return JsonResponse({"detail": "product_id is invalid"}, status=400)

    same_category = [p for p in PRODUCTS if p["category"] == seed["category"] and p["id"] != product_id]
    ranked = sorted(same_category, key=lambda x: x["sold"], reverse=True)

    return JsonResponse({
        "product_id": product_id,
        "similar_product_ids": [item["id"] for item in ranked[:limit]],
        "model": "content-similarity-v1",
    })


@csrf_exempt
@api_view(['POST'])
def search_rerank(request):
    payload = request.data if hasattr(request, 'data') else json.loads(request.body.decode('utf-8') or '{}')
    user_id = str(payload.get("user_id") or "anonymous")
    query = _norm_text(payload.get("query"))
    result_ids = payload.get("result_ids") or []
    preferred_category = _norm_text(payload.get("preferred_category")) or None

    session_feature = _feature_get(f"features:user:{user_id}", {}) or {}
    viewed = set(session_feature.get("viewed_product_ids") or [])

    def _score(item):
        base = item["sold"]
        score = float(base)
        if preferred_category and item["category"] == preferred_category:
            score += 500
        if item["id"] in viewed:
            score += 200
        if query and query in item["name"].lower():
            score += 300
        return score

    pool = [p for p in PRODUCTS if not result_ids or p["id"] in result_ids]
    reranked = sorted(pool, key=_score, reverse=True)
    return JsonResponse({
        "model": "search-rerank-v1",
        "user_id": user_id,
        "query": query,
        "reranked_ids": [item["id"] for item in reranked],
    })


@csrf_exempt
@api_view(['POST'])
def fraud_score(request):
    payload = request.data if hasattr(request, 'data') else json.loads(request.body.decode('utf-8') or '{}')
    amount = float(payload.get("amount") or 0)
    risk_flags = payload.get("risk_flags") or []
    is_high_value = amount >= 20000000
    score = 0.08
    score += 0.35 if is_high_value else 0
    score += min(len(risk_flags) * 0.12, 0.48)
    score = min(score, 0.99)

    label = "high" if score >= 0.7 else "medium" if score >= 0.4 else "low"
    return JsonResponse({
        "model": "fraud-lite-v1",
        "fraud_score": round(score, 4),
        "risk_level": label,
        "requires_manual_review": score >= 0.7,
    })


@api_view(['GET'])
def forecast(request, product_id):
    product = next((p for p in PRODUCTS if p["id"] == product_id), None)
    if not product:
        return JsonResponse({"detail": "Product not found"}, status=404)

    baseline = product["sold"]
    projected_units_next_7_days = int(round((baseline / 30.0) * 7 * 1.08))
    return JsonResponse({
        "product_id": product_id,
        "model": "demand-forecast-v1",
        "projected_units_next_7_days": projected_units_next_7_days,
        "confidence": 0.78,
    })
