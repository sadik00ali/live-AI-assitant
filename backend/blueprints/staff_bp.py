from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId, errors
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")

doct_db = Blueprint("doct_db", __name__)

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["hospital_db"]
staff_collection = db["staff"]
patients_collection = db["patients"]
# ---------------- GET DOCTOR PROFILE ----------------
@doct_db.route("/api/staff/<doctor_id>", methods=["GET"])
def get_doctor_profile(doctor_id):
    try:
        doctor = staff_collection.find_one({"_id": ObjectId(doctor_id)})
        if not doctor:
            return jsonify({"message": "Doctor not found"}), 404

        # Convert ObjectId to string for JSON serialization
        doctor["_id"] = str(doctor["_id"])
        return jsonify(doctor)
    except errors.InvalidId:
        return jsonify({"message": "Invalid doctor ID"}), 400

# ---------------- TOGGLE STATUS ----------------
@doct_db.route("/api/staff/<doctor_id>/status", methods=["PUT"])
def update_doctor_status(doctor_id):
    try:
        data = request.get_json()
        new_status = data.get("status")
        if new_status not in ["active", "inactive"]:
            return jsonify({"message": "Invalid status"}), 400

        staff_collection.update_one(
            {"_id": ObjectId(doctor_id)},   # convert string to ObjectId
            {"$set": {"status": new_status}}
        )

        return jsonify({"message": "Status updated", "status": new_status}), 200
    except Exception as e:
        print("Error updating status:", e)
        return jsonify({"message": "Error updating status", "error": str(e)}), 500

# ---------------- GET PATIENTS BY DOCTOR ----------------
# @doct_db.route("/api/patients/by-doctor/<doctor_id>", methods=["GET"])
# def get_patients_by_doctor(doctor_id):
#     try:
#         doctor_obj_id = ObjectId(doctor_id)
#     except errors.InvalidId:
#         return jsonify({"message": "Invalid doctor ID"}), 400

#     patients_cursor = patients_collection.find({"assignedDoctor": doctor_obj_id})
#     patients = []

#     for patient in patients_cursor:
#         patient["_id"] = str(patient["_id"])
#         if "assignedDoctor" in patient and isinstance(patient["assignedDoctor"], ObjectId):
#             patient["assignedDoctor"] = str(patient["assignedDoctor"])

#         if "prescriptions" in patient:
#             for pres in patient["prescriptions"]:
#                 if "_id" in pres and isinstance(pres["_id"], ObjectId):
#                     pres["_id"] = str(pres["_id"])

#         patients.append(patient)

    # return jsonify(patients)
# ---------------- GET PATIENTS BY DOCTOR ----------------
# ---------------- GET PATIENTS BY DOCTOR ----------------
from bson import ObjectId, errors

@doct_db.route("/api/patients/by-doctor/<doctor_id>", methods=["GET"])
def get_patients_by_doctor(doctor_id):
    try:
        doctor_obj_id = ObjectId(doctor_id)
    except errors.InvalidId:
        return jsonify({"message": "Invalid doctor ID"}), 400

    patients_cursor = patients_collection.find({"assignedDoctor": doctor_obj_id})
    patients = []

    for patient in patients_cursor:
        # Convert top-level _id to string
        patient["_id"] = str(patient["_id"])

        # Convert assignedDoctor to string if it exists
        if "assignedDoctor" in patient and isinstance(patient["assignedDoctor"], ObjectId):
            patient["assignedDoctor"] = str(patient["assignedDoctor"])

        # Convert labReports _id to string if present
        if "labReports" in patient:
            for report in patient["labReports"]:
                if "_id" in report and isinstance(report["_id"], ObjectId):
                    report["_id"] = str(report["_id"])

        # Convert prescriptions _id to string if present
        if "prescriptions" in patient:
            for pres in patient["prescriptions"]:
                if "_id" in pres and isinstance(pres["_id"], ObjectId):
                    pres["_id"] = str(pres["_id"])

        patients.append(patient)

    return jsonify(patients)


def analyze_with_cdss(patient, medicines):

    allergy = patient.get("allergies", [])
    chronic = patient.get("chronicConditions", [])
    egfr = patient.get("organFunction", {}).get("eGFR")

    prompt = f"""
You are a Clinical Decision Support System.

Patient Allergy: {allergy}
Chronic Conditions: {chronic}
eGFR: {egfr}

New Medicines:
{medicines}

Check:
1. Allergy Risk
2. Kidney Contraindication
3. Drug Interaction
4. Dosage Safety

Respond ONLY in JSON format.

NO explanation.
NO text.
NO markdown.

Example:

{{
 "riskLevel":"HIGH",
 "decision":"REJECT",
 "reason":["Penicillin allergy"]
}}
"""

    try:

        response = model.generate_content(prompt)

        raw_text = response.text.strip()

        # Remove ```json if Gemini adds
        raw_text = raw_text.replace("```json", "").replace("```", "").strip()

        return json.loads(raw_text)

    except Exception as e:
        print("CDSS Gemini Error:", e)
        return {
            "riskLevel":"UNKNOWN",
            "decision":"ALLOW",
            "reason":["CDSS unavailable"]
        }

# ---------------- ADD PRESCRIPTION ----------------
@doct_db.route("/api/patients/<patient_id>/prescriptions", methods=["POST"])
def add_prescription(patient_id):
    try:
        patient_obj_id = ObjectId(patient_id)
    except errors.InvalidId:
        return jsonify({"message": "Invalid patient ID"}), 400

    data = request.get_json()

    patient = patients_collection.find_one({"_id": patient_obj_id})

    cdss_result = analyze_with_cdss(patient, data["medicines"])

    cdss_result = analyze_with_cdss(patient, data["medicines"])

    if cdss_result["decision"] == "REJECT":
        return jsonify({
            "message": "Prescription Rejected by CDSS",
            "cdss_analysis": cdss_result["reason"]
        }), 400


    if not data.get("date") or not data.get("medicines"):
        return jsonify({"message": "Date and medicines are required"}), 400

    new_prescription = {
        "_id": ObjectId(),
        "date": data["date"],
        "medicines": data["medicines"]
    }

    result = patients_collection.update_one(
        {"_id": patient_obj_id},
        {"$push": {"prescriptions": new_prescription}}
    )

    if result.modified_count == 1:
        new_prescription["_id"] = str(new_prescription["_id"])
        return jsonify({"message": "Prescription added", "prescription": new_prescription}), 201
    else:
        return jsonify({"message": "Failed to add prescription"}), 500
    
# # ---------------- Medicine data collecction ----------------
medicine_collection = db["medicine_data"]

@doct_db.route("/api/medicines", methods=["GET"])
def get_medicines():
    medicines = []
    cursor = medicine_collection.find().limit(500)

    for med in cursor:
        medicines.append({
            "id": str(med["_id"]),
            "name": med.get("name"),
            "composition": [
                med.get("short_composition1", "").strip(),
                med.get("short_composition2", "").strip()
            ]
        })

    return jsonify(medicines)
