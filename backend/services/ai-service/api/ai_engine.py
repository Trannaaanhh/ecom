import logging
import math
import re
from pathlib import Path
from collections import Counter, defaultdict
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Sequence, Tuple
import random

try:
    import google.generativeai as genai
except Exception:  # pragma: no cover - optional dependency
    genai = None

from django.conf import settings

try:
    from neomodel import db
except Exception:  # pragma: no cover - optional dependency
    db = None

try:
    import torch
except Exception:  # pragma: no cover - optional dependency
    torch = None

logger = logging.getLogger(__name__)


ACTION_WEIGHTS = {
    "SEARCHED": 0.25,
    "VIEWED": 0.4,
    "ADDED_TO_CART": 0.75,
    "BOUGHT": 1.0,
}

ACTION_ALIASES = {
    "search": "SEARCHED",
    "searched": "SEARCHED",
    "query": "SEARCHED",
    "view": "VIEWED",
    "viewed": "VIEWED",
    "click": "VIEWED",
    "clicked": "VIEWED",
    "add_to_cart": "ADDED_TO_CART",
    "added_to_cart": "ADDED_TO_CART",
    "cart": "ADDED_TO_CART",
    "buy": "BOUGHT",
    "purchase": "BOUGHT",
    "purchased": "BOUGHT",
}

TOKEN_RE = re.compile(r"[0-9a-zA-ZÀ-ỹ]+", re.UNICODE)


