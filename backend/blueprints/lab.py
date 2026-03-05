from flask import Blueprint, request, jsonify
from bson import ObjectId
from pymongo import MongoClient
import os
from datetime import datetime
from werkzeug.utils import secure_filename

lab_bp = Blueprint("lab_bp", __name__)
client = MongoClient("mongodb://localhost:27017/")
db = client["hospital_db"]
patients_collection = db["patients"]

UPLOAD_FOLDER = r"backend\uploads"
BASE_PATH = "/mypatient/uploads"   # This will be stored in DB
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------------- ADD LAB REPORT ----------------
@lab_bp.route("/api/lab-reports/add", methods=["POST"])
def add_lab_report():
    # For file upload, use request.form
    patientId = request.form.get("patientId")
    date = request.form.get("date")
    testName = request.form.get("testName")
    results = request.form.get("results")
    file = request.files.get("file")  # file object

    if not all([patientId, date, testName, results, file]):
        return jsonify({"message": "All fields are required"}), 400

    # ---------------- SAVE FILE TO UPLOADS FOLDER ----------------
    filename = file.filename
    file_path = os.path.join(UPLOAD_FOLDER, filename)  # Actual location
    file.save(file_path)

    # ---------------- STORE VIRTUAL PATH FOR DB ----------------
    db_file_path = f"/mypatient/uploads/{filename}"

    # Check if patient exists
    patient = patients_collection.find_one({"patientId": patientId})
    if not patient:
        return jsonify({"message": "Patient not found"}), 404

    # New lab report structure
    new_report = {
        "_id": ObjectId(),
        "date": date,
        "testName": testName,
        "results": results,
        "file": db_file_path  # ✅ store only the relative/virtual path
    }

    # Update MongoDB patient record
    result = patients_collection.update_one(
        {"_id": patient["_id"]},
        {"$push": {"labReports": new_report}}
    )

    if result.modified_count == 1:
        new_report["_id"] = str(new_report["_id"])
        return jsonify({
            "message": "Lab report added",
            "labReport": new_report
        }), 201
    else:
        return jsonify({"message": "Failed to add lab report"}), 500

# ---------------- GET LAB REPORTS ----------------
@lab_bp.route("/api/patients/<patientId>/lab-reports", methods=["GET"])
def get_lab_reports(patientId):
    patient = patients_collection.find_one({"patientId": patientId})
    if not patient:
        return jsonify({"message": "Patient not found"}), 404

    lab_reports = patient.get("labReports", [])
    for report in lab_reports:
        if "_id" in report:
            report["_id"] = str(report["_id"])

    return jsonify(lab_reports)
