try:
    from neomodel import StructuredNode, StringProperty, IntegerProperty, RelationshipTo, RelationshipFrom
except Exception:  # pragma: no cover - fallback for environments without neomodel
    class _DummyRelationship:
        def __init__(self, *args, **kwargs):
            pass

        def connect(self, *args, **kwargs):
            return None

        def is_connected(self, *args, **kwargs):
            return False

    class _DummyManager:
        def get_or_none(self, **kwargs):
            return None

    class StructuredNode:
        nodes = _DummyManager()

        def save(self):
            return self

    def StringProperty(*args, **kwargs):
        return None

    def IntegerProperty(*args, **kwargs):
        return None

    def RelationshipTo(*args, **kwargs):
        return _DummyRelationship()

    def RelationshipFrom(*args, **kwargs):
        return _DummyRelationship()

class Category(StructuredNode):
    category_id = StringProperty(unique_index=True, required=True)
    name = StringProperty(required=True)

class Product(StructuredNode):
    product_id = StringProperty(unique_index=True, required=True)
    name = StringProperty(required=True)
    price = IntegerProperty()
    
    belongs_to = RelationshipTo('Category', 'BELONGS_TO')
    similar_to = RelationshipTo('Product', 'SIMILAR')
    viewed_by = RelationshipFrom('User', 'VIEWED')
    searched_by = RelationshipFrom('User', 'SEARCHED')
    added_to_cart_by = RelationshipFrom('User', 'ADDED_TO_CART')
    bought_by = RelationshipFrom('User', 'BOUGHT')

class User(StructuredNode):
    user_id = StringProperty(unique_index=True, required=True)
    
    viewed = RelationshipTo('Product', 'VIEWED')
    searched = RelationshipTo('Product', 'SEARCHED')
    added_to_cart = RelationshipTo('Product', 'ADDED_TO_CART')
    bought = RelationshipTo('Product', 'BOUGHT')
