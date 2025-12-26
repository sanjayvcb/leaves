from ultralytics import YOLO
model = YOLO('results/weights/best.pt')  # load best model
results = model(r'E:\leaf\dataset\rose\rose_014.png')     # predict
print(results[0].probs.top1)