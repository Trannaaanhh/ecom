from django.urls import path
from .views import customer_login, health, service_stub, staff_login

urlpatterns = [
    path('health', health, name='health'),
    path('api/users/', service_stub, name='service_stub'),
    path('api/users/customer/login/', customer_login, name='customer_login'),
    path('api/users/staff/login/', staff_login, name='staff_login'),
]