FALLBACK_PRODUCTS = [
    {
        "product_id": "1",
        "name": "iPhone 15 Pro Max 256GB",
        "price": 28990000,
        "category_id": "phone",
        "category_name": "Phones & Accessories",
        "description": "Flagship smartphone for photography and mobile work needs.",
    },
    {
        "product_id": "2",
        "name": "MacBook Pro M3",
        "price": 32990000,
        "category_id": "laptop",
        "category_name": "Laptop & Computers",
        "description": "High-performance laptop for work and creative tasks.",
    },
    {
        "product_id": "3",
        "name": "Samsung Galaxy Tab S9 Ultra",
        "price": 22990000,
        "category_id": "tablet",
        "category_name": "Tablets & E-Readers",
        "description": "Premium Android tablet for media, drawing, and productivity.",
    },
    {
        "product_id": "4",
        "name": "Sony WH-1000XM5",
        "price": 7990000,
        "category_id": "headphones",
        "category_name": "Audio & Headphones",
        "description": "Wireless noise-cancelling headphones for music and calls.",
    },
    {
        "product_id": "5",
        "name": "Washing Machine LG Inverter 10kg",
        "price": 41990000,
        "category_id": "home",
        "category_name": "Household Appliances",
        "description": "Household appliances for family use and bulk purchases.",
    },
    {
        "product_id": "6",
        "name": "Arabica Coffee Beans 1kg",
        "price": 189000,
        "category_id": "food",
        "category_name": "Food & Beverages",
        "description": "Fast-moving consumer product, suitable for personal and office use.",
    },
    {
        "product_id": "7",
        "name": "Dell XPS 15 OLED",
        "price": 28990000,
        "category_id": "laptop",
        "category_name": "Laptop & Computers",
        "description": "Thin-and-light laptop with stunning OLED display for creators.",
    },
    {
        "product_id": "8",
        "name": "Nike Air Max Pulse",
        "price": 3990000,
        "category_id": "fashion",
        "category_name": "Fashion & Footwear",
        "description": "Comfortable lifestyle sneakers with modern design.",
    },
    {
        "product_id": "9",
        "name": "Dyson V15 Detect Cordless Vacuum",
        "price": 15990000,
        "category_id": "home",
        "category_name": "Household Appliances",
        "description": "Powerful cordless vacuum with laser dust detection.",
    },
    {
        "product_id": "10",
        "name": "Ebara Industrial Water Pump 5HP",
        "price": 2490000,
        "category_id": "industrial",
        "category_name": "Industrial Equipment",
        "description": "Industrial equipment suitable for construction and factories.",
    },
    {
        "product_id": "11",
        "name": "PlayStation 5 Slim Digital",
        "price": 11990000,
        "category_id": "gaming",
        "category_name": "Gaming & Consoles",
        "description": "Next-gen gaming console with lightning-fast SSD.",
    },
    {
        "product_id": "12",
        "name": "Kindle Paperwhite Signature",
        "price": 4590000,
        "category_id": "ebooks",
        "category_name": "Tablets & E-Readers",
        "description": "Waterproof e-reader with warm adjustable light.",
    },
    {
        "product_id": "13",
        "name": "Nutribullet Pro 900 Blender",
        "price": 1590000,
        "category_id": "kitchen",
        "category_name": "Kitchen & Dining",
        "description": "High-speed blender for smoothies, soups, and meal prep.",
    },
    {
        "product_id": "14",
        "name": "Samsung 65\" Neo QLED 4K TV",
        "price": 45990000,
        "category_id": "tv",
        "category_name": "TV & Home Theater",
        "description": "Stunning 4K TV with Neo Quantum HDR and smart features.",
    },
    {
        "product_id": "15",
        "name": "Lego Technic Porsche 911 RSR",
        "price": 2790000,
        "category_id": "toys",
        "category_name": "Toys & Hobbies",
        "description": "Detailed building kit with working steering and suspension.",
    },
    {
        "product_id": "16",
        "name": "Apple AirPods Pro 2 USB-C",
        "price": 6490000,
        "category_id": "headphones",
        "category_name": "Audio & Headphones",
        "description": "Premium wireless earbuds with active noise cancellation and adaptive transparency.",
    },
    {
        "product_id": "17",
        "name": "Nintendo Switch OLED",
        "price": 8990000,
        "category_id": "gaming",
        "category_name": "Gaming & Consoles",
        "description": "Hybrid gaming console with vibrant OLED screen for handheld and TV play.",
    },
    {
        "product_id": "18",
        "name": "Canon EOS R50 Mirrorless Camera",
        "price": 19990000,
        "category_id": "camera",
        "category_name": "Cameras & Photography",
        "description": "Compact mirrorless camera with 24.2MP sensor and 4K video recording.",
    },
    {
        "product_id": "19",
        "name": "Oral-B iO Series 9 Electric Toothbrush",
        "price": 4990000,
        "category_id": "personal-care",
        "category_name": "Personal Care & Beauty",
        "description": "Smart electric toothbrush with AI brushing recognition and magnetic charger.",
    },
    {
        "product_id": "20",
        "name": "Instant Pot Duo Plus 6-Quart",
        "price": 2590000,
        "category_id": "kitchen",
        "category_name": "Kitchen & Dining",
        "description": "9-in-1 electric pressure cooker, slow cooker, rice cooker, steamer, and more.",
    },
    {
        "product_id": "21",
        "name": "Logitech MX Master 3S Mouse",
        "price": 2590000,
        "category_id": "office",
        "category_name": "Office & Stationery",
        "description": "Ergonomic wireless mouse with quiet clicks and 8K DPI precision sensor.",
    },
    {
        "product_id": "22",
        "name": "Trek FX 1 Disc Hybrid Bike",
        "price": 12990000,
        "category_id": "sports",
        "category_name": "Sports & Outdoors",
        "description": "Lightweight hybrid bike ideal for commuting and weekend rides.",
    },
    {
        "product_id": "23",
        "name": "Yamaha P-145 Digital Piano",
        "price": 15990000,
        "category_id": "music",
        "category_name": "Musical Instruments",
        "description": "88-key weighted digital piano with realistic grand piano sound.",
    },
    {
        "product_id": "24",
        "name": "Herman Miller Aeron Chair",
        "price": 35990000,
        "category_id": "office",
        "category_name": "Office & Stationery",
        "description": "Iconic ergonomic office chair with breathable mesh and adjustable lumbar support.",
    },
    {
        "product_id": "25",
        "name": "The North Face Himilayan Down Parka",
        "price": 14990000,
        "category_id": "fashion",
        "category_name": "Fashion & Footwear",
        "description": "Extreme cold-weather down jacket rated to -30C for winter expeditions.",
    },
    {
        "product_id": "26",
        "name": "GoPro HERO12 Black",
        "price": 11990000,
        "category_id": "camera",
        "category_name": "Cameras & Photography",
        "description": "Action camera with 5.3K video, HyperSmooth stabilization, and waterproof to 10m.",
    },
    {
        "product_id": "27",
        "name": "Dyson Supersonic Hair Dryer",
        "price": 10990000,
        "category_id": "personal-care",
        "category_name": "Personal Care & Beauty",
        "description": "Fast drying with intelligent heat control and magnetic attachments.",
    },
    {
        "product_id": "28",
        "name": "Adidas Ultraboost Light Running Shoes",
        "price": 4590000,
        "category_id": "sports",
        "category_name": "Sports & Outdoors",
        "description": "Responsive running shoes with Light BOOST midsole for energy return.",
    },
    {
        "product_id": "29",
        "name": "Samsung Galaxy Watch 6 Classic 47mm",
        "price": 9990000,
        "category_id": "wearable",
        "category_name": "Wearable Technology",
        "description": "Smartwatch with rotating bezel, body composition analysis, and sleep tracking.",
    },
    {
        "product_id": "30",
        "name": "Panasonic Inverter Microwave 27L",
        "price": 4290000,
        "category_id": "kitchen",
        "category_name": "Kitchen & Dining",
        "description": "Inverter microwave with even heating, auto-cook menus, and child lock.",
    },
    {
        "product_id": "31",
        "name": "Sennheiser HD 560S Headphones",
        "price": 4990000,
        "category_id": "headphones",
        "category_name": "Audio & Headphones",
        "description": "Open-back reference headphones for critical listening and mixing.",
    },
    {
        "product_id": "32",
        "name": "Razer DeathAdder V3 Pro",
        "price": 3290000,
        "category_id": "gaming",
        "category_name": "Gaming & Consoles",
        "description": "Ultra-lightweight wireless gaming mouse with 30K optical sensor.",
    },
    {
        "product_id": "33",
        "name": "KitchenAid Artisan Stand Mixer 4.8L",
        "price": 18990000,
        "category_id": "kitchen",
        "category_name": "Kitchen & Dining",
        "description": "Iconic tilt-head stand mixer with 10 speeds and multiple attachments.",
    },
    {
        "product_id": "34",
        "name": "JBL Flip 6 Bluetooth Speaker",
        "price": 2990000,
        "category_id": "headphones",
        "category_name": "Audio & Headphones",
        "description": "Portable waterproof speaker with punchy bass and 12-hour battery.",
    },
    {
        "product_id": "35",
        "name": "Bose QuietComfort Earbuds II",
        "price": 7990000,
        "category_id": "headphones",
        "category_name": "Audio & Headphones",
        "description": "Customizable noise cancellation with world-class audio and secure fit.",
    },
]


