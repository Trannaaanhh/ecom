from django.urls import path
from .views import (
    chat,
    forecast,
    fraud_score,
    health,
    recommend,
    recommend_similar,
    search_rerank,
    service_stub,
)

urlpatterns = [
    path('health', health, name='health'),
    path('api/ai/', service_stub, name='service_stub'),
    path('api/ai/chat/', chat, name='chat'),
    path('api/ai/recommend/<str:user_id>/', recommend, name='recommend'),
    path('api/ai/recommend/similar/', recommend_similar, name='recommend_similar'),
    path('api/ai/search/rerank/', search_rerank, name='search_rerank'),
    path('api/ai/fraud/score/', fraud_score, name='fraud_score'),
    path('api/ai/forecast/<int:product_id>/', forecast, name='forecast'),
]
