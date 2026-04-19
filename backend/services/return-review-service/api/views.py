from django.http import JsonResponse
from rest_framework.decorators import api_view


@api_view(['GET'])
def health(request):
    return JsonResponse({'status': 'ok', 'service': 'return-review-service'})


@api_view(['GET'])
def service_stub(request):
    return JsonResponse({
        'service': 'return-review-service',
        'domain': 'returns',
        'message': 'Scaffold ready. Implement domain logic in next phase.'
    })


@api_view(['GET'])
def reviews_stub(request):
    return JsonResponse({
        'service': 'return-review-service',
        'domain': 'reviews',
        'message': 'Review endpoint stub is ready.'
    })
