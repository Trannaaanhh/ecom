from django.urls import path
from .views import health, service_stub

urlpatterns = [
    path('health', health, name='health'),
    path('api/shipping/', service_stub, name='service_stub'),
]
