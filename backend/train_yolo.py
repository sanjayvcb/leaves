from ultralytics import YOLO

if __name__ == '__main__':
    # Load a model
    model = YOLO('yolov8n-cls.pt')  # load a pretrained model (recommended for training)

    # Train the model
    results = model.train(data='data', epochs=20, imgsz=224, batch=16, project='.', name='results')
