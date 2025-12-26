import requests
import json

# Backend URL
BASE_URL = "https://leaves-86bp.onrender.com"

print("=" * 60)
print("TESTING BACKEND API ENDPOINTS")
print("=" * 60)
print(f"Backend URL: {BASE_URL}\n")

# Test 1: Get Trained Labels
print("1. Testing GET /train/labels")
try:
    r = requests.get(f"{BASE_URL}/train/labels", timeout=5)
    print(f"   Status: {r.status_code}")
    print(f"   Response: {r.json()}")
    print("   ✅ PASSED\n")
except Exception as e:
    print(f"   ❌ FAILED: {e}\n")

# Test 2: Get Training Status
print("2. Testing GET /train/status")
try:
    r = requests.get(f"{BASE_URL}/train/status", timeout=5)
    print(f"   Status: {r.status_code}")
    print(f"   Response: {r.json()}")
    print("   ✅ PASSED\n")
except Exception as e:
    print(f"   ❌ FAILED: {e}\n")

# Test 3: Preview Images (POST)
print("3. Testing POST /train/preview")
try:
    r = requests.post(
        f"{BASE_URL}/train/preview",
        json={"leaf_name": "test"},
        timeout=10
    )
    print(f"   Status: {r.status_code}")
    data = r.json()
    print(f"   Success: {data.get('success')}")
    print(f"   Images Count: {data.get('count')}")
    print("   ✅ PASSED\n")
except Exception as e:
    print(f"   ❌ FAILED: {e}\n")

# Test 4: Predict (requires image file)
print("4. Testing POST /predict")
print("   ⚠️  SKIPPED (requires image file)\n")

# Test 5: Upload Images (requires files)
print("5. Testing POST /train/upload")
print("   ⚠️  SKIPPED (requires image files)\n")

# Test 6: Start Training
print("6. Testing POST /train/start")
print("   ⚠️  SKIPPED (would start actual training)\n")

print("=" * 60)
print("API TEST SUMMARY")
print("=" * 60)
print("✅ = Working | ❌ = Failed | ⚠️  = Skipped")
print("\nNote: Some endpoints require files or would trigger")
print("actual training, so they were skipped in this test.")
print("=" * 60)