@dataclass(frozen=True)
class ProductRecord:
    product_id: str
    name: str
    price: int = 0
    category_id: str = ""
    category_name: str = ""
    description: str = ""
    popularity: float = 0.0

    @property
    def text(self) -> str:
        return " ".join(
            value
            for value in [self.name, self.category_name, self.description]
            if value
        )


def _normalize_text(value: str) -> List[str]:
    return [token.lower() for token in TOKEN_RE.findall(value or "") if token.strip()]


def _cosine_similarity(left: Counter, right: Counter) -> float:
    if not left or not right:
        return 0.0

    shared_tokens = set(left) & set(right)
    numerator = sum(left[token] * right[token] for token in shared_tokens)
    left_norm = math.sqrt(sum(weight * weight for weight in left.values()))
    right_norm = math.sqrt(sum(weight * weight for weight in right.values()))
    if not left_norm or not right_norm:
        return 0.0
    return numerator / (left_norm * right_norm)


def _normalise_score_map(score_map: Dict[str, float]) -> Dict[str, float]:
    if not score_map:
        return {}

    max_score = max(score_map.values())
    if max_score <= 0:
        return {key: 0.0 for key in score_map}

    return {key: value / max_score for key, value in score_map.items()}


class HybridAIEngine:
    def __init__(self) -> None:
        self._genai_model = None
        self._lstm_artifact = None
        self._lstm_artifact_loaded = False

    def _load_lstm_artifact(self):
        if self._lstm_artifact_loaded:
            return self._lstm_artifact

        self._lstm_artifact_loaded = True
        model_path = str(getattr(settings, "LSTM_MODEL_PATH", "") or "").strip()
        if not model_path:
            return None

        path = Path(model_path)
        if not path.is_file():
            logger.info("LSTM artifact not found at %s", path)
            return None

        if torch is None:
            logger.warning("Torch is not installed, skipping LSTM artifact at %s", path)
            return None

        try:
            self._lstm_artifact = torch.load(path, map_location="cpu")
            logger.info("Loaded LSTM artifact from %s", path)
        except Exception as exc:
            logger.error("Failed to load LSTM artifact from %s: %s", path, exc)
            self._lstm_artifact = None
        return self._lstm_artifact

    def _lstm_scores(
        self,
        user_id: str,
        events: Sequence[Dict[str, Any]],
        candidate_products: Sequence[ProductRecord],
    ) -> Dict[str, float]:
        artifact = self._load_lstm_artifact()
        fallback_scores = self._behavior_scores(events)
        if artifact is None:
            return fallback_scores

        candidate_ids = [product.product_id for product in candidate_products]
        candidate_set = set(candidate_ids)

        def _from_ranked_list(values: Sequence[Any]) -> Dict[str, float]:
            ranking_scores: Dict[str, float] = {}
            total = max(len(values), 1)
            for index, value in enumerate(values):
                item_id = str(value).strip()
                if item_id in candidate_set:
                    ranking_scores[item_id] = float(total - index)
            return _normalise_score_map(ranking_scores)

        if isinstance(artifact, dict):
            for key in (
                "recommendations_by_user",
                "user_recommendations",
                "topk_by_user",
                "top_items_by_user",
            ):
                mapping = artifact.get(key)
                if isinstance(mapping, dict):
                    user_key = str(user_id or "").strip()
                    user_payload = mapping.get(user_key) or mapping.get(int(user_key)) if user_key.isdigit() else None
                    if user_payload:
                        if isinstance(user_payload, dict):
                            return _normalise_score_map({str(item_id): float(score) for item_id, score in user_payload.items() if str(item_id) in candidate_set})
                        if isinstance(user_payload, (list, tuple)):
                            return _from_ranked_list(user_payload)

            for key in ("item_scores", "product_scores", "candidate_scores", "scores_by_item"):
                mapping = artifact.get(key)
                if isinstance(mapping, dict):
                    parsed_scores = {
                        str(item_id): float(score)
                        for item_id, score in mapping.items()
                        if str(item_id) in candidate_set
                    }
                    if parsed_scores:
                        return _normalise_score_map(parsed_scores)

            for key in ("top_items", "recommendation_ids", "recommended_items"):
                values = artifact.get(key)
                if isinstance(values, (list, tuple)) and values:
                    return _from_ranked_list(values)

        predict = getattr(artifact, "predict", None)
        if callable(predict):
            try:
                predicted = predict({"user_id": user_id, "events": list(events), "candidates": candidate_ids})
                if isinstance(predicted, dict):
                    scores = {
                        str(item_id): float(score)
                        for item_id, score in predicted.items()
                        if str(item_id) in candidate_set
                    }
                    if scores:
                        return _normalise_score_map(scores)
                if isinstance(predicted, (list, tuple)):
                    return _from_ranked_list(predicted)
            except Exception as exc:
                logger.error("LSTM artifact predict() failed: %s", exc)

        return fallback_scores

    def _fetch_rows(self, query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        if db is None:
            return []

        try:
            rows, _ = db.cypher_query(query, params or {})
        except Exception as exc:
            logger.error("Neo4j query failed: %s", exc)
            return []

        return [self._row_to_dict(row) for row in rows]

    @staticmethod
    def _row_to_dict(row: Sequence[Any]) -> Dict[str, Any]:
        if isinstance(row, dict):
            return dict(row)
        return {
            "product_id": row[0] if len(row) > 0 else None,
            "name": row[1] if len(row) > 1 else None,
            "price": row[2] if len(row) > 2 else None,
            "category_id": row[3] if len(row) > 3 else None,
            "category_name": row[4] if len(row) > 4 else None,
            "description": row[5] if len(row) > 5 else None,
            "score": row[6] if len(row) > 6 else None,
        }

    def _fallback_catalog(self) -> List[ProductRecord]:
        return [ProductRecord(**item) for item in FALLBACK_PRODUCTS]

    def list_products(self, limit: int = 200) -> List[ProductRecord]:
        rows = self._fetch_rows(
            """
            MATCH (p:Product)
            OPTIONAL MATCH (p)-[:BELONGS_TO]->(c:Category)
            OPTIONAL MATCH (u:User)-[r:VIEWED|SEARCHED|ADDED_TO_CART|BOUGHT]->(p)
            RETURN
                p.product_id AS product_id,
                coalesce(p.name, '') AS name,
                coalesce(p.price, 0) AS price,
                coalesce(c.category_id, '') AS category_id,
                coalesce(c.name, '') AS category_name,
                '' AS description,
                count(r) AS popularity
            ORDER BY popularity DESC, name ASC
            LIMIT $limit
            """,
            {"limit": limit},
        )
        if not rows:
            return self._fallback_catalog()[:limit]

        return [
            ProductRecord(
                product_id=str(row.get("product_id") or ""),
                name=str(row.get("name") or ""),
                price=int(row.get("price") or 0),
                category_id=str(row.get("category_id") or ""),
                category_name=str(row.get("category_name") or ""),
                description=str(row.get("description") or ""),
                popularity=float(row.get("popularity") or 0),
            )
            for row in rows
            if row.get("product_id")
        ]

    def get_user_events(self, user_id: str) -> List[Dict[str, Any]]:
        if not user_id:
            return []

        return self._fetch_rows(
            """
            MATCH (u:User {user_id: $user_id})-[r:VIEWED|SEARCHED|ADDED_TO_CART|BOUGHT]->(p:Product)
            OPTIONAL MATCH (p)-[:BELONGS_TO]->(c:Category)
            RETURN
                type(r) AS action,
                p.product_id AS product_id,
                coalesce(p.name, '') AS name,
                coalesce(p.price, 0) AS price,
                coalesce(c.category_id, '') AS category_id,
                coalesce(c.name, '') AS category_name
            ORDER BY action, name
            LIMIT 100
            """,
            {"user_id": str(user_id)},
        )

    def get_popularity_scores(self) -> Dict[str, float]:
        rows = self._fetch_rows(
            """
            MATCH (u:User)-[r:VIEWED|SEARCHED|ADDED_TO_CART|BOUGHT]->(p:Product)
            RETURN p.product_id AS product_id, count(r) AS score
            ORDER BY score DESC
            """
        )
        score_map: Dict[str, float] = {}
        for row in rows:
            product_id = str(row.get("product_id") or "")
            if product_id:
                score_map[product_id] = float(row.get("score") or 0)
        return _normalise_score_map(score_map)

    def get_graph_candidates(self, user_id: str) -> Dict[str, float]:
        if not user_id:
            return {}

        candidate_scores: Dict[str, float] = defaultdict(float)
        rows = self._fetch_rows(
            """
            MATCH (u:User {user_id: $user_id})-[r1:VIEWED|SEARCHED|ADDED_TO_CART|BOUGHT]->(seed:Product)
            MATCH (other:User)-[:VIEWED|SEARCHED|ADDED_TO_CART|BOUGHT]->(seed)
            WHERE other.user_id <> $user_id
            MATCH (other)-[r2:VIEWED|SEARCHED|ADDED_TO_CART|BOUGHT]->(candidate:Product)
            WHERE NOT (u)-[:VIEWED|SEARCHED|ADDED_TO_CART|BOUGHT]->(candidate)
            RETURN candidate.product_id AS product_id, count(r2) AS score
            ORDER BY score DESC
            LIMIT 50
            """,
            {"user_id": str(user_id)},
        )
        for row in rows:
            product_id = str(row.get("product_id") or "")
            if product_id:
                candidate_scores[product_id] += float(row.get("score") or 0)

        rows = self._fetch_rows(
            """
            MATCH (u:User {user_id: $user_id})-[r:VIEWED|SEARCHED|ADDED_TO_CART|BOUGHT]->(seed:Product)-[:SIMILAR]-(candidate:Product)
            WHERE NOT (u)-[:VIEWED|SEARCHED|ADDED_TO_CART|BOUGHT]->(candidate)
            RETURN candidate.product_id AS product_id, count(r) AS score
            ORDER BY score DESC
            LIMIT 50
            """,
            {"user_id": str(user_id)},
        )
        for row in rows:
            product_id = str(row.get("product_id") or "")
            if product_id:
                candidate_scores[product_id] += float(row.get("score") or 0)

        return _normalise_score_map(candidate_scores)

    def get_similar_products(self, product_id: str, limit: int = 6) -> List[ProductRecord]:
        rows = self._fetch_rows(
            """
            MATCH (seed:Product {product_id: $product_id})
            OPTIONAL MATCH (seed)-[:BELONGS_TO]->(category:Category)
            OPTIONAL MATCH (seed)-[:SIMILAR]-(similar:Product)
            OPTIONAL MATCH (similar)-[:BELONGS_TO]->(similar_category:Category)
            WITH seed, category, similar, similar_category
            RETURN DISTINCT
                coalesce(similar.product_id, seed.product_id) AS product_id,
                coalesce(similar.name, seed.name) AS name,
                coalesce(similar.price, seed.price) AS price,
                coalesce(similar_category.category_id, category.category_id, '') AS category_id,
                coalesce(similar_category.name, category.name, '') AS category_name,
                '' AS description,
                CASE WHEN similar IS NULL THEN 0 ELSE 1 END AS score
            ORDER BY score DESC, name ASC
            LIMIT $limit
            """,
            {"product_id": str(product_id), "limit": limit + 1},
        )
        if not rows:
            catalog = self.list_products(limit=200)
            seed = next((item for item in catalog if item.product_id == str(product_id)), None)
            if not seed:
                return catalog[:limit]

            same_category = [
                item
                for item in catalog
                if item.product_id != seed.product_id and item.category_id == seed.category_id
            ]
            return same_category[:limit]

        filtered: List[ProductRecord] = []
        for row in rows:
            candidate_id = str(row.get("product_id") or "")
            if not candidate_id or candidate_id == str(product_id):
                continue
            filtered.append(
                ProductRecord(
                    product_id=candidate_id,
                    name=str(row.get("name") or ""),
                    price=int(row.get("price") or 0),
                    category_id=str(row.get("category_id") or ""),
                    category_name=str(row.get("category_name") or ""),
                    description=str(row.get("description") or ""),
                    popularity=float(row.get("score") or 0),
                )
            )
        return filtered[:limit]

    def _parse_behavior(self, behavior: Optional[Sequence[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        parsed: List[Dict[str, Any]] = []
        for event in behavior or []:
            if not isinstance(event, dict):
                continue
            product_id = str(event.get("product_id") or event.get("id") or "").strip()
            action = str(event.get("action") or event.get("type") or "").strip().lower()
            normalized_action = ACTION_ALIASES.get(action, "")
            if product_id and normalized_action:
                parsed.append({"product_id": product_id, "action": normalized_action})
        return parsed

    def _behavior_scores(self, events: Sequence[Dict[str, Any]]) -> Dict[str, float]:
        scores: Dict[str, float] = defaultdict(float)
        total = max(len(events), 1)
        for index, event in enumerate(events):
            action = event.get("action")
            product_id = str(event.get("product_id") or "")
            if not action or not product_id:
                continue
            action_weight = ACTION_WEIGHTS.get(str(action), 0.0)
            if action_weight <= 0:
                continue
            decay = 1.0 - (index / total) * 0.35
            scores[product_id] += action_weight * decay
        return _normalise_score_map(scores)

    def _query_scores(self, query: str, products: Sequence[ProductRecord]) -> Dict[str, float]:
        query = (query or "").strip()
        if not query:
            return {product.product_id: 0.0 for product in products}

        query_vector = Counter(_normalize_text(query))
        scores: Dict[str, float] = {}
        for product in products:
            product_vector = Counter(_normalize_text(product.text))
            scores[product.product_id] = _cosine_similarity(query_vector, product_vector)
        return _normalise_score_map(scores)

    def _merge_candidate_ids(self, *score_maps: Dict[str, float], fallback: Sequence[ProductRecord]) -> List[str]:
        candidate_ids = set()
        for score_map in score_maps:
            candidate_ids.update(score_map.keys())
        if not candidate_ids:
            candidate_ids.update(product.product_id for product in fallback)
        return list(candidate_ids)

    def _get_candidate_products(self, candidate_ids: Sequence[str]) -> List[ProductRecord]:
        all_products = {product.product_id: product for product in self.list_products(limit=500)}
        products: List[ProductRecord] = []
        for candidate_id in candidate_ids:
            product = all_products.get(str(candidate_id))
            if product:
                products.append(product)
        return products

    def recommend(
        self,
        user_id: Optional[str] = None,
        query: str = "",
        behavior: Optional[Sequence[Dict[str, Any]]] = None,
        limit: int = 10,
        preferred_category: str = "",
    ) -> Dict[str, Any]:
        user_id = str(user_id or "").strip()
        parsed_behavior = self._parse_behavior(behavior)
        products = self.list_products(limit=300)
        popularity_scores = self.get_popularity_scores()
        graph_scores = self.get_graph_candidates(user_id) if user_id else {}
        lstm_scores = self._lstm_scores(user_id, parsed_behavior or self.get_user_events(user_id), products)
        query_scores = self._query_scores(query, products)

        candidate_ids = self._merge_candidate_ids(
            popularity_scores,
            graph_scores,
            lstm_scores,
            query_scores,
            fallback=products,
        )
        if preferred_category:
            preferred_category = preferred_category.strip().lower()

        scored_items: List[Dict[str, Any]] = []
        for product in self._get_candidate_products(candidate_ids):
            if preferred_category and preferred_category not in {product.category_id.lower(), product.category_name.lower()}:
                category_bonus = 0.0
            else:
                category_bonus = 0.1 if preferred_category else 0.0

            behavior_score = lstm_scores.get(product.product_id, 0.0)
            graph_score = graph_scores.get(product.product_id, 0.0)
            rag_score = query_scores.get(product.product_id, 0.0)
            popularity_score = popularity_scores.get(product.product_id, 0.0)

            final_score = (
                0.38 * behavior_score
                + 0.32 * graph_score
                + 0.22 * rag_score
                + 0.08 * popularity_score
                + category_bonus
            )

            reasons = []
            if behavior_score > 0:
                reasons.append("matching recent LSTM/behavior signals")
            if graph_score > 0:
                reasons.append("correlation from user/product graph")
            if rag_score > 0:
                reasons.append("semantic query match")
            if popularity_score > 0 and not reasons:
                reasons.append("popular in system")

            scored_items.append(
                {
                    "product_id": product.product_id,
                    "name": product.name,
                    "price": product.price,
                    "category_id": product.category_id,
                    "category_name": product.category_name,
                    "description": product.description,
                    "score": round(final_score, 4),
                    "signals": reasons,
                    "lstm_score": round(behavior_score, 4),
                }
            )

        scored_items.sort(key=lambda item: (item["score"], item["price"]), reverse=True)
        top_items = scored_items[:limit]
        return {
            "user_id": user_id,
            "query": query,
            "model": "hybrid-lstm-graph-rag-v1",
            "lstm_model_loaded": self._lstm_artifact is not None,
            "recommendations": [item["product_id"] for item in top_items],
            "items": top_items,
        }

    def rerank_search(
        self,
        result_ids: Sequence[Any],
        query: str = "",
        user_id: Optional[str] = None,
        preferred_category: str = "",
        limit: int = 20,
    ) -> Dict[str, Any]:
        candidate_ids = [str(item_id) for item_id in result_ids if str(item_id).strip()]
        candidates = self._get_candidate_products(candidate_ids)
        if not candidates:
            return {
                "model": "search-rerank-v1",
                "reranked_ids": [],
                "items": [],
            }

        behavior_scores = self._behavior_scores(self.get_user_events(str(user_id or "")))
        query_scores = self._query_scores(query, candidates)
        popularity_scores = self.get_popularity_scores()

        reranked_items: List[Dict[str, Any]] = []
        preferred_category = (preferred_category or "").strip().lower()

        for product in candidates:
            category_bonus = 0.0
            if preferred_category and preferred_category in {product.category_id.lower(), product.category_name.lower()}:
                category_bonus = 0.12

            score = (
                0.5 * query_scores.get(product.product_id, 0.0)
                + 0.25 * behavior_scores.get(product.product_id, 0.0)
                + 0.15 * popularity_scores.get(product.product_id, 0.0)
                + category_bonus
            )
            reranked_items.append(
                {
                    "product_id": product.product_id,
                    "name": product.name,
                    "price": product.price,
                    "category_id": product.category_id,
                    "category_name": product.category_name,
                    "score": round(score, 4),
                }
            )

        reranked_items.sort(key=lambda item: (item["score"], item["price"]), reverse=True)
        reranked_items = reranked_items[:limit]
        return {
            "model": "search-rerank-v1",
            "reranked_ids": [item["product_id"] for item in reranked_items],
            "items": reranked_items,
        }

    def fraud_score(self, amount: float, user_id: Optional[str] = None, risk_flags: Optional[Sequence[str]] = None) -> Dict[str, Any]:
        risk_flags = [str(flag).strip().lower() for flag in (risk_flags or []) if str(flag).strip()]
        amount = float(amount or 0)
        amount_score = min(amount / 50_000_000, 1.0)
        flag_score = min(len(risk_flags) * 0.15, 0.45)

        user_history = self.get_user_events(str(user_id or ""))
        user_penalty = 0.0
        if user_history:
            total_purchases = sum(1 for item in user_history if item.get("action") == "BOUGHT")
            total_cart = sum(1 for item in user_history if item.get("action") == "ADDED_TO_CART")
            user_penalty = max(0.0, 0.15 - min((total_purchases + total_cart) * 0.03, 0.12))

        fraud_score = round(min(1.0, amount_score * 0.55 + flag_score + user_penalty), 4)
        if fraud_score < 0.35:
            risk_level = "low"
            requires_manual_review = False
        elif fraud_score < 0.7:
            risk_level = "medium"
            requires_manual_review = False
        else:
            risk_level = "high"
            requires_manual_review = True

        return {
            "model": "fraud-rule-graph-v1",
            "fraud_score": fraud_score,
            "risk_level": risk_level,
            "requires_manual_review": requires_manual_review,
            "signals": {
                "amount": amount,
                "risk_flags": risk_flags,
                "user_history_size": len(user_history),
            },
        }

    def forecast(self, product_id: str, horizon: int = 7) -> Dict[str, Any]:
        horizon = max(1, min(int(horizon or 7), 30))
        popularity = self.get_popularity_scores().get(str(product_id), 0.0)
        baseline = max(1.0, popularity * 10)
        forecasts = []
        for day in range(1, horizon + 1):
            seasonal = 1.0 + 0.05 * math.sin(day)
            forecasts.append(
                {
                    "day": day,
                    "predicted_units": round(baseline * seasonal, 2),
                }
            )
        return {
            "model": "forecast-naive-v1",
            "product_id": str(product_id),
            "horizon": horizon,
            "forecast": forecasts,
        }

    def _build_context(self, user_id: Optional[str], message: str, behavior: Optional[Sequence[Dict[str, Any]]] = None) -> Tuple[str, List[Dict[str, Any]]]:
        recommendation = self.recommend(user_id=user_id, query=message, behavior=behavior, limit=5)
        items = recommendation.get("items", [])
        context_lines = []
        if user_id:
            context_lines.append(f"Người dùng: {user_id}")
        if items:
            context_lines.append("Related products:")
            for item in items:
                context_lines.append(
                    f"- {item['name']} | {item['price']:,} VND | {item.get('category_name') or item.get('category_id') or 'n/a'}"
                )
        else:
            context_lines.append("Insufficient product context found. Provide a safe response and suggest clarifying customer needs.")
        return "\n".join(context_lines), items

    def _get_gemini_model(self):
        if genai is None or not settings.GEMINI_API_KEY:
            return None

        if self._genai_model is None:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._genai_model = genai.GenerativeModel("gemini-1.5-flash-latest")
        return self._genai_model

    def chat(self, user_id: Optional[str], message: str, behavior: Optional[Sequence[Dict[str, Any]]] = None) -> Dict[str, Any]:
        context, items = self._build_context(user_id, message, behavior)
        prompt = f"""
You are a sales advisor for the Ecommerge e-commerce system.

Retrieved context:
{context}

Customer inquiry: {message}

Requirements:
- Provide brief, professional, natural English responses.
- Prioritize recommending products from the context if relevant.
- If insufficient data, ask a clarifying question or provide 2-3 safe options.
- Do not fabricate information not present in the context.
""".strip()

        # Stronger prompt that asks for diverse suggestions and short rationales.
        prompt = f"""
    You are a helpful and creative sales advisor for the Ecomerge e-commerce platform.

    Retrieved context:
    {context}

    Customer inquiry: {message}

    Goal: Provide 2-4 diverse product recommendations (when available) with a one-sentence rationale for each,
    plus a short, friendly follow-up question to clarify preferences (budget, use-case, brand) when helpful.

    Guidelines:
    - Use concise, natural language (Vietnamese if user's site language appears to be Vietnamese, otherwise English).
    - Prefer items present in the retrieved context; if none, be explicit about data limits and ask for clarifying info.
    - Vary phrasing across responses and avoid repeating the same template.
    - Keep the reply under 3 short paragraphs.

    Example output:
    1) Product A - brief reason.
    2) Product B - brief reason.
    If you want, I can filter by budget or brand — what is your preferred price range?

    Now answer the customer inquiry using the rules above.
    """.strip()

        model = self._get_gemini_model()
        if model is not None:
            try:
                response = model.generate_content(prompt)
                reply = (getattr(response, "text", "") or "").strip()
                if not reply:
                    raise ValueError("Empty Gemini response")
                return {
                    "model": "gemini-1.5-flash-latest",
                    "lstm_model_loaded": self._lstm_artifact is not None,
                    "reply": reply,
                    "suggestions": items,
                }
            except Exception as exc:
                logger.error("Gemini generation failed: %s", exc)

            if items:
                # create several diverse fallback reply templates
                top_items = items[:4]
                suggestion_lines = [f"{it['name']} ({it['price']:,}đ) — {it.get('category_name','') or it.get('category_id','') or ''}".strip(' -') for it in top_items]
                templates = [
                    lambda s: f"Gợi ý cho bạn: {s}. Muốn mình lọc theo ngân sách hoặc thương hiệu không?",
                    lambda s: f"Bạn có thể cân nhắc: {s}. Bạn ưu tiên tính năng nào (pin, màn hình, hiệu năng)?",
                    lambda s: f"Một vài lựa chọn phù hợp: {s}. Mình có thể thu hẹp theo giá hoặc mục đích sử dụng nếu bạn muốn.",
                    lambda s: f"Đây là những gợi ý ban đầu: {s}. Bạn muốn so sánh chi tiết giữa chúng không?",
                    lambda s: f"Dưới đây là một vài đề xuất: {s}. Bạn muốn xem thêm sản phẩm tương tự không?",
                    lambda s: f"Các sản phẩm phù hợp nhất: {s}. Hãy cho mình biết nếu bạn cần tư vấn thêm về giá cả hoặc bảo hành nhé.",
                    lambda s: f"Mình recommend: {s}. Bạn có muốn khám phá thêm các lựa chọn khác cùng phân khúc không?",
                    lambda s: f"Here are some suggestions: {s}. Would you like me to narrow down by price or brand?",
                    lambda s: f"Based on your needs: {s}. Let me know if you prefer other colors, sizes, or specs.",
                ]
                joined = "; ".join(suggestion_lines)
                choice = random.choice(templates)
                reply = choice(joined)
        else:
            reply = "Mình chưa đủ dữ liệu để gợi ý chính xác. Bạn cho mình biết ngân sách, mục đích sử dụng và thương hiệu ưu tiên nhé."

        return {
            "model": "hybrid-rag-fallback-v1",
            "lstm_model_loaded": self._lstm_artifact is not None,
            "reply": reply,
            "suggestions": items,
        }


engine = HybridAIEngine()
