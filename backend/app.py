from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import os
import uuid
import shutil
import threading
import time
from pathlib import Path
from ddgs import DDGS
import requests
import random
import sys

# Add project root to path to ensure we can import unrelated modules if needed
# (though we are implementing logic directly here for robustness)
PROJECT_ROOT = Path(__file__).resolve().parent
DATASET_DIR = PROJECT_ROOT / "dataset"
DATA_DIR = PROJECT_ROOT / "data"
RESULTS_DIR = PROJECT_ROOT / "results"
WEIGHTS_PATH = RESULTS_DIR / "weights/best.pt"

app = Flask(__name__)
CORS(app)

# Global Training State
training_state = {
    "status": "idle", # idle, downloading, preparing, training, completed, error
    "message": "",
    "progress": 0,
    "result": None
}

def load_model():
    try:
        path = str(WEIGHTS_PATH) if WEIGHTS_PATH.exists() else 'yolov8n-cls.pt'
        print(f"Loading model from: {path}")
        return YOLO(path)
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

model = load_model()

# --- Helper Functions ---

def download_images_task(keyword, max_images=50):
    print(f"Searching for {keyword}...")
    folder_name = keyword.split(' ')[0].lower()
    if 'tulasi' in keyword.lower(): folder_name = 'tulasi'
    
    save_dir = DATASET_DIR / folder_name
    save_dir.mkdir(parents=True, exist_ok=True)
    
    count = 0
    downloaded = 0
    
    try:
        with DDGS() as ddgs:
            results = list(ddgs.images(keyword, max_results=max_images + 30))
            
        for result in results:
            if downloaded >= max_images:
                break
            
            image_url = result['image']
            try:
                response = requests.get(image_url, timeout=5)
                response.raise_for_status()
                
                ext = '.jpg'
                if 'png' in image_url.lower(): ext = '.png'
                elif 'jpeg' in image_url.lower(): ext = '.jpg'
                
                # Check if file exists to avoid duplicates/overwrite if mostly same
                file_path = save_dir / f"{folder_name}_{int(time.time())}_{downloaded}{ext}"
                
                with open(file_path, 'wb') as f:
                    f.write(response.content)
                
                downloaded += 1
                # print(f"[{downloaded}/{max_images}] Downloaded")
                
            except Exception:
                pass
                
    except Exception as search_err:
        print(f"Search failed: {search_err}")
        raise search_err

def prepare_data_split():
    # Clear existing data dir to ensure fresh split including new class
    if DATA_DIR.exists():
        shutil.rmtree(DATA_DIR)
    
    train_dir = DATA_DIR / "train"
    val_dir = DATA_DIR / "val"
    
    classes = [d.name for d in DATASET_DIR.iterdir() if d.is_dir()]
    
    for cls in classes:
        (train_dir / cls).mkdir(parents=True, exist_ok=True)
        (val_dir / cls).mkdir(parents=True, exist_ok=True)
        
        cls_path = DATASET_DIR / cls
        images = [f for f in cls_path.iterdir() if f.is_file() and f.suffix.lower() in ['.jpg', '.jpeg', '.png']]
        random.shuffle(images)
        
        # 80/20 split
        split_idx = int(len(images) * 0.8)
        train_imgs = images[:split_idx]
        val_imgs = images[split_idx:]
        
        for img in train_imgs:
            shutil.copy2(img, train_dir / cls / img.name)
        for img in val_imgs:
            shutil.copy2(img, val_dir / cls / img.name)

