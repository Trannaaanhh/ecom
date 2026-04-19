import json
from urllib.error import URLError
from urllib.request import Request, urlopen

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view


PRODUCTS = [
    {"id": 1, "name": "iPhone 15 Pro Max 256GB", "category": "phone", "sold": 1234},
    {"id": 2, "name": "MacBook Air M3 15", "category": "laptop", "sold": 856},
    {"id": 3, "name": "Samsung Galaxy S24 Ultra", "category": "phone", "sold": 2341},
    {"id": 4, "name": "Dell XPS 15", "category": "laptop", "sold": 312},
    {"id": 5, "name": "Ao so mi nam Oxford slim fit", "category": "men-fashion", "sold": 842},
    {"id": 6, "name": "Quan jeans nam co gian basic", "category": "men-fashion", "sold": 615},
    {"id": 7, "name": "Vay nu midi cong so", "category": "women-fashion", "sold": 733},
    {"id": 8, "name": "Tui xach nu da tong hop", "category": "women-fashion", "sold": 521},
    {"id": 9, "name": "Noi chien khong dau 6L", "category": "home", "sold": 1189},
    {"id": 10, "name": "May khoan pin cong nghiep 20V", "category": "industrial", "sold": 304},
]

AI_RERANK_URL = "http://ai-service:8000/api/ai/search/rerank/"


def _post_json(url, payload, timeout=0.15):
    req = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _search_local(query):
    q = str(query or "").strip().lower()
    if not q:
        return sorted(PRODUCTS, key=lambda x: x["sold"], reverse=True)
    return [item for item in PRODUCTS if q in item["name"].lower()]


@api_view(['GET'])
def health(request):
    return JsonResponse({'status': 'ok', 'service': 'search-service'})


@api_view(['GET'])
def service_stub(request):
    return JsonResponse({
        'service': 'search-service',
        'domain': 'search',
        'message': 'Scaffold ready. Implement domain logic in next phase.'
    })


@csrf_exempt
@api_view(['POST'])
def rerank_search(request):
    payload = request.data if hasattr(request, 'data') else {}
    user_id = payload.get("user_id") or "anonymous"
    query = payload.get("query") or ""
    preferred_category = payload.get("preferred_category") or ""
    local_results = _search_local(query)
    result_ids = [item["id"] for item in local_results]

    try:
        ai_result = _post_json(
            AI_RERANK_URL,
            {
                "user_id": user_id,
                "query": query,
                "preferred_category": preferred_category,
                "result_ids": result_ids,
            },
        )
        reranked_ids = ai_result.get("reranked_ids") or []
        id_map = {item["id"]: item for item in local_results}
        reranked = [id_map[item_id] for item_id in reranked_ids if item_id in id_map]
        return JsonResponse({
            "source": "ai-service",
            "items": reranked,
            "model": ai_result.get("model", "search-rerank-v1"),
        })
    except (URLError, TimeoutError, ValueError):
        return JsonResponse({
            "source": "search-fallback",
            "items": sorted(local_results, key=lambda x: x["sold"], reverse=True),
            "model": "popularity-fallback-v1",
        })
