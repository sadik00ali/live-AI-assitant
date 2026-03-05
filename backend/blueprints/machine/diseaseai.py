import random
from flask import Blueprint, request, jsonify
from ultralytics import YOLO

# -------------------------------
# CONFIGURATION
# -------------------------------
MODEL_PATH = r"blueprints\machine\diseaseai.pt"
DOCTOR_NAMES = [
    "Dr. Emily Carter",
    "Dr. Ben Casey",
    "Dr. Christina Yang",
    "Dr. John Watson"
]

# -------------------------------
# INIT BLUEPRINT + MODEL
# -------------------------------
disease_bp = Blueprint("disease_bp", __name__)

print("Loading YOLO model inside Blueprint...")
try:
    model = YOLO(MODEL_PATH)
    print("✅ Model loaded successfully in Blueprint.")
except Exception as e:
    print(f"❌ Error loading YOLO model: {e}")
    model = None


# -------------------------------
# ROUTE: PREDICT
# -------------------------------
@disease_bp.route("/predict", methods=["POST"])
def predict():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "Empty filename"}), 400

        # DEBUG print
        print(f"📂 Received file: {file.filename}")

        # Save file temporarily
        temp_path = "temp_upload.jpg"
        file.save(temp_path)

        # Run YOLO inference
        results = model.predict(source=temp_path, save=False, show=False)
        print("✅ YOLO inference complete")

        top_class_name = "unknown"
        top_confidence = 0.0

        if results:
            result = results[0]
            if hasattr(result, "probs") and result.probs is not None:
                top_class_index = int(result.probs.top1)
                top_confidence = float(result.probs.top1conf)
                top_class_name = model.names.get(top_class_index, "unknown")
            else:
                print("⚠️ No probs attribute found (maybe detection model?)")

        selected_doctor = random.choice(DOCTOR_NAMES)
        response_text = (
            f"Based on the analysis, the predicted class is '{top_class_name}' "
            f"with a confidence of {top_confidence:.2f}. Please consult a medical "
            f"professional for a proper diagnosis. "
            f"Consultation provided by *{selected_doctor}*."
        )

        return jsonify({
            "predicted_class": top_class_name,
            "confidence": round(top_confidence, 4),
            "doctor": selected_doctor,
            "ai_response": response_text
        })

    except Exception as e:
        import traceback
        print("❌ Error during prediction:", str(e))
        traceback.print_exc()   # 🔥 full error in Flask console
        return jsonify({"error": str(e)}), 500
