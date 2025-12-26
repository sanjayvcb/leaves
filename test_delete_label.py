import requests
import json
import os
from pathlib import Path

BASE_URL = "http://127.0.0.1:5000"
LABEL = "test_delete_me"

def test_delete():
    print(f"Testing DELETE label functionality for '{LABEL}'...")
    
    # 1. Setup: Add dummy data manually to simulate existing training
    # This is a bit of a hack to test without running full training
    # We'll use internal functions if possible, or just mock it via file system if running locally
    # Since we are running on same machine as server, we can manipulate files directly for setup
    
    project_root = Path(__file__).parent
    trained_labels_file = project_root / "backend/trained_labels.json"
    dataset_dir = project_root / "backend/dataset" / LABEL
    
    # Add to json
    try:
        with open(trained_labels_file, 'r') as f:
            labels = json.load(f)
        if LABEL not in labels:
            labels.append(LABEL)
            with open(trained_labels_file, 'w') as f:
                json.dump(labels, f)
            print("  ✅ Added dummy label to json")
    except Exception as e:
        print(f"  ❌ Failed to setup json: {e}")
        return

    # Create dummy folder
    try:
        dataset_dir.mkdir(parents=True, exist_ok=True)
        (dataset_dir / "dummy.jpg").touch()
        print("  ✅ Created dummy dataset folder")
    except Exception as e:
        print(f"  ❌ Failed to setup folder: {e}")
        return

    # 2. Call DELETE API
    print(f"  Sending DELETE request to {BASE_URL}/train/labels/{LABEL}...")
    try:
        response = requests.delete(f"{BASE_URL}/train/labels/{LABEL}")
        print(f"  Status Code: {response.status_code}")
        print(f"  Response: {response.json()}")
        
        if response.status_code == 200:
            print("  ✅ API call successful")
        else:
            print("  ❌ API call failed")
            return
            
    except Exception as e:
        print(f"  ❌ Request failed: {e}")
        return

    # 3. Verify Removal
    # Json
    with open(trained_labels_file, 'r') as f:
        labels = json.load(f)
    if LABEL not in labels:
        print("  ✅ Verified: Label removed from JSON")
    else:
        print("  ❌ Failed: Label still in JSON")

    # Folder
    if not dataset_dir.exists():
        print("  ✅ Verified: Folder deleted")
    else:
        print("  ❌ Failed: Folder still exists")

if __name__ == "__main__":
    test_delete()
