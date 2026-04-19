from django.http import JsonResponse
from rest_framework.decorators import api_view


RECENT_ORDERS = [
    {"id": "OD-1001", "customer": "Nguyen Van A", "amount": 12650000, "status": "CONFIRMED"},
    {"id": "OD-1002", "customer": "Tran Thi B", "amount": 4750000, "status": "SHIPPED"},
    {"id": "OD-1003", "customer": "Cong ty ABC", "amount": 86200000, "status": "PENDING"},
    {"id": "OD-1004", "customer": "Le Minh C", "amount": 2190000, "status": "DELIVERED"},
]


@api_view(['GET'])
def health(request):
    return JsonResponse({'status': 'ok', 'service': 'order-service'})


@api_view(['GET'])
def service_stub(request):
    return JsonResponse({
        'service': 'order-service',
        'domain': 'orders',
        'items': RECENT_ORDERS,
    })


@api_view(['GET'])
def admin_summary(request):
    return JsonResponse({
        'kpis': {
            'today_revenue': 248900000,
            'new_orders': 128,
            'conversion_rate': 3.6,
            'low_stock_count': 17,
        },
        'recent_orders': RECENT_ORDERS,
    })
