---
title: Leaf Backend
emoji: 🌿
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
---

# Leaf Classification Backend

This is the Flask backend for the Leaf Classification project.
It uses YOLOv8 for classification and provides training capabilities.

## API Endpoints

- `POST /predict`: Predict leaf type from image.
- `POST /train/start`: Start training a new leaf type.
- `GET /train/status`: Check training status.
