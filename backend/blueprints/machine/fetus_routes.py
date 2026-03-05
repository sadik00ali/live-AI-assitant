# backend/blueprints/machine/fetus_predict.py

from flask import Blueprint, request, jsonify
from ultralytics import YOLO
import cv2
import numpy as np
import base64
import io

fetus_bp = Blueprint('fetus_bp', __name__)

# Load YOLOv8 model once
MODEL_PATH = r'blueprints\machine\fetus.pt'
model = YOLO(MODEL_PATH)

@fetus_bp.route('/predict', methods=['POST'])
def predict_fetus():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files['image']
    in_memory_file = file.read()

    # Convert bytes to OpenCV image
    np_img = np.frombuffer(in_memory_file, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    # Run prediction
    results = model.predict(img, conf=0.25, show=False, save=False)
    result = results[0]

    # Annotate image in memory
    annotated_img = result.plot()
    _, buffer = cv2.imencode('.jpg', annotated_img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')  # Convert to base64 for React

    # Collect detection info
    detections = []
    for box in result.boxes:
        detections.append({
            "class": model.names[int(box.cls[0].item())],
            "confidence": float(box.conf[0].item())
        })

    return jsonify({
        "detections": detections,
        "image": f"data:image/jpeg;base64,{img_base64}"
    })
