from django.urls import path
from .views import (
    categories_stub,
    health,
    product_detail,
    product_featured,
    product_home_recommend,
    product_similar,
    product_trending,
    service_stub,
)

urlpatterns = [
    path('health', health, name='health'),
    path('api/products/', service_stub, name='service_stub'),
    path('api/products/featured/', product_featured, name='product_featured'),
    path('api/products/trending/', product_trending, name='product_trending'),
    path('api/products/recommend/<str:user_id>/', product_home_recommend, name='product_home_recommend'),
    path('api/products/<int:product_id>/similar/', product_similar, name='product_similar'),
    path('api/products/<int:product_id>/', product_detail, name='product_detail'),
    path('api/categories/', categories_stub, name='categories_stub'),
]
