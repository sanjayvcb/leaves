import gradio as gr
from ultralytics import YOLO
from pathlib import Path
import json

# Load model
MODEL_PATH = Path("backend/results/weights/best.pt")
if MODEL_PATH.exists():
    model = YOLO(str(MODEL_PATH))
    print(f"✅ Loaded trained model from {MODEL_PATH}")
else:
    model = YOLO("yolov8s-cls.pt")
    print("⚠️ Using base model (no trained weights found)")

# Load trained labels
LABELS_FILE = Path("backend/trained_labels.json")
trained_labels = []
if LABELS_FILE.exists():
    with open(LABELS_FILE, 'r') as f:
        trained_labels = json.load(f)

def predict_leaf(image):
    """Predict leaf type from image"""
    if image is None:
        return "Please upload an image", None
    
    try:
        # Run prediction
        results = model(image)
        
        # Get top prediction
        top1_index = results[0].probs.top1
        top1_conf = results[0].probs.top1conf.item()
        class_name = results[0].names[top1_index]
        
        # Get all probabilities
        probs_dict = {}
        for i, prob in enumerate(results[0].probs.data):
            if prob > 0.01:  # Only show >1% confidence
                probs_dict[results[0].names[i]] = float(prob)
        
        # Sort by confidence
        sorted_probs = dict(sorted(probs_dict.items(), key=lambda x: x[1], reverse=True))
        
        # Create result text
        result_text = f"""
## 🌿 Prediction Result

**Species:** {class_name.title()}  
**Confidence:** {top1_conf * 100:.1f}%

### All Predictions:
"""
        for name, conf in list(sorted_probs.items())[:5]:
            result_text += f"- **{name.title()}**: {conf * 100:.1f}%\n"
        
        return result_text, sorted_probs
        
    except Exception as e:
        return f"❌ Error: {str(e)}", None

def get_trained_labels_text():
    """Get formatted text of trained labels"""
    if trained_labels:
        return "**Trained leaf types:** " + ", ".join([l.title() for l in trained_labels])
    return "No trained models yet. Using base model."

# Create Gradio interface
with gr.Blocks(theme=gr.themes.Soft(), title="🌿 Leaf Classifier") as demo:
    gr.Markdown("""
    # 🌿 Leaf Classifier
    Upload an image of a leaf to identify its species using AI-powered classification.
    """)
    
    gr.Markdown(get_trained_labels_text())
    
    with gr.Row():
        with gr.Column():
            image_input = gr.Image(
                label="Upload Leaf Image",
                type="pil",
                sources=["upload", "webcam"]
            )
            predict_btn = gr.Button("🔍 Identify Leaf", variant="primary", size="lg")
        
        with gr.Column():
            result_output = gr.Markdown(label="Results")
            probs_output = gr.Label(label="Confidence Scores", num_top_classes=5)
    
    # Examples
    gr.Markdown("### 📸 Try these examples:")
    gr.Examples(
        examples=[],  # Add example images here if you have them
        inputs=image_input,
    )
    
    # Connect button
    predict_btn.click(
        fn=predict_leaf,
        inputs=image_input,
        outputs=[result_output, probs_output]
    )
    
    gr.Markdown("""
    ---
    ### ℹ️ About
    This AI model uses YOLOv8 for leaf classification. Upload a clear image of a leaf for best results.
    
    **Tips for best results:**
    - Use clear, well-lit images
    - Center the leaf in the frame
    - Avoid blurry or dark images
    """)

# Launch
if __name__ == "__main__":
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False
    )
