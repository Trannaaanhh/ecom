import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

try:
    from rest_framework.decorators import api_view
except Exception:  # pragma: no cover - optional dependency
    def api_view(methods):
        def decorator(view_func):
            return view_func

        return decorator

from .ai_engine import engine


def _get_payload(request):
    if hasattr(request, 'data'):
        payload = request.data
        if isinstance(payload, dict):
            return payload
        return {}

    try:
        return json.loads(request.body.decode('utf-8') or '{}')
    except Exception:
        return {}


@api_view(['GET'])
def health(request):
    return JsonResponse({'status': 'ok', 'service': 'ai-service'})


@api_view(['GET'])
def get_recommendations(request, user_id):
    payload = _get_payload(request)
    result = engine.recommend(
        user_id=user_id,
        query=payload.get('query', ''),
        behavior=payload.get('behavior'),
        limit=int(payload.get('limit') or 10),
        preferred_category=payload.get('preferred_category', ''),
    )
    return JsonResponse({
        'user_id': result['user_id'],
        'query': result['query'],
        'model': result['model'],
        'recommendations': result['recommendations'],
        'items': result['items'],
    })


@csrf_exempt
@api_view(['GET', 'POST'])
def recommend(request):
    payload = _get_payload(request)
    result = engine.recommend(
        user_id=payload.get('user_id') or request.query_params.get('user_id'),
        query=payload.get('query', '') or request.query_params.get('query', ''),
        behavior=payload.get('behavior'),
        limit=int(payload.get('limit') or request.query_params.get('limit') or 10),
        preferred_category=payload.get('preferred_category', '') or request.query_params.get('preferred_category', ''),
    )
    return JsonResponse(result)


@csrf_exempt
@api_view(['POST'])
def similar_products(request):
    payload = _get_payload(request)
    product_id = str(payload.get('product_id') or '').strip()
    if not product_id:
        return JsonResponse({'error': 'product_id is required'}, status=400)

    limit = int(payload.get('limit') or 6)
    items = engine.get_similar_products(product_id=product_id, limit=limit)
    return JsonResponse({
        'product_id': product_id,
        'model': 'graph-similarity-v1',
        'items': [
            {
                'product_id': item.product_id,
                'name': item.name,
                'price': item.price,
                'category_id': item.category_id,
                'category_name': item.category_name,
            }
            for item in items
        ],
    })


@csrf_exempt
@api_view(['POST'])
def rerank_search(request):
    payload = _get_payload(request)
    result = engine.rerank_search(
        result_ids=payload.get('result_ids') or [],
        query=payload.get('query', ''),
        user_id=payload.get('user_id'),
        preferred_category=payload.get('preferred_category', ''),
        limit=int(payload.get('limit') or 20),
    )
    return JsonResponse(result)


@csrf_exempt
@api_view(['POST'])
def fraud_score(request):
    payload = _get_payload(request)
    amount = payload.get('amount')
    if amount is None:
        return JsonResponse({'error': 'amount is required'}, status=400)

    result = engine.fraud_score(
        amount=amount,
        user_id=payload.get('user_id'),
        risk_flags=payload.get('risk_flags') or [],
    )
    return JsonResponse(result)


@api_view(['GET'])
def forecast(request, product_id):
    horizon = request.GET.get('horizon', 7)
    result = engine.forecast(product_id=product_id, horizon=int(horizon or 7))
    return JsonResponse(result)


@csrf_exempt
@api_view(['POST'])
def chat(request):
    payload = _get_payload(request)
    message = str(payload.get('message', '')).strip()
    if not message:
        return JsonResponse({'error': 'message is required'}, status=400)

    result = engine.chat(
        user_id=payload.get('user_id'),
        message=message,
        behavior=payload.get('behavior'),
    )
    return JsonResponse(result)


@csrf_exempt
@api_view(['POST'])
def chatbot(request):
    return chat(request)
