from django.urls import path
from .views import health, reviews_stub, service_stub

urlpatterns = [
    path('health', health, name='health'),
    path('api/returns/', service_stub, name='service_stub'),
    path('api/reviews/', reviews_stub, name='reviews_stub'),
]
