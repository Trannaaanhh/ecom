from django.urls import path
from .views import (
    chat,
    chatbot,
    forecast,
    fraud_score,
    get_recommendations,
    health,
    recommend,
    rerank_search,
    similar_products,
)

urlpatterns = [
    path('health/', health, name='health'),
    path('api/ai/recommendations/<str:user_id>/', get_recommendations, name='recommendations'),
    path('api/ai/recommend/', recommend, name='recommend'),
    path('api/ai/chatbot/', chatbot, name='chatbot'),
    path('api/ai/recommend/similar/', similar_products, name='similar_products'),
    path('api/ai/search/rerank/', rerank_search, name='rerank_search'),
    path('api/ai/fraud/score/', fraud_score, name='fraud_score'),
    path('api/ai/forecast/<str:product_id>/', forecast, name='forecast'),
    path('api/ai/chat/', chat, name='chat'),
]
