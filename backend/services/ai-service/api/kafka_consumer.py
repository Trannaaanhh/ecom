import json
import logging
import threading
from kafka import KafkaConsumer
from django.conf import settings
from .models import User, Product, Category

logger = logging.getLogger(__name__)

def handle_user_activity(message_value):
    """
    Handles events from 'user_activity' topic.
    Expected payload:
    {
        "user_id": "123",
        "product_id": "456",
        "action": "view" | "click" | "add_to_cart",
        "product_details": {"name": "Laptop", "price": 1000, "category_id": "c1", "category_name": "Electronics"}
    }
    """
    try:
        user_id = str(message_value.get('user_id'))
        product_id = str(message_value.get('product_id'))
        action = message_value.get('action')
        product_details = message_value.get('product_details', {})
        
        if not user_id or not product_id or not action:
            return

        # 1. Ensure User node exists
        user = User.nodes.get_or_none(user_id=user_id)
        if not user:
            user = User(user_id=user_id).save()

        # 2. Ensure Product node exists
        product = Product.nodes.get_or_none(product_id=product_id)
        if not product:
            product = Product(
                product_id=product_id,
                name=product_details.get('name', f"Product {product_id}"),
                price=product_details.get('price', 0)
            ).save()
            
            # Link category if provided
            cat_id = product_details.get('category_id')
            if cat_id:
                category = Category.nodes.get_or_none(category_id=cat_id)
                if not category:
                    category = Category(
                        category_id=cat_id, 
                        name=product_details.get('category_name', f"Category {cat_id}")
                    ).save()
                product.belongs_to.connect(category)

        # 3. Create relationship based on action
        if action in ['view', 'click']:
            if not user.viewed.is_connected(product):
                user.viewed.connect(product)
        elif action == 'add_to_cart':
             if not user.added_to_cart.is_connected(product):
                user.added_to_cart.connect(product)
                
        logger.info(f"Processed user_activity: {user_id} {action} {product_id}")
    except Exception as e:
        logger.error(f"Error processing user_activity: {e}")

def handle_order_created(message_value):
    """
    Handles events from 'order_created' topic.
    Expected payload:
    {
        "order_id": "o1",
        "user_id": "123",
        "items": [
            {"product_id": "456", "name": "Laptop", "price": 1000}
        ]
    }
    """
    try:
        user_id = str(message_value.get('user_id'))
        items = message_value.get('items', [])
        
        if not user_id or not items:
            return

        user = User.nodes.get_or_none(user_id=user_id)
        if not user:
            user = User(user_id=user_id).save()

        for item in items:
            product_id = str(item.get('product_id'))
            product = Product.nodes.get_or_none(product_id=product_id)
            if not product:
                product = Product(
                    product_id=product_id,
                    name=item.get('name', f"Product {product_id}"),
                    price=item.get('price', 0)
                ).save()
            
            # Connect relationship
            if not user.bought.is_connected(product):
                user.bought.connect(product)
                
        logger.info(f"Processed order_created for user {user_id}")
    except Exception as e:
        logger.error(f"Error processing order_created: {e}")

def start_kafka_consumer():
    consumer = KafkaConsumer(
        'user_activity', 'order_created',
        bootstrap_servers=[settings.KAFKA_BOOTSTRAP_SERVERS],
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        group_id='ai_service_group',
        auto_offset_reset='earliest'
    )
    
    logger.info("Kafka Consumer started listening...")
    
    for message in consumer:
        if message.topic == 'user_activity':
            handle_user_activity(message.value)
        elif message.topic == 'order_created':
            handle_order_created(message.value)

def run_consumer_in_background():
    thread = threading.Thread(target=start_kafka_consumer, daemon=True)
    thread.start()
