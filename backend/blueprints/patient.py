import os
from flask import Blueprint, request, jsonify, send_from_directory
from pymongo import MongoClient
from bson import ObjectId
import datetime
from werkzeug.utils import secure_filename

patient_bp = Blueprint("patient_bp", __name__)
client = MongoClient("mongodb://localhost:27017/")
db = client.hospital_db

def serialize_doc(doc):
    """Recursively convert ObjectIds into strings"""
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    elif isinstance(doc, dict):
        new_doc = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                new_doc[k] = str(v)
            else:
                new_doc[k] = serialize_doc(v)
        return new_doc
    else:
        return doc


# ✅ Get patient info by patientId
@patient_bp.route("/<patient_id>", methods=["GET"])
def get_patient(patient_id):
    try:
        patient = db.patients.find_one({"patientId": patient_id})
        if not patient:
            return jsonify({"message": "Patient not found"}), 404

        # Fetch assigned doctor details
        assigned_doctor = None
        if "assignedDoctor" in patient and patient["assignedDoctor"]:
            try:
                doctor_obj_id = (
                    patient["assignedDoctor"]
                    if isinstance(patient["assignedDoctor"], ObjectId)
                    else ObjectId(patient["assignedDoctor"])
                )
                doctor = db.staff.find_one({"_id": doctor_obj_id})
                if doctor:
                    assigned_doctor = {
                        "id": str(doctor["_id"]),
                        "name": doctor.get("name"),
                        "department": doctor.get("department"),
                        "specialization": doctor.get("specialization"),
                        "email": doctor.get("email"),
                    }
            except Exception as e:
                print(f"❌ Doctor fetch error: {e}")

        # Prepare patient data (serialize nested ObjectIds)
        patient_data = {
            "patientId": patient.get("patientId"),
            "name": patient.get("name"),
            "age": patient.get("age"),
            "gender": patient.get("gender"),
            "type": patient.get("type"),
            "medicalSpecialty": patient.get("medicalSpecialty"),
            "contact": patient.get("contact", {}),
            "insurance": patient.get("insurance", {}),
            "wardNumber": patient.get("wardNumber", ""),
            "cartNumber": patient.get("cartNumber", ""),
            "admissionDate": patient.get("admissionDate", ""),
            "status": patient.get("status", ""),
            "assignedDoctor": assigned_doctor,
            "appointments": serialize_doc(patient.get("appointments", [])),
            "prescriptions": serialize_doc(patient.get("prescriptions", [])),
            "labReports": clean_lab_reports(patient.get("labReports", [])),
        }

        return jsonify(patient_data), 200

    except Exception as e:
        print(f"❌ Error fetching patient: {str(e)}")
        return jsonify({"message": "Error fetching patient", "error": str(e)}), 500


# ✅ Get prescriptions for a patient
@patient_bp.route("/<patient_id>/prescriptions", methods=["GET"])
def get_prescriptions(patient_id):
    try:
        patient = db.patients.find_one({"patientId": patient_id})
        if not patient:
            return jsonify({"message": "Patient not found"}), 404

        prescriptions = serialize_doc(patient.get("prescriptions", []))
        return jsonify(prescriptions), 200

    except Exception as e:
        print(f"❌ Error fetching prescriptions: {str(e)}")
        return jsonify({"message": "Error fetching prescriptions", "error": str(e)}), 500


# ✅ Get all patients
@patient_bp.route("/", methods=["GET"])
def get_all_patients():
    try:
        patients = list(db.patients.find())
        patients = serialize_doc(patients)
        return jsonify(patients), 200
    except Exception as e:
        print(f"❌ Error fetching patients: {str(e)}")
        return jsonify({"message": "Error fetching patients", "error": str(e)}), 500


# ✅ Serve uploaded lab report files
UPLOAD_FOLDER = r"backend\uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@patient_bp.route("/uploads/<path:filename>")
def uploaded_file(filename):
    try:
        safe_name = secure_filename(filename)  # prevents path traversal
        return send_from_directory(
            UPLOAD_FOLDER,
            safe_name,
            as_attachment=False
        )
    except FileNotFoundError:
        return "File not found on server", 404


def clean_lab_reports(lab_reports):
    cleaned = []
    for report in lab_reports:
        cleaned.append({
            "date": report.get("date"),
            "testName": report.get("testName"),
            "results": report.get("results"),
            "file": report.get("file")  # ideally just filename
        })
    return cleaned