def run_training_workflow(leaf_name):
    global model
    global training_state
    
    try:
        # Step 1: Download
        training_state.update({"status": "downloading", "message": f"Downloading images for {leaf_name}..."})
        download_images_task(f"{leaf_name} leaf")
        
        # Step 2: Prepare Data
        training_state.update({"status": "preparing", "message": "Organizing dataset..."})
        prepare_data_split()
        
        # Step 3: Train
        training_state.update({"status": "training", "message": "Training YOLOv8 model..."})
        
        # Load base model for training (can use 'yolov8n-cls.pt' or existing 'best.pt')
        # Using existing best.pt to fine-tune is usually better if classes are added
        train_model = YOLO('yolov8n-cls.pt') 
        
        # Train
        results = train_model.train(
            data=str(DATA_DIR),
            epochs=20, # Keep it short for demo; increase for real usage
            imgsz=224,
            batch=16,
            project=str(RESULTS_DIR.parent), # e:\leaf\results (parent of parent is root, project arg creates subdir)
            name='results',
            exist_ok=True # Overwrite existing 'results' folder
        )
        
        # Step 4: Update Global Model
        training_state.update({"status": "finalizing", "message": "Reloading model..."})
        
        # path is project/name/weights/best.pt -> e:\leaf\results\weights\best.pt
        # Ultralytics saves to {project}/{name}/weights/best.pt
        # Here project=e:\leaf, name=results -> e:\leaf\results\weights\best.pt
        
        global model
        model = YOLO(str(WEIGHTS_PATH))
        
        # validation metrics
        metrics = results.results_dict if hasattr(results, 'results_dict') else str(results)
        
        training_state.update({
            "status": "completed", 
            "message": "Training successful! content updated.",
            "result": {
                "metrics": metrics
            }
        })
        
    except Exception as e:
        print(f"Training failed: {e}")
        training_state.update({"status": "error", "message": str(e)})

# --- Routes ---

@app.route('/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({'error': 'Model not loaded'}), 500

    filepath = None 

    # Handle File Upload
    if 'file' in request.files:
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        if file:
            filename = f"temp_{uuid.uuid4().hex}.jpg"
            filepath = os.path.join('.', filename)
            file.save(filepath)

    # Handle URL
    elif request.form.get('url') or (request.json and request.json.get('url')):
        url = request.form.get('url') or request.json.get('url')
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            filename = f"temp_{uuid.uuid4().hex}.jpg"
            filepath = os.path.join('.', filename)
            with open(filepath, 'wb') as f:
                f.write(response.content)
        except Exception as e:
            return jsonify({'error': f"Failed to download image: {str(e)}"}), 400

    else:
        return jsonify({'error': 'No file or URL provided'}), 400

    if filepath:
        try:
            results = model(filepath)
            top1_index = results[0].probs.top1
            top1_conf = results[0].probs.top1conf.item()
            class_name = results[0].names[top1_index]
            
            clean_probs = {}
            if results[0].probs.top5:
                 for i in results[0].probs.top5:
                     clean_probs[results[0].names[i]] = float(results[0].probs.data[i])
            else:
                 for i, prob in enumerate(results[0].probs.data):
                     if prob > 0.01:
                        clean_probs[results[0].names[i]] = float(prob)

            if os.path.exists(filepath):
                os.remove(filepath)
            
            return jsonify({
                'class': class_name,
                'confidence': float(top1_conf),
                'all_probs': clean_probs
            })
            
        except Exception as e:
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Processing failed'}), 500

@app.route('/train/start', methods=['POST'])
def start_train():
    data = request.json
    leaf_name = data.get('leaf_name')
    
    if not leaf_name:
        return jsonify({'error': 'Leaf name is required'}), 400
        
    if training_state['status'] in ['downloading', 'preparing', 'training']:
        return jsonify({'error': 'Training already in progress'}), 409
        
    # Reset state
    training_state.update({
        "status": "starting",
        "message": "Initializing training...",
        "progress": 0,
        "result": None
    })
    
    # Start background thread
    thread = threading.Thread(target=run_training_workflow, args=(leaf_name,))
    thread.start()
    
    return jsonify({'message': 'Training started successfully'})

@app.route('/train/status', methods=['GET'])
def get_status():
    return jsonify(training_state)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
