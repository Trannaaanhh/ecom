from django.urls import path
from .views import health, notifications_stub, service_stub

urlpatterns = [
    path('health', health, name='health'),
    path('api/marketing/', service_stub, name='service_stub'),
    path('api/notifications/', notifications_stub, name='notifications_stub'),
]
