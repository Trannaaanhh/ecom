from django.http import JsonResponse
from rest_framework.decorators import api_view


@api_view(['GET'])
def health(request):
    return JsonResponse({'status': 'ok', 'service': 'shipping-service'})


@api_view(['GET'])
def service_stub(request):
    return JsonResponse({
        'service': 'shipping-service',
        'domain': 'shipping',
        'message': 'Scaffold ready. Implement domain logic in next phase.'
    })
