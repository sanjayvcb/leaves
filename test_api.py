import requests
import os

# Path to a test image
image_path = r'E:\leaf\download.jpg'
url = 'http://127.0.0.1:5000/predict'

if not os.path.exists(image_path):
    print(f"File not found: {image_path}")
else:
    try:
        with open(image_path, 'rb') as img:
            files = {'file': img}
            response = requests.post(url, files=files)
        
        if response.status_code == 200:
            print("Success!")
            print(response.json())
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Request failed: {e}")
