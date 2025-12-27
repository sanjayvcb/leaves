import shutil
import os
from pathlib import Path

SOURCE_DIR = Path("backend")
DEST_DIR = Path("backend/backend")

# Ensure destination exists
if not DEST_DIR.exists():
    print(f"Error: Destination {DEST_DIR} does not exist.")
    exit(1)

# Files/Dirs to IGNORE during copy
IGNORE_LIST = [
    ".git", 
    "backend", # Don't copy the destination folder into itself!
    "__pycache__",
    "venv",
    ".env",
    "dataset",
    "data",
    "runs",
    "results",
    "test_download",
    "test_backend_api.py",
    "test_api.py",
    "test_delete_label.py",
    "test_ddg.py",
    "test_download.py"
]

files_copied = 0

print(f"Copying files from {SOURCE_DIR} to {DEST_DIR}...")

for item in SOURCE_DIR.iterdir():
    if item.name in IGNORE_LIST:
        continue
    
    src_path = item
    dest_path = DEST_DIR / item.name
    
    try:
        if src_path.is_file():
            shutil.copy2(src_path, dest_path)
            print(f"Copied file: {item.name}")
            files_copied += 1
        elif src_path.is_dir():
            # Copy directory if not ignored (recursive)
            if dest_path.exists():
                shutil.rmtree(dest_path)
            shutil.copytree(src_path, dest_path)
            print(f"Copied dir:  {item.name}")
            files_copied += 1
            
    except Exception as e:
        print(f"Failed to copy {item.name}: {e}")

print(f"Success! Copied {files_copied} items.")
