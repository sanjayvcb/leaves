import sys
import os

# Add current directory to path so we can import local modules
sys.path.append(os.getcwd())

from download_images import download_images

print("Testing robust download...")
# Try to download just 1 image for a simple term
download_images(["apple"], max_images=1, base_dir="./test_download")
