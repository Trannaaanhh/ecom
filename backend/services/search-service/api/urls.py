from django.urls import path
from .views import health, rerank_search, service_stub

urlpatterns = [
    path('health', health, name='health'),
    path('api/search/', service_stub, name='service_stub'),
    path('api/search/rerank/', rerank_search, name='rerank_search'),
]
