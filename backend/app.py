from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from ultralytics import YOLO
import os
import uuid
import shutil
import threading
import time
from pathlib import Path
import sys
import requests

# Import from local modules (now in same directory)
from download_images import download_images
from prepare_data_split import split_dataset

# Project paths
PROJECT_ROOT = Path(__file__).resolve().parent
DATASET_DIR = PROJECT_ROOT / "dataset"
DATA_DIR = PROJECT_ROOT / "data"
RESULTS_DIR = PROJECT_ROOT / "results"
WEIGHTS_PATH = RESULTS_DIR / "weights/best.pt"
TRAINED_LABELS_FILE = PROJECT_ROOT / "trained_labels.json"

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

# --- Label Tracking Functions ---

def load_trained_labels():
    """Load the list of trained labels from JSON file"""
    if TRAINED_LABELS_FILE.exists():
        try:
            import json
            with open(TRAINED_LABELS_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_trained_labels(labels):
    """Save the list of trained labels to JSON file"""
    import json
    with open(TRAINED_LABELS_FILE, 'w') as f:
        json.dump(labels, f, indent=2)

def add_trained_label(label_name):
    """Add a label to the trained labels list"""
    labels = load_trained_labels()
    normalized_label = label_name.lower().strip()
    if normalized_label not in labels:
        labels.append(normalized_label)
        save_trained_labels(labels)
        print(f"Added '{label_name}' to trained labels")

def remove_trained_label(label_name):
    """Remove a label from the trained labels list"""
    labels = load_trained_labels()
    normalized_label = label_name.lower().strip()
    if normalized_label in labels:
        labels.remove(normalized_label)
        save_trained_labels(labels)
        print(f"Removed '{label_name}' from trained labels")
        return True
    return False

def is_label_trained(label_name):
    """Check if a label has already been trained"""
    labels = load_trained_labels()
    normalized_label = label_name.lower().strip()
    return normalized_label in labels

def cleanup_after_training():
    """Clean up data folder and temporary files, but KEEP dataset for future training"""
    try:
        # NOTE: We MUST keep DATASET_DIR so we can include these images 
        # when training future leaves. If we delete it, the model will 
        # forget previous classes!
        
        # Delete data folder (split dataset) - we recreate this each time
        if DATA_DIR.exists():
            shutil.rmtree(DATA_DIR)
            print("Cleaned up data directory")
            
        # Optional: Clean up runs folder if it exists (YOLO artifacts)
        runs_dir = PROJECT_ROOT / "runs"
        if runs_dir.exists():
            shutil.rmtree(runs_dir)
            print("Cleaned up runs directory")
            
        # Keep only the weights in results folder
        # Delete everything except weights folder
        if RESULTS_DIR.exists():
            for item in RESULTS_DIR.iterdir():
                if item.name != 'weights':
                    if item.is_dir():
                        shutil.rmtree(item)
                    else:
                        item.unlink()
            print("Cleaned up results folder (kept weights)")
    except Exception as e:
        print(f"Cleanup error: {e}")

# --- Helper Functions ---

def download_images_for_preview(keyword, max_images=20):
    """Download images and return paths for preview"""
    print(f"=== PREVIEW START: Downloading preview images for '{keyword}' ===")
    sys.stdout.flush()
    folder_name = keyword.split(' ')[0].lower()
    print(f"Folder name: {folder_name}, Dataset dir: {DATASET_DIR}")
    sys.stdout.flush()
    
    # Use the download_images function from the module
    # Pass DATASET_DIR to ensure images are saved in the correct location
    print(f"Calling download_images with keyword='{keyword}', max_images={max_images}, base_dir={DATASET_DIR}")
    sys.stdout.flush()
    download_images([keyword], max_images=max_images, base_dir=str(DATASET_DIR))
    print("download_images call completed")
    sys.stdout.flush()
    
    # Get the downloaded image paths
    save_dir = DATASET_DIR / folder_name
    print(f"Checking save_dir: {save_dir}, exists: {save_dir.exists()}")
    sys.stdout.flush()
    if save_dir.exists():
        images = [f for f in save_dir.iterdir() if f.is_file() and f.suffix.lower() in ['.jpg', '.jpeg', '.png']]
        print(f"Found {len(images)} images in {save_dir}")
        sys.stdout.flush()
        return [str(img.relative_to(DATASET_DIR)) for img in images]
    print("save_dir does not exist, returning empty list")
    sys.stdout.flush()
    return []

def prepare_data_split():
    """Prepare train/val split using the existing module"""
    # Clear existing data dir to ensure fresh split
    if DATA_DIR.exists():
        shutil.rmtree(DATA_DIR)
    
    # Use the split_dataset function from the module
    split_dataset(str(DATASET_DIR), output_dir=str(DATA_DIR), train_ratio=0.8)

def run_training_workflow(leaf_name):
    global model
    global training_state
    
    try:
        # Step 1: Download (if not already downloaded in preview)
        folder_name = leaf_name.split(' ')[0].lower()
        
        # Check if images already exist from preview
        if not (DATASET_DIR / folder_name).exists() or len(list((DATASET_DIR / folder_name).glob('*'))) < 20:
            training_state.update({"status": "downloading", "message": f"Downloading images for {leaf_name}..."})
            download_images([f"{leaf_name} leaf"], max_images=50, base_dir=str(DATASET_DIR))
        
        # Step 2: Prepare Data
        training_state.update({"status": "preparing", "message": "Organizing dataset..."})
        prepare_data_split()
        
        # Step 3: Train
        training_state.update({"status": "training", "message": "Training YOLOv8 model..."})
        
        # Load base model for training (can use 'yolov8n-cls.pt' or existing 'best.pt')
        # Using existing best.pt to fine-tune is usually better if classes are added
        train_model = YOLO('yolov8n-cls.pt') 
        
        # Verify data directory exists
        if not DATA_DIR.exists():
            raise FileNotFoundError(f"Data directory not found at: {DATA_DIR}")
        
        # Check for train/val folders
        if not (DATA_DIR / 'train').exists() or not (DATA_DIR / 'val').exists():
             raise FileNotFoundError(f"Data directory missing train/val folders at: {DATA_DIR}")

        print(f"Training with data path: {str(DATA_DIR.resolve())}")
        
        # Train
        results = train_model.train(
            data=str(DATA_DIR.resolve()), # key change: ensure absolute resolved path
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
        
        # Step 5: Cleanup and save label
        training_state.update({"status": "finalizing", "message": "Cleaning up temporary files..."})
        
        # Add label to trained labels
        add_trained_label(leaf_name)
        
        # Cleanup dataset and data folders
        cleanup_after_training()
        
        training_state.update({
            "status": "completed", 
            "message": "Training successful! Model updated and temporary files cleaned.",
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
    
    # Check if label is already trained
    if is_label_trained(leaf_name):
        return jsonify({
            'error': f"'{leaf_name}' has already been trained. Please choose a different leaf name.",
            'already_trained': True
        }), 409
        
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

@app.route('/train/labels', methods=['GET'])
def get_trained_labels():
    """Get list of all trained labels"""
    labels = load_trained_labels()
    return jsonify({
        'labels': labels,
        'count': len(labels)
    })

@app.route('/train/labels/<label_name>', methods=['DELETE'])
def delete_trained_label(label_name):
    """Delete a trained label and its dataset"""
    try:
        # 1. Remove from trained_labels.json
        start_time = time.time()
        was_removed = remove_trained_label(label_name)
        
        # 2. Delete dataset folder
        folder_name = label_name.split(' ')[0].lower()
        dataset_path = DATASET_DIR / folder_name
        
        folder_removed = False
        if dataset_path.exists():
            shutil.rmtree(dataset_path)
            folder_removed = True
            
        if not was_removed and not folder_removed:
            return jsonify({'error': f"Label '{label_name}' not found"}), 404
            
        return jsonify({
            'message': f"Successfully deleted '{label_name}'",
            'label_removed': was_removed,
            'folder_removed': folder_removed
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/train/upload', methods=['POST'])
def upload_training_images():
    """Upload multiple images for training"""
    try:
        leaf_name = request.form.get('leaf_name')
        if not leaf_name:
            return jsonify({'error': 'Leaf name is required'}), 400
        
        files = request.files.getlist('images')
        if not files or len(files) == 0:
            return jsonify({'error': 'No images provided'}), 400
        
        # Create folder for this leaf type
        folder_name = leaf_name.split(' ')[0].lower()
        save_dir = DATASET_DIR / folder_name
        save_dir.mkdir(parents=True, exist_ok=True)
        
        # Save each uploaded image
        uploaded_count = 0
        uploaded_paths = []
        
        for file in files:
            if file.filename == '':
                continue
                
            # Generate unique filename
            ext = os.path.splitext(file.filename)[1] or '.jpg'
            filename = f"{folder_name}_{int(time.time())}_{uploaded_count}{ext}"
            filepath = save_dir / filename
            
            # Save file
            file.save(str(filepath))
            uploaded_paths.append(str(filepath.relative_to(DATASET_DIR)))
            uploaded_count += 1
        
        print(f"Uploaded {uploaded_count} images for '{leaf_name}'")
        
        return jsonify({
            'success': True,
            'count': uploaded_count,
            'images': [f"/train/images/{path}" for path in uploaded_paths],
            'leaf_name': leaf_name
        })
        
    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/train/preview', methods=['POST'])
def preview_training():
    data = request.json
    leaf_name = data.get('leaf_name')
    max_images = data.get('max_images', 20)
    
    if not leaf_name:
        return jsonify({'error': 'Leaf name is required'}), 400
    
    try:
        # Download images using the modular function
        image_paths = download_images_for_preview(f"{leaf_name} leaf", max_images=max_images)
        
        # Return list of image URLs that frontend can fetch
        image_urls = [f"/train/images/{path}" for path in image_paths]
        
        return jsonify({
            'success': True,
            'images': image_urls,
            'count': len(image_urls),
            'leaf_name': leaf_name
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/train/images/<path:filepath>')
def serve_training_image(filepath):
    """Serve images from the dataset directory"""
    try:
        return send_from_directory(DATASET_DIR, filepath)
    except Exception as e:
        return jsonify({'error': str(e)}), 404

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    app.run(debug=debug, host='0.0.0.0', port=port)
