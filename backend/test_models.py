import os
import google.generativeai as genai
from dotenv import load_dotenv

def test_models():
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not found in .env file")
        return
        
    genai.configure(api_key=api_key)
    
    print("Available models for your account:")
    print("-" * 50)
    
    try:
        models = [m for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        
        if not models:
            print("Your account does not have any models supporting generateContent.")
        else:
            for m in models:
                print(f"- Model Name: {m.name}")
                print(f"  Description: {m.description}")
                print("-" * 50)
                
    except Exception as e:
        print(f"Error calling Google API: {e}")

if __name__ == "__main__":
    test_models()
