from neomodel import StructuredNode, StringProperty, IntegerProperty, RelationshipTo, RelationshipFrom

class Category(StructuredNode):
    category_id = StringProperty(unique_index=True, required=True)
    name = StringProperty(required=True)

class Product(StructuredNode):
    product_id = StringProperty(unique_index=True, required=True)
    name = StringProperty(required=True)
    price = IntegerProperty()
    
    belongs_to = RelationshipTo('Category', 'BELONGS_TO')
    viewed_by = RelationshipFrom('User', 'VIEWED')
    added_to_cart_by = RelationshipFrom('User', 'ADDED_TO_CART')
    bought_by = RelationshipFrom('User', 'BOUGHT')

class User(StructuredNode):
    user_id = StringProperty(unique_index=True, required=True)
    
    viewed = RelationshipTo('Product', 'VIEWED')
    added_to_cart = RelationshipTo('Product', 'ADDED_TO_CART')
    bought = RelationshipTo('Product', 'BOUGHT')
