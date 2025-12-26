from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import os
import uuid

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load model
# Assuming the script runs from 'backend' folder, but weights are in 'e:/leaf/results/...'
# Let's use absolute path or relative to project root if we run from root.
# Better to use absolute path or robust relative path.
MODEL_PATH = r'../results/weights/best.pt' 
try:
    model = YOLO(MODEL_PATH)
except Exception as e:
    print(f"Error loading model from {MODEL_PATH}: {e}")
    # Fallback or exit if model not found
    model = None

@app.route('/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({'error': 'Model not loaded'}), 500

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        # Save temp file
        filename = f"temp_{uuid.uuid4().hex}.jpg"
        filepath = os.path.join('.', filename)
        file.save(filepath)

        try:
            # Predict
            results = model(filepath)
            
            # Extract results
            top1_index = results[0].probs.top1
            top1_conf = results[0].probs.top1conf.item()
            class_name = results[0].names[top1_index]
            
            # Clean up
            os.remove(filepath)
            
            return jsonify({
                'class': class_name,
                'confidence': float(top1_conf),
                'all_probs': {results[0].names[i]: float(c) for i, c in enumerate(results[0].probs.data.tolist())}
            })
            
        except Exception as e:
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
