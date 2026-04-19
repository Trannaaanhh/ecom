import json
from urllib.error import URLError
from urllib.request import Request, urlopen

from django.http import JsonResponse
from rest_framework.decorators import api_view


PRODUCTS = [
    {
        "id": 1,
        "name": "iPhone 15 Pro Max 256GB",
        "price": 28990000,
        "old_price": 32990000,
        "rating": 4.8,
        "sold": 1234,
        "badge": "HOT",
        "category": "phone",
        "image": "https://images.unsplash.com/photo-1697636979316-cc18d4369e66?w=500",
    },
    {
        "id": 2,
        "name": "MacBook Pro M3",
        "price": 32990000,
        "old_price": 36990000,
        "rating": 4.9,
        "sold": 856,
        "badge": "NEW",
        "category": "laptop",
        "image": "https://images.unsplash.com/photo-1639978374228-aaf3c15a4347?w=500",
    },
    {
        "id": 3,
        "name": "Áo Polo cotton",
        "price": 499000,
        "old_price": 599000,
        "rating": 4.6,
        "sold": 842,
        "badge": "FASHION",
        "category": "men-fashion",
        "image": "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=500",
    },
    {
        "id": 4,
        "name": "Váy công sở",
        "price": 559000,
        "old_price": 759000,
        "rating": 4.7,
        "sold": 733,
        "badge": "TREND",
        "category": "women-fashion",
        "image": "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500",
    },
    {
        "id": 5,
        "name": "Máy giặt LG Inverter 10kg",
        "price": 41990000,
        "old_price": 44990000,
        "rating": 4.6,
        "sold": 312,
        "badge": "B2B",
        "category": "home",
        "image": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=500",
    },
    {
        "id": 6,
        "name": "Cà phê hạt Arabica 1kg",
        "price": 189000,
        "old_price": 229000,
        "rating": 4.8,
        "sold": 1189,
        "badge": "FOOD",
        "category": "food",
        "image": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500",
    },
    {
        "id": 7,
        "name": "Sách Thiết kế hướng Domain (DDD)",
        "price": 249000,
        "old_price": 299000,
        "rating": 4.9,
        "sold": 521,
        "badge": "BOOKS",
        "category": "books",
        "image": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500",
    },
    {
        "id": 8,
        "name": "Vitamin C 1000mg hộp 60 viên",
        "price": 159000,
        "old_price": 199000,
        "rating": 4.8,
        "sold": 612,
        "badge": "HEALTH",
        "category": "pharma",
        "image": "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=500",
    },
    {
        "id": 9,
        "name": "Sơn nước Dulux 5L",
        "price": 1890000,
        "old_price": 2590000,
        "rating": 4.8,
        "sold": 421,
        "badge": "BUILD",
        "category": "building-materials",
        "image": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500",
    },
    {
        "id": 10,
        "name": "Máy bơm nước công nghiệp Ebara 5HP",
        "price": 2490000,
        "old_price": 2990000,
        "rating": 4.7,
        "sold": 304,
        "badge": "B2B",
        "category": "industrial",
        "image": "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500",
    },
]

CATEGORIES = [
    {"id": 1, "name": "Điện thoại & Phụ kiện", "icon": "📱", "count": 1234, "slug": "phone"},
    {"id": 2, "name": "Laptop & Máy tính", "icon": "💻", "count": 856, "slug": "laptop"},
    {"id": 3, "name": "Thời trang Nam", "icon": "👔", "count": 842, "slug": "men-fashion"},
    {"id": 4, "name": "Thời trang Nữ", "icon": "👗", "count": 733, "slug": "women-fashion"},
    {"id": 5, "name": "Thiết bị gia dụng", "icon": "🏠", "count": 421, "slug": "home"},
    {"id": 6, "name": "Thực phẩm & Đồ uống", "icon": "☕", "count": 1189, "slug": "food"},
    {"id": 7, "name": "Sách & Văn phòng phẩm", "icon": "📚", "count": 521, "slug": "books"},
    {"id": 8, "name": "Dược phẩm & Sức khỏe", "icon": "💊", "count": 612, "slug": "pharma"},
    {"id": 9, "name": "Vật liệu xây dựng", "icon": "🧱", "count": 421, "slug": "building-materials"},
    {"id": 10, "name": "Thiết bị công nghiệp", "icon": "🏭", "count": 304, "slug": "industrial"},
]

AI_BASE_URL = "http://ai-service:8000/api/ai"


