from django.urls import path
from .views import checkout, health, service_stub

urlpatterns = [
    path('health', health, name='health'),
    path('api/payments/', service_stub, name='service_stub'),
    path('api/payments/checkout/', checkout, name='checkout'),
]
