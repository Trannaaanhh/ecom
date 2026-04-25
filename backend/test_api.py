import urllib.request
import json

def fetch(url):
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            print(f"[{response.status}] {url}")
            print(response.read().decode('utf-8')[:200])
    except Exception as e:
        print(f"ERROR: {url} - {e}")

fetch("http://localhost:8080/health")
fetch("http://localhost:8080/api/products/")
fetch("http://localhost:8080/api/categories/")
fetch("http://localhost:8080/api/ai/chat/")
