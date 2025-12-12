import requests
import json

def check_stats():
    try:
        resp = requests.get("http://127.0.0.1:8000/stats")
        print(f"Status Code: {resp.status_code}")
        print("Response Body:")
        print(json.dumps(resp.json(), indent=2))
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    check_stats()
