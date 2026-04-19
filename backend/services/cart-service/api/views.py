from django.http import JsonResponse
from rest_framework.decorators import api_view


CART_ITEMS = [
    {
        "id": 101,
        "product_id": 1,
        "name": "iPhone 15 Pro Max 256GB",
        "price": 28990000,
        "qty": 1,
        "image": "https://images.unsplash.com/photo-1697636979316-cc18d4369e66?w=300",
    },
    {
        "id": 102,
        "product_id": 2,
        "name": "MacBook Air M3 15",
        "price": 32990000,
        "qty": 1,
        "image": "https://images.unsplash.com/photo-1639978374228-aaf3c15a4347?w=300",
    },
]


@api_view(['GET'])
def health(request):
    return JsonResponse({'status': 'ok', 'service': 'cart-service'})


@api_view(['GET'])
def service_stub(request):
    subtotal = sum(item['price'] * item['qty'] for item in CART_ITEMS)
    discount = 1500000
    shipping = 50000
    total = subtotal - discount + shipping

    return JsonResponse({
        'service': 'cart-service',
        'domain': 'cart',
        'warning': 'Giá đã được đồng bộ lại từ Product Service lúc 14:35.',
        'items': CART_ITEMS,
        'summary': {
            'subtotal': subtotal,
            'discount': discount,
            'shipping': shipping,
            'total': total,
        },
    })
