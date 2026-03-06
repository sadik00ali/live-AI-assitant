from flask import Flask, request,Blueprint, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import datetime
import bcrypt

import base64
from bson.binary import Binary
from flask import Response

# Initialize Flask
# admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")
# CORS(admin_bp)
  # Allow React frontend to connect
admin_bp = Blueprint("admin", __name__)
# MongoDB Connection
client = MongoClient("mongodb://localhost:27017/")
db = client["hospital_db"]
staff_collection = db["staff"]
departments_collection = db["departments"]
patients_collection = db["patients"]
emergency_collection = db["emergency_cases"]
wards_collection = db["wards"]

# Helper functions
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    # Handle ObjectId fields that might be present
    if "assignedDoctor" in doc and doc["assignedDoctor"] and isinstance(doc["assignedDoctor"], ObjectId):
        doc["assignedDoctor"] = str(doc["assignedDoctor"])
    return doc

def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]

# ================== STAFF ENDPOINTS ==================

# Get all staff
@admin_bp.route("/api/staff", methods=["GET"])
def get_staff():
    staff = list(staff_collection.find({}, {"_id": 1, "name": 1, "role": 1, "department": 1, "email": 1, "phone": 1, "status": 1, "staffId": 1}))
    return jsonify(serialize_docs(staff))

# Get staff by ID
@admin_bp.route("/staff/<id>", methods=["GET"])
def get_staff_by_id(id):
    try:
        staff = staff_collection.find_one({"_id": ObjectId(id)})
        if not staff:
            return jsonify({"error": "Staff not found"}), 404
        return jsonify(serialize_doc(staff))
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Add new staff
@admin_bp.route("/api/staff", methods=["POST"])
def add_staff():
    data = request.json
    if not data or "name" not in data or "role" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    staff_collection.insert_one(data)
    return jsonify({"message": "Staff added successfully"}), 201