def _format_product(product):
    return {
        **product,
        "price_text": f"{product['price']:,}đ",
        "old_price_text": f"{product['old_price']:,}đ",
    }


def _post_json(url, payload, timeout=0.2):
    req = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


@api_view(['GET'])
def health(request):
    return JsonResponse({'status': 'ok', 'service': 'catalog-service'})


@api_view(['GET'])
def service_stub(request):
    category = request.GET.get('category')
    q = request.GET.get('q', '').lower().strip()

    items = PRODUCTS
    if category:
        items = [item for item in items if item['category'] == category]
    if q:
        items = [item for item in items if q in item['name'].lower()]

    return JsonResponse({
        'service': 'catalog-service',
        'domain': 'products',
        'total': len(items),
        'items': [_format_product(item) for item in items],
    })


@api_view(['GET'])
def product_featured(request):
    featured = PRODUCTS[:4]
    return JsonResponse({'items': [_format_product(item) for item in featured]})


@api_view(['GET'])
def product_trending(request):
    trending = sorted(PRODUCTS, key=lambda item: item['sold'], reverse=True)[:3]
    return JsonResponse({'items': [_format_product(item) for item in trending]})


@api_view(['POST'])
def product_home_recommend(request, user_id):
    payload = request.data if hasattr(request, 'data') else {}
    preferred_category = (payload.get("preferred_category") or "").strip()
    fallback = _top_products_local(preferred_category, limit=4)

    try:
        ai_result = _post_json(
            f"{AI_BASE_URL}/recommend/{user_id}/",
            {
                "session_id": payload.get("session_id"),
                "preferred_category": preferred_category,
                "viewed_product_ids": payload.get("viewed_product_ids") or [],
                "events": payload.get("events") or [],
                "event_count": payload.get("event_count"),
                "has_first_purchase": payload.get("has_first_purchase", False),
            },
        )
        ordered_ids = ai_result.get("recommended_product_ids") or []
        id_map = {item["id"]: item for item in PRODUCTS}
        items = [id_map[item_id] for item_id in ordered_ids if item_id in id_map]
        if not items:
            items = fallback
        return JsonResponse({
            "source": "ai-service",
            "stage": ai_result.get("stage", "unknown"),
            "items": [_format_product(item) for item in items[:4]],
        })
    except (URLError, TimeoutError, ValueError):
        return JsonResponse({
            "source": "catalog-fallback",
            "stage": "fallback_popularity",
            "items": [_format_product(item) for item in fallback],
        })


@api_view(['POST'])
def product_similar(request, product_id):
    payload = request.data if hasattr(request, 'data') else {}
    limit = int(payload.get("limit") or 4)

    try:
        ai_result = _post_json(
            f"{AI_BASE_URL}/recommend/similar/",
            {"product_id": product_id, "limit": limit},
        )
        similar_ids = ai_result.get("similar_product_ids") or []
        id_map = {item["id"]: item for item in PRODUCTS}
        items = [id_map[item_id] for item_id in similar_ids if item_id in id_map]
        if items:
            return JsonResponse({"source": "ai-service", "items": [_format_product(item) for item in items]})
    except (URLError, TimeoutError, ValueError):
        pass

    seed = next((item for item in PRODUCTS if item["id"] == product_id), None)
    if not seed:
        return JsonResponse({"detail": "Product not found"}, status=404)

    same_category = [item for item in PRODUCTS if item["category"] == seed["category"] and item["id"] != product_id]
    fallback = sorted(same_category, key=lambda item: item["sold"], reverse=True)[:limit]
    return JsonResponse({"source": "catalog-fallback", "items": [_format_product(item) for item in fallback]})


def _top_products_local(category=None, limit=4):
    items = PRODUCTS
    if category:
        items = [item for item in PRODUCTS if item["category"] == category]
    return sorted(items, key=lambda item: item["sold"], reverse=True)[:limit]


@api_view(['GET'])
def product_detail(request, product_id):
    product = next((item for item in PRODUCTS if item['id'] == product_id), None)
    if not product:
        return JsonResponse({'detail': 'Product not found'}, status=404)

    response = _format_product(product)
    response['description'] = 'Sản phẩm demo phục vụ kết nối frontend-backend phase 1.'
    response['specs'] = {
        'brand': 'Ecomerge Demo',
        'warranty': '12 tháng',
        'origin': 'VN/Global',
    }
    return JsonResponse(response)


@api_view(['GET'])
def categories_stub(request):
    return JsonResponse({
        'service': 'catalog-service',
        'domain': 'categories',
        'items': CATEGORIES,
    })
