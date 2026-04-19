import json
from urllib.error import URLError
from urllib.request import Request, urlopen

from django.http import JsonResponse
from rest_framework.decorators import api_view


AI_FRAUD_URL = "http://ai-service:8000/api/ai/fraud/score/"


def _post_json(url, payload, timeout=0.08):
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
    return JsonResponse({'status': 'ok', 'service': 'payment-service'})


@api_view(['GET'])
def service_stub(request):
    return JsonResponse({
        'service': 'payment-service',
        'domain': 'payments',
        'message': 'Scaffold ready. Implement domain logic in next phase.'
    })


@api_view(['POST'])
def checkout(request):
    customer = request.data.get('customer', {})
    amount = request.data.get('amount')

    required_fields = ['name', 'phone', 'address']
    missing = [field for field in required_fields if not str(customer.get(field, '')).strip()]
    if missing:
        return JsonResponse({'detail': f"Thiếu thông tin customer: {', '.join(missing)}"}, status=400)

    if amount is None:
        return JsonResponse({'detail': 'Thiếu số tiền thanh toán.'}, status=400)

    fraud_result = {
        "model": "fraud-fallback-v1",
        "fraud_score": 0.1,
        "risk_level": "low",
        "requires_manual_review": False,
    }
    try:
        fraud_result = _post_json(
            AI_FRAUD_URL,
            {
                "amount": amount,
                "user_id": request.data.get("user_id"),
                "risk_flags": request.data.get("risk_flags") or [],
            },
        )
    except (URLError, TimeoutError, ValueError):
        pass

    if fraud_result.get("requires_manual_review"):
        return JsonResponse({
            'service': 'payment-service',
            'status': 'pending_review',
            'message': 'Giao dịch cần kiểm tra thủ công do điểm rủi ro cao.',
            'fraud': fraud_result,
        }, status=202)

    return JsonResponse({
        'service': 'payment-service',
        'status': 'success',
        'payment_id': 'PAY-DEMO-2026-001',
        'customer': {
            'name': customer.get('name'),
            'phone': customer.get('phone'),
            'email': customer.get('email', ''),
            'address': customer.get('address'),
            'note': customer.get('note', ''),
        },
        'amount': amount,
        'fraud': fraud_result,
        'message': 'Tạo thanh toán thành công (demo).',
    })
