import os
import requests
import time
from duckduckgo_search import DDGS
from pathlib import Path

def download_images(keywords, max_images=50):
    for keyword in keywords:
        print(f"Searching for {keyword}...")
        # Create folder based on the leaf name (e.g., "Hibiscus leaf" -> "hibiscus")
        folder_name = keyword.split(' ')[0].lower()
        if 'tulasi' in keyword.lower(): folder_name = 'tulasi' # specific handling if needed
        
        save_dir = Path(f"dataset/{folder_name}")
        save_dir.mkdir(parents=True, exist_ok=True)
        
        count = 0
        try:
            with DDGS() as ddgs:
                # Fetch more than 50 just in case some fail to download
                results = list(ddgs.images(keyword, max_results=max_images + 30))
                
            for result in results:
                if count >= max_images:
                    break
                
                image_url = result['image']
                try:
                    response = requests.get(image_url, timeout=5)
                    response.raise_for_status()
                    
                    # Determine extension or default to .jpg
                    ext = '.jpg'
                    if 'png' in image_url.lower(): ext = '.png'
                    elif 'jpeg' in image_url.lower(): ext = '.jpg'
                    
                    file_path = save_dir / f"{folder_name}_{count:03d}{ext}"
                    
                    with open(file_path, 'wb') as f:
                        f.write(response.content)
                    
                    count += 1
                    print(f"[{count}/{max_images}] Downloaded {folder_name} image")
                    
                except Exception as e:
                    # print(f"Failed to download {image_url}: {e}")
                    pass
                    
        except Exception as search_err:
            print(f"Search failed for {keyword}: {search_err}")

if __name__ == "__main__":
    leaves = [
        "Hibiscus leaf",
        "Tulasi leaf", 
        "Rose leaf", 
        "Neem leaf", 
        "Onion leaf", 
        "Jasmine leaf" # Using correct spelling for search
    ]
    download_images(leaves)
