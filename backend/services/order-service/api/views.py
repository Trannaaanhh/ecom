from decimal import Decimal
from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Order
from .serializers import OrderSerializer


@api_view(['GET'])
def health(request):
    return Response({'status': 'ok', 'service': 'order-service'})


@api_view(['GET'])
def order_list(request):
    orders = Order.objects.all()
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def order_create(request):
    serializer = OrderSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def order_detail(request, pk):
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = OrderSerializer(order)
        return Response(serializer.data)

    elif request.method in ('PUT', 'PATCH'):
        partial = request.method == 'PATCH'
        serializer = OrderSerializer(order, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        order.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def admin_summary(request):
    today = timezone.now().date()
    today_orders = Order.objects.filter(created_at__date=today)
    all_orders = Order.objects.all()

    today_revenue = today_orders.aggregate(total=Sum('amount'))['total'] or Decimal('0')
    new_orders = today_orders.count()
    total_orders = all_orders.count()

    recent = all_orders[:10]
    serializer = OrderSerializer(recent, many=True)

    return Response({
        'kpis': {
            'today_revenue': int(today_revenue),
            'new_orders': new_orders,
            'total_orders': total_orders,
            'low_stock_count': 17,
        },
        'recent_orders': serializer.data,
    })
