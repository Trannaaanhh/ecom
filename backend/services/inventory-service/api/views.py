from django.http import JsonResponse
from rest_framework.decorators import api_view


@api_view(['GET'])
def health(request):
    return JsonResponse({'status': 'ok', 'service': 'inventory-service'})


@api_view(['GET'])
def service_stub(request):
    return JsonResponse({
        'service': 'inventory-service',
        'domain': 'inventory',
        'message': 'Scaffold ready. Implement domain logic in next phase.'
    })
