import os
import google.generativeai as genai
from dotenv import load_dotenv

def test_models():
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Không tìm thấy GEMINI_API_KEY trong file .env")
        return
        
    genai.configure(api_key=api_key)
    
    print("Danh sách các model khả dụng cho tài khoản của bạn:")
    print("-" * 50)
    
    try:
        models = [m for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        
        if not models:
            print("Tài khoản của bạn không có model nào hỗ trợ generateContent.")
        else:
            for m in models:
                print(f"- Tên Model: {m.name}")
                print(f"  Mô tả: {m.description}")
                print("-" * 50)
                
    except Exception as e:
        print(f"Lỗi khi gọi API Google: {e}")

if __name__ == "__main__":
    test_models()
