import json
import logging
from django.http import JsonResponse
from rest_framework.decorators import api_view
from django.views.decorators.csrf import csrf_exempt
from neomodel import db
import google.generativeai as genai
from django.conf import settings

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
# Sử dụng model gemini-1.5-flash-latest thay vì tên gọi cũ để tránh lỗi 404
model = genai.GenerativeModel('gemini-1.5-flash-latest')

@api_view(['GET'])
def get_recommendations(request, user_id):
    """
    GET /api/v1/ai/recommendations/{user_id}/
    Logic: Query Neo4j to find products bought/added_to_cart by similar users.
    """
    if not user_id:
         return JsonResponse({"error": "user_id is required"}, status=400)

    query = """
    MATCH (u:User {user_id: $user_id})-[:BOUGHT|ADDED_TO_CART]->(p:Product)<-[:BOUGHT|ADDED_TO_CART]-(other:User)-[:BOUGHT|ADDED_TO_CART]->(rec:Product)
    WHERE NOT (u)-[:BOUGHT|ADDED_TO_CART]->(rec)
    RETURN rec.product_id AS product_id, count(rec) AS score
    ORDER BY score DESC
    LIMIT 10
    """
    
    try:
        results, meta = db.cypher_query(query, {'user_id': str(user_id)})
        product_ids = [row[0] for row in results]
        
        if not product_ids:
            fallback_query = """
            MATCH (u:User)-[:BOUGHT|ADDED_TO_CART]->(p:Product)
            RETURN p.product_id AS product_id, count(u) AS score
            ORDER BY score DESC
            LIMIT 5
            """
            fb_results, _ = db.cypher_query(fallback_query)
            product_ids = [row[0] for row in fb_results]

        return JsonResponse({"user_id": user_id, "recommendations": product_ids})
    except Exception as e:
        logger.error(f"Error fetching recommendations from Neo4j: {e}")
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@api_view(['POST'])
def chat(request):
    """
    POST /api/v1/ai/chat/
    Logic (Native GraphRAG):
    1. Query user history from Neo4j
    2. Build context prompt
    3. Call Gemini
    """
    payload = request.data if hasattr(request, 'data') else json.loads(request.body.decode('utf-8') or '{}')
    user_id = str(payload.get('user_id', ''))
    message = payload.get('message', '').strip()

    if not message:
         return JsonResponse({'error': 'message is required'}, status=400)

    context = ""
    # 1. Lấy lịch sử từ Graph DB
    if user_id:
        try:
             query = """
             MATCH (u:User {user_id: $user_id})-[r:BOUGHT|VIEWED|ADDED_TO_CART]->(p:Product)
             RETURN type(r) AS action, p.name AS product_name, p.price AS price
             ORDER BY action
             LIMIT 10
             """
             results, _ = db.cypher_query(query, {'user_id': user_id})
             
             if results:
                 context += "Lịch sử mua sắm và xem hàng của khách hàng:\n"
                 for row in results:
                      action, name, price = row
                      action_vn = "Đã mua" if action == "BOUGHT" else "Đã thêm vào giỏ" if action == "ADDED_TO_CART" else "Đã xem"
                      context += f"- {action_vn}: {name} (Giá: {price})\n"
             else:
                 context += "Khách hàng mới, chưa có nhiều lịch sử.\n"
        except Exception as e:
             logger.error(f"Error querying history for chat: {e}")
    
    # 2. Xây dựng Context Prompt (Prompt Engineering)
    prompt = f"""
    Bạn là một trợ lý ảo tư vấn bán hàng chuyên nghiệp, nhiệt tình của hệ thống E-commerce.
    Dưới đây là thông tin ngữ cảnh về người dùng hiện tại (nếu có):
    {context}
    
    Khách hàng hỏi: "{message}"
    
    Dựa vào lịch sử trên (nếu có), hãy tư vấn sản phẩm phù hợp, đề xuất các lựa chọn tốt, và giữ thái độ lịch sự, chuyên nghiệp. Không bịa đặt thông tin nếu không chắc chắn.
    """

    # 3. Gọi Google Gemini
    try:
        if not settings.GEMINI_API_KEY:
            return JsonResponse({
                "reply": "Lỗi: Không tìm thấy API Key. Xin hãy kiểm tra lại file .env"
            })

        response = model.generate_content(prompt)
        reply = response.text
        return JsonResponse({"reply": reply})
    except Exception as e:
        logger.error(f"Error calling Gemini: {e}")
        # Trả về luôn lỗi thật sự của Google để debug trên giao diện
        return JsonResponse({
            "reply": f"[Lỗi kỹ thuật]: {str(e)}\n(Có thể do sai tên Model hoặc API Key không hợp lệ)"
        })
