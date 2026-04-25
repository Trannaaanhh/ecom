from django.urls import path
from .views import get_recommendations, chat

urlpatterns = [
    path('api/ai/recommendations/<str:user_id>/', get_recommendations, name='recommendations'),
    path('api/ai/chat/', chat, name='chat'),
]
