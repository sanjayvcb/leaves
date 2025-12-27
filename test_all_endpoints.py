import requests
import json
import time

BASE_URL = "https://sanjayvcb-backend.hf.space"

def print_result(name, success, data=None):
    status = "PASS" if success else "FAIL"
    print(f"[{status}] {name}")
    if data:
        print(f"       Response: {str(data)[:200]}...") # Truncate long responses
    print("-" * 40)

print(f"Testing API at: {BASE_URL}\n")

# 1. Test Status
try:
    url = f"{BASE_URL}/train/status"
    res = requests.get(url, timeout=10)
    print_result("GET /train/status", res.status_code == 200, res.text)
except Exception as e:
    print_result("GET /train/status", False, str(e))

# 2. Test Labels
try:
    url = f"{BASE_URL}/train/labels"
    res = requests.get(url, timeout=10)
    print_result("GET /train/labels", res.status_code == 200, res.text)
except Exception as e:
    print_result("GET /train/labels", False, str(e))

# 3. Test Preview (POST)
try:
    url = f"{BASE_URL}/train/preview"
    # Use a common leaf name to ensure we find results
    payload = {"leaf_name": "banana", "max_images": 50}
    res = requests.post(url, json=payload, timeout=30)
    print_result("POST /train/preview", res.status_code == 200, res.text)
except Exception as e:
    print_result("POST /train/preview", False, str(e))

# 4. Test Predict (POST with URL)
try:
    url = f"{BASE_URL}/predict"
    # Use a reliable public image URL of a leaf
    image_url = "https://images.pexels.com/photos/807598/pexels-photo-807598.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    payload = {"url": image_url}
    res = requests.post(url, json=payload, timeout=30)
    print_result("POST /predict", res.status_code == 200, res.text)
except Exception as e:
    print_result("POST /predict", False, str(e))
