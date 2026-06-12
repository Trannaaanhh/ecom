import json, subprocess, sys

# Test 1: Recommendations
result = subprocess.run(
    ['curl.exe', '-s', 'http://localhost:8080/api/ai/recommend/?query=laptop+for+programming&limit=5'],
    capture_output=True, text=True
)
data = json.loads(result.stdout)
print(f"[RECOMMEND] Items: {len(data.get('items', []))}")
for i in data.get('items', []):
    print(f"  - {i['name']} ({i['price']:,}đ) [{i.get('category_name', '')}]")

# Test 2: Chatbot
result2 = subprocess.run(
    ['curl.exe', '-s', '-X', 'POST', 'http://localhost:8080/api/ai/chatbot/',
     '-H', 'Content-Type: application/json',
     '-d', '{"message":"suggest a good laptop for programming"}'],
    capture_output=True, text=True
)
data2 = json.loads(result2.stdout)
print(f"\n[CHATBOT] Model: {data2.get('model')}")
print(f"  Reply: {data2.get('reply')}")

# Test 3: Different query
result3 = subprocess.run(
    ['curl.exe', '-s', '-X', 'POST', 'http://localhost:8080/api/ai/chatbot/',
     '-H', 'Content-Type: application/json',
     '-d', '{"message":"I need wireless headphones for commuting"}'],
    capture_output=True, text=True
)
data3 = json.loads(result3.stdout)
print(f"\n[CHATBOT2] Model: {data3.get('model')}")
print(f"  Reply: {data3.get('reply')[:200]}...")
