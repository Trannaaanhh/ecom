from django.http import JsonResponse
from rest_framework.decorators import api_view


@api_view(['GET'])
def health(request):
    return JsonResponse({'status': 'ok', 'service': 'marketing-notification-service'})


@api_view(['GET'])
def service_stub(request):
    return JsonResponse({
        'service': 'marketing-notification-service',
        'domain': 'marketing',
        'message': 'Scaffold ready. Implement domain logic in next phase.'
    })


@api_view(['GET'])
def notifications_stub(request):
    return JsonResponse({
        'service': 'marketing-notification-service',
        'domain': 'notifications',
        'message': 'Notification endpoint stub is ready.'
    })
