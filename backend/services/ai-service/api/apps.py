from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # Start Kafka Consumer in the background when the app is ready
        from . import kafka_consumer
        kafka_consumer.run_consumer_in_background()