# Update staff
@admin_bp.route("/staff/<id>", methods=["PUT"])
def update_staff(id):
    try:
        data = request.json
        update_data = {k: v for k, v in data.items() if v is not None}
        if "password" in update_data:
            update_data["password"] = bcrypt.hashpw(update_data["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        result = staff_collection.update_one({"_id": ObjectId(id)}, {"$set": update_data})
        if result.modified_count == 0:
            return jsonify({"error": "Staff not updated"}), 404
        updated_staff = staff_collection.find_one({"_id": ObjectId(id)})
        return jsonify(serialize_doc(updated_staff))
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Delete staff
@admin_bp.route("/staff/<id>", methods=["DELETE"])
def delete_staff(id):
    try:
        result = staff_collection.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Staff not found"}), 404
        return jsonify({"message": "Staff deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Get departments
@admin_bp.route("/api/departments", methods=["GET"])
def get_departments():
    departments = list(departments_collection.find({}, {"_id": 1, "name": 1}))
    return jsonify(serialize_docs(departments))

# Get available doctors by specialty
@admin_bp.route("/staff/available", methods=["GET"])
def get_available_doctors():
    specialty = request.args.get("specialty")
    query = {"role": "doctor", "status": "active"}
    if specialty:
        query["department"] = specialty
    docs = list(staff_collection.find(query))
    return jsonify(serialize_docs(docs))

# ================== PATIENT ENDPOINTS ==================

# Get all patients
# Get all patients
from bson import ObjectId
from flask import jsonify

def serialize_doc(doc):

    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]

    elif isinstance(doc, dict):
        new_doc = {}

        for k, v in doc.items():

            if k == "patientImage":
                continue   # 🚨 REMOVE IMAGE BEFORE JSON RESPONSE

            if isinstance(v, ObjectId):
                new_doc[k] = str(v)
            else:
                new_doc[k] = serialize_doc(v)

        return new_doc

    else:
        return doc

@admin_bp.route("/api/patients", methods=["GET"])
def get_patients():
    patients = list(patients_collection.find())

    for patient in patients:
        # Get assigned doctor name
        if patient.get("assignedDoctor"):
            try:
                doctor = staff_collection.find_one({"_id": ObjectId(patient["assignedDoctor"])})
                patient["assignedDoctorName"] = doctor["name"] if doctor else None
            except:
                patient["assignedDoctorName"] = None
        else:
            patient["assignedDoctorName"] = None

    # ✅ Serialize everything before jsonify
    serialized_patients = serialize_doc(patients)
    return jsonify(serialized_patients)

# Add new patient
@admin_bp.route("/api/patients", methods=["POST"])
def add_patient():
    try:

        data = request.form
        image = request.files.get("image")

        # ---------- IMAGE → BASE64 → BSON BINARY ----------
        patient_image = None

        if image:
            img_bytes = image.read()
            b64_bytes = base64.b64encode(img_bytes)

            patient_image = Binary(
                base64.b64decode(b64_bytes),
                subtype=0
            )
        # --------------------------------------------------

        patient_type = data.get("type", "OPD")
        status = "admitted" if patient_type == "IPD" else "registered"
        admission_date = datetime.datetime.now() if patient_type == "IPD" else None

        assigned_doctor = None
        if data.get("assignedDoctor"):
            assigned_doctor = ObjectId(data.get("assignedDoctor"))

        patient_doc = {
                "patientId": f"P-{str(ObjectId())[:8]}",
                "name": data.get("name"),
                "age": data.get("age"),
                "gender": data.get("gender"),
                "bloodGroup": data.get("bloodGroup"),
                "type": patient_type,
                "medicalSpecialty": data.get("medicalSpecialty"),
                "description": data.get("description"),
                "password": data.get("password"),

                "contact": {
                    "phone": data.get("phone"),
                    "email": data.get("email"),
                    "address": data.get("address"),
                },

                "insurance": {
                    "provider": data.get("provider"),
                    "policyNumber": data.get("policyNumber"),
                },

                "assignedDoctor": assigned_doctor,

                # 🚨 NEW FLOW
                "approvalStatus": "pending",
                "status": "waiting",
                "wardNumber": None,
                "cartNumber": None,

                "requestedAt": datetime.datetime.now(),
                "patientImage": patient_image
            }
        result = patients_collection.insert_one(patient_doc)

        return jsonify({
            "message": "Patient added successfully",
            "_id": str(result.inserted_id)
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
# ------------------- EDIT PATIENT -------------------
@admin_bp.route("/api/patients/<id>", methods=["PUT"])
def edit_patient(id):
    try:

        data = request.form
        image = request.files.get("image")

        update_data = dict(data)

        # ---------- IMAGE UPDATE ----------
        if image:
            img_bytes = image.read()
            b64_bytes = base64.b64encode(img_bytes)

            update_data["patientImage"] = Binary(
                base64.b64decode(b64_bytes),
                subtype=0
            )
        # -----------------------------------

        if "assignedDoctor" in update_data and update_data["assignedDoctor"]:
            update_data["assignedDoctor"] = ObjectId(update_data["assignedDoctor"])

        result = patients_collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Patient not found"}), 404

        return jsonify({"message": "Patient updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# image fetcch api
import io

@admin_bp.route("/api/patient/image/<patient_id>")
def get_patient_image(patient_id):

    patient = patients_collection.find_one({"_id": ObjectId(patient_id)})

    if not patient or not patient.get("patientImage"):
        return jsonify({"error": "Image not found"}), 404

    # 🔥 BSON Binary → PURE BYTES
    image_bytes = bytes(patient["patientImage"])

    return Response(
        io.BytesIO(image_bytes),
        mimetype="image/jpeg"
    )
# ------------------- DELETE PATIENT -------------------
@admin_bp.route("/api/patients/<id>", methods=["DELETE"])
def delete_patient(id):
    result = patients_collection.delete_one({"_id": ObjectId(id)})

    if result.deleted_count == 0:
        return jsonify({"error": "Patient not found"}), 404

    return jsonify({"message": "Patient deleted successfully"}), 200

# ================== WARD & BED MANAGEMENT ==================
@admin_bp.route("/api/beds", methods=["GET"])
def get_beds():
    try:
        patients = list(patients_collection.find())
        patients_dict = {}

        for p in patients:
            ward = p.get("wardNumber")
            bed = p.get("cartNumber")
            if ward and bed:
                doctor_name = None
                if p.get("assignedDoctor"):
                    try:
                        doctor = staff_collection.find_one({"_id": ObjectId(p["assignedDoctor"])})
                        doctor_name = doctor["name"] if doctor else None
                    except:
                        doctor_name = None
                p["doctorName"] = doctor_name
                if p.get("admissionDate"):
                    p["admissionDate"] = str(p["admissionDate"])
                patients_dict[(ward, bed)] = p

        # get wards from DB
        wards_data = list(wards_collection.find({}, {"_id": 1, "name": 1, "specialty": 1}))

        wards = []
        for idx, ward_doc in enumerate(wards_data, start=1):
            beds = []
            for bed_num in range(1, 11):
                patient = patients_dict.get((str(idx), str(bed_num))) or patients_dict.get((idx, bed_num))
                bed = {
                    "bedNumber": bed_num,
                    "status": "Admitted" if patient else "Available",
                    "admissionDate": patient.get("admissionDate") if patient else None,
                    "patient": {
                        "name": patient.get("name"),
                        "age": patient.get("age"),
                        "gender": patient.get("gender"),
                        "diagnosis": patient.get("medicalSpecialty"),
                        "doctor": patient.get("doctorName")
                    } if patient else None
                }
                beds.append(bed)  # FIXED: Changed admin_bpend to append

            ward = {
                "_id": str(ward_doc["_id"]),
                "name": ward_doc["name"],
                "specialty": ward_doc.get("specialty", "General"),  # fetch from DB
                "beds": beds
            }
            wards.append(ward)  # FIXED: Changed admin_bpend to append

        return jsonify(wards)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    # ================== DASHBOARD STATS ==================
@admin_bp.route("/api/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    try:
        # Patients
        total_patients = patients_collection.count_documents({})
        admitted = patients_collection.count_documents({"status": "admitted"})
        discharged = patients_collection.count_documents({"status": "discharged"})

        # Staff
        total_staff = staff_collection.count_documents({})
        doctors = staff_collection.count_documents({"role": "doctor"})
        nurses = staff_collection.count_documents({"role": "nurse"})

        # Beds
        total_beds = 5 * 10  # 5 wards * 10 beds
        occupied_beds = patients_collection.count_documents({"wardNumber": {"$ne": None}})

        # Inventory (replace with real inventory collection if you have one)
        inventory_items = 100
        low_stock = 10

        # Alerts (example static, replace with real logic if needed)
        alerts = 5
        critical_alerts = 2

        # Bed occupancy percentage
        bed_occupancy = f"{int((occupied_beds / total_beds) * 100)}%"

        return jsonify({
            "patients": total_patients,
            "admitted": admitted,
            "discharged": discharged,
            "staff": total_staff,
            "doctors": doctors,
            "nurses": nurses,
            "bedOccupancy": bed_occupancy,
            "totalBeds": total_beds,
            "occupiedBeds": occupied_beds,
            "inventoryItems": inventory_items,
            "lowStock": low_stock,
            "alerts": alerts,
            "criticalAlerts": critical_alerts
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    # 
    

# ================== EMERGENCY WARD ENDPOINTS ==================
from bson import ObjectId
import datetime

# Helper function to serialize MongoDB documents
def serialize_docs(docs):
    """Convert MongoDB documents to JSON serializable format"""
    for doc in docs:
        doc['_id'] = str(doc['_id'])
        if 'assignedDoctor' in doc and doc['assignedDoctor']:
            doc['assignedDoctor'] = str(doc['assignedDoctor'])
    return docs

# Get all emergency wards
@admin_bp.route("/api/emergency-wards", methods=["GET"])
def get_emergency_wards():
    try:
        print("Fetching emergency wards...")  # Add debug print
        wards = list(wards_collection.find({"type": "emergency"}))
        print(f"Found {len(wards)} emergency wards")  # Add debug print
        return jsonify(serialize_docs(wards)), 200
    except Exception as e:
        print(f"Error in get_emergency_wards: {str(e)}")  # Add debug print
        return jsonify({"error": str(e)}), 500
# Get available beds in emergency wards
@admin_bp.route("/api/emergency-beds", methods=["GET"])
def get_emergency_beds():
    try:
        # Get all emergency wards
        wards = list(wards_collection.find({"type": "emergency"}))
        
        # Get all admitted patients in emergency wards
        emergency_patients = list(patients_collection.find({
            "wardType": "emergency",
            "status": "admitted"
        }))
        
        # Create a map of occupied beds by wardNumber and bedNumber
        occupied_beds = {}
        for patient in emergency_patients:
            ward_num = patient.get("wardNumber")
            bed_num = patient.get("bedNumber")
            if ward_num and bed_num:
                key = f"{ward_num}-{bed_num}"
                occupied_beds[key] = patient
        
        # Prepare bed data
        bed_data = []
        for ward in wards:
            ward_name = ward.get("name", "")
            total_beds = ward.get("beds", 0)
            
            for bed_number in range(1, total_beds + 1):
                bed_key = f"{ward.get('_id')}-{bed_number}"  # Use ward ID instead of name
                
                # Check if this specific bed is occupied
                is_occupied = False
                patient_in_bed = None
                
                for key, patient in occupied_beds.items():
                    if (str(patient.get("wardNumber")) == str(ward.get("_id")) and 
                        str(patient.get("bedNumber")) == str(bed_number)):
                        is_occupied = True
                        patient_in_bed = patient
                        break
                
                bed_info = {
                    "wardId": str(ward["_id"]),
                    "wardName": ward_name,
                    "wardType": ward["type"],
                    "bedNumber": bed_number,
                    "status": "occupied" if is_occupied else "available",
                    "specialty": ward.get("specialty", "general"),
                    "totalBeds": total_beds,
                    "availableBeds": total_beds - sum(1 for p in occupied_beds.values() 
                                                     if str(p.get("wardNumber")) == str(ward.get("_id")))
                }
                
                if is_occupied and patient_in_bed:
                    bed_info["patient"] = {
                        "name": patient_in_bed.get("name", "Unknown"),
                        "condition": patient_in_bed.get("condition", "Unknown"),
                        "patientId": patient_in_bed.get("patientId", ""),
                        "assignedDoctor": str(patient_in_bed.get("assignedDoctor", "")) if patient_in_bed.get("assignedDoctor") else None
                    }
                
                bed_data.append(bed_info)  # FIXED: Changed admin_bpend to append
        
        return jsonify(bed_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get doctors by specialty
@admin_bp.route("/api/doctors", methods=["GET"])
def get_doctors():
    try:
        specialty = request.args.get("specialty")
        available_only = request.args.get("available", "true").lower() == "true"
        
        query = {"role": "doctor"}
        if specialty:
            query["department"] = specialty
        if available_only:
            query["status"] = "active"
        
        doctors = list(staff_collection.find(query, {
            "_id": 1, 
            "name": 1, 
            "department": 1, 
            "specialty": 1, 
            "status": 1,
            "email": 1,
            "phone": 1
        }))
        
        return jsonify(serialize_docs(doctors)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Create new emergency case
@admin_bp.route("/api/emergency", methods=["POST"])
def create_emergency_case():
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ["patientName", "age", "gender", "condition"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Handle doctor assignment
        assigned_doctor = None
        if data.get("assignedDoctor"):
            try:
                assigned_doctor = ObjectId(data["assignedDoctor"])
                # Verify doctor exists
                doctor = staff_collection.find_one({"_id": assigned_doctor, "role": "doctor"})
                if not doctor:
                    return jsonify({"error": "Doctor not found"}), 404
            except:
                return jsonify({"error": "Invalid doctor ID"}), 400
        
        # Check if bed is available
        if data.get("ward") and data.get("bedNumber"):
            existing_patient = patients_collection.find_one({
                "wardNumber": data["ward"],
                "bedNumber": data["bedNumber"],
                "status": "admitted"
            })
            if existing_patient:
                return jsonify({"error": "Bed is already occupied"}), 400
        
        # Create emergency case record
        emergency_doc = {
            "patientName": data["patientName"],
            "age": data["age"],
            "gender": data["gender"],
            "condition": data["condition"],
            "priority": data.get("priority", "medium"),
            "description": data.get("description", ""),
            "ward": data.get("ward"),
            "bedNumber": data.get("bedNumber"),
            "assignedDoctor": assigned_doctor,
            "status": "active",
            "createdAt": datetime.datetime.now()
        }
        
        # Insert into emergency collection
        result = emergency_collection.insert_one(emergency_doc)
        emergency_id = str(result.inserted_id)
        
        # Generate patient ID
        patient_id = f"EM-{datetime.datetime.now().strftime('%Y%m%d')}-{str(result.inserted_id)[:4]}"
        
        # Create a patient record
        patient_doc = {
            "patientId": patient_id,
            "name": data["patientName"],
            "age": data["age"],
            "gender": data["gender"],
            "condition": data["condition"],
            "type": "emergency",
            "wardType": "emergency",
            "wardNumber": data.get("ward"),
            "bedNumber": data.get("bedNumber"),
            "assignedDoctor": assigned_doctor,
            "status": "admitted",
            "admissionDate": datetime.datetime.now(),
            "emergencyCaseId": emergency_id
        }
        
        patients_collection.insert_one(patient_doc)
        
        # Update doctor status if assigned
        if assigned_doctor:
            staff_collection.update_one(
                {"_id": assigned_doctor},
                {"$set": {"status": "unavailable"}}
            )
        
        return jsonify({
            "message": "Emergency case created successfully",
            "emergencyId": emergency_id,
            "patientId": patient_id
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get all emergency cases
@admin_bp.route("/api/emergency", methods=["GET"])
def get_emergency_cases():
    try:
        status_filter = request.args.get("status")
        
        query = {}
        if status_filter:
            query["status"] = status_filter
        
        cases = list(emergency_collection.find(query).sort("createdAt", -1))
        
        # Enhance cases with doctor information
        for case in cases:
            if case.get("assignedDoctor"):
                doctor = staff_collection.find_one({"_id": case["assignedDoctor"]})
                case["doctorName"] = doctor["name"] if doctor else "Unknown"
            else:
                case["doctorName"] = None
                
            # Check if patient is still admitted
            patient = patients_collection.find_one({"emergencyCaseId": str(case["_id"])})
            case["patientAdmitted"] = patient is not None
        
        return jsonify(serialize_docs(cases)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500