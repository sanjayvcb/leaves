import os
import shutil
import random
from pathlib import Path

def split_dataset(source_dir, train_ratio=0.8):
    source_path = Path(source_dir)
    data_path = Path("data")
    
    # Create train and val directories
    train_dir = data_path / "train"
    val_dir = data_path / "val"
    
    # Always recreate data directory to ensure it tracks all current classes
    if data_path.exists():
        print("Removing existing data directory...")
        shutil.rmtree(data_path)

    data_path.mkdir(exist_ok=True)

    classes = [d.name for d in source_path.iterdir() if d.is_dir()]
    print(f"Found classes: {classes}")

    for cls in classes:
        # Create class folders in train and val
        (train_dir / cls).mkdir(parents=True, exist_ok=True)
        (val_dir / cls).mkdir(parents=True, exist_ok=True)
        
        # Get all images for the class
        cls_path = source_path / cls
        images = [f for f in cls_path.iterdir() if f.is_file() and f.suffix.lower() in ['.jpg', '.jpeg', '.png']]
        random.shuffle(images)
        
        split_idx = int(len(images) * train_ratio)
        train_imgs = images[:split_idx]
        val_imgs = images[split_idx:]
        
        # Copy images
        for img in train_imgs:
            shutil.copy2(img, train_dir / cls / img.name)
            
        for img in val_imgs:
            shutil.copy2(img, val_dir / cls / img.name)
            
        print(f"Class {cls}: {len(train_imgs)} train, {len(val_imgs)} val")

if __name__ == "__main__":
    split_dataset("dataset")
