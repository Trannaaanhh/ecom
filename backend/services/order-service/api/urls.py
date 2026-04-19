from django.urls import path
from .views import admin_summary, health, service_stub

urlpatterns = [
    path('health', health, name='health'),
    path('api/orders/', service_stub, name='service_stub'),
    path('api/orders/admin-summary/', admin_summary, name='admin_summary'),
]
