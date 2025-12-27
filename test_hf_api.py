import requests
import time

URL = "https://sanjayvcb-backend.hf.space/train/status"

print(f"Testing API at: {URL}")
print("Waiting for response (this might take a moment if the Space is sleeping)...")

try:
    response = requests.get(URL, timeout=30)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("\n✅ API is reachable and working!")
    else:
        print("\n⚠️ API returned an error status.")
        
except requests.exceptions.Timeout:
    print("\n❌ Request timed out. The Space might be building or cold starting.")
except Exception as e:
    print(f"\n❌ Error: {e}")
