from django.http import JsonResponse
from rest_framework.decorators import api_view


@api_view(['GET'])
def health(request):
    return JsonResponse({'status': 'ok', 'service': 'user-service'})


@api_view(['GET'])
def service_stub(request):
    return JsonResponse({
        'service': 'user-service',
        'domain': 'users',
        'message': 'Scaffold ready. Implement domain logic in next phase.'
    })


@api_view(['POST'])
def customer_login(request):
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '').strip()

    if not email or not password:
        return JsonResponse({'detail': 'Email và mật khẩu là bắt buộc.'}, status=400)

    return JsonResponse({
        'service': 'user-service',
        'role': 'customer',
        'token': 'customer-demo-token',
        'user': {
            'id': 101,
            'name': 'Customer Demo',
            'email': email,
        },
    })


@api_view(['POST'])
def staff_login(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()

    if not username or not password:
        return JsonResponse({'detail': 'Username và mật khẩu là bắt buộc.'}, status=400)

    return JsonResponse({
        'service': 'user-service',
        'role': 'staff',
        'token': 'staff-demo-token',
        'user': {
            'id': 1,
            'name': 'Staff Admin',
            'username': username,
        },
    })
