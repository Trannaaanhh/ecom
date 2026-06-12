from django.urls import path
from .views import admin_summary, health, order_create, order_detail, order_list

urlpatterns = [
    path('health', health, name='health'),
    path('api/orders/', order_list, name='order_list'),
    path('api/orders/create/', order_create, name='order_create'),
    path('api/orders/<uuid:pk>/', order_detail, name='order_detail'),
    path('api/orders/admin-summary/', admin_summary, name='admin_summary'),
]
